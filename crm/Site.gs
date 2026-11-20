/**
 * =============================================================
 * SITE ⇄ CRM · Nutrensinando
 * -------------------------------------------------------------
 * 1) CRM → SITE
 *    Todo produto com "Mostrar no site = Sim" aparece sozinho no site
 *    (nutrensinando-paginas.vercel.app) e no robô do Telegram:
 *      - Evento  → aba Eventos do site (some depois da data)
 *      - Curso/Ebook → aba Cursos do site
 *    Status "Planejado" = "em breve"; "Inscrições abertas" = botão de
 *    inscrição; vagas cheias = "esgotado"; "Encerrado" = sai do site.
 *    Endereço público (só dados dos produtos, nenhum dado de pessoas):
 *      URL_APP_WEB + '?api=site'
 *
 * 2) SYMPLA / HOTMART → CRM
 *    Cada compra vira contato + inscrição, sem digitar nada.
 *      - Hotmart: webhook → site (api/hotmart) → doPost daqui (tipo 'compra')
 *      - Sympla:  o CRM consulta o Sympla de hora em hora (sincronizarSympla)
 *    Tudo fica anotado na aba "Integrações".
 *
 * Senhas (Configurações do projeto → Propriedades do script):
 *    ROBO_SEGREDO  → mesma senha da variável CRM_SEGREDO na Vercel
 *    SYMPLA_TOKEN  → token da API do Sympla (dá para salvar pelo painel)
 * =============================================================
 */

const ABA_INTEGRACOES = 'Integrações';
const CAB_INTEGRACOES = ['Data/hora', 'Plataforma', 'Código da compra', 'Situação', 'Produto', 'Pessoa', 'E-mail',
  'ID do contato', 'ID da inscrição', 'O que o CRM fez'];
const CHAVE_CACHE_SITE = 'api_site_v1';

// ------------------------------------------------------------
// Estrutura: colunas novas em Produtos + aba Integrações
// (pode rodar de novo sem apagar nada)
// ------------------------------------------------------------
function configurarSite() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  criarAba_(ss, ABAS.PRODUTOS);
  garantirAbaIntegracoes_();
  ['Sympla', 'Hotmart', 'Site'].forEach(function (o) { garantirNaLista_('origens', o); });
  ['Sympla', 'Hotmart'].forEach(function (o) { garantirNaLista_('canais', o); });
  limparCacheSite_();
  return 'Produtos prontos para o site ✅';
}

function produtosTemColunasSite_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABAS.PRODUTOS);
  return sh && sh.getMaxColumns() >= SCHEMA[ABAS.PRODUTOS].cab.length &&
    sh.getRange(1, 12).getValue() === SCHEMA[ABAS.PRODUTOS].cab[11];
}

function garantirAbaIntegracoes_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA_INTEGRACOES);
  if (sh) return sh;
  sh = ss.insertSheet(ABA_INTEGRACOES);
  sh.getRange(1, 1, 1, CAB_INTEGRACOES.length).setValues([CAB_INTEGRACOES]);
  estilizarCabecalho_(sh.getRange(1, 1, 1, CAB_INTEGRACOES.length));
  sh.getRange(1, 1, sh.getMaxRows(), CAB_INTEGRACOES.length).setFontFamily(FONTE).setFontSize(10);
  [140, 90, 150, 90, 220, 180, 200, 90, 100, 360].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 36);
  sh.setTabColor(CORES.laranja);
  return sh;
}

// ------------------------------------------------------------
// 1) CRM → SITE
// ------------------------------------------------------------
function apiSite_(e) {
  const cache = CacheService.getScriptCache();
  let txt = cache.get(CHAVE_CACHE_SITE);
  if (!txt) {
    txt = JSON.stringify(dadosParaSite_());
    try { cache.put(CHAVE_CACHE_SITE, txt, 300); } catch (err) { /* grande demais: segue sem cache */ }
  }
  return ContentService.createTextOutput(txt).setMimeType(ContentService.MimeType.JSON);
}

function limparCacheSite_() {
  try { CacheService.getScriptCache().remove(CHAVE_CACHE_SITE); } catch (e) { }
}

function sim_(v) { return /^s/i.test(String(v || '').trim()); }

function precoTexto_(v) {
  const n = Number(v);
  if (v === '' || v === null || isNaN(n)) return String(v || '');
  if (n === 0) return 'Gratuito';
  const inteiro = Math.round(n) === n;
  const partes = n.toFixed(inteiro ? 0 : 2).split('.');
  return 'R$ ' + partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (inteiro ? '' : ',' + partes[1]);
}

/** Só o que o site precisa. Nenhum dado de contato sai daqui. */
function dadosParaSite_() {
  const hoje = hoje_iso_();
  const ocupadas = {};
  lerObjetos_(ABAS.INSCRICOES).forEach(function (i) {
    if (i.id && i.produto && i.statusPgto !== 'Reembolsado') ocupadas[i.produto] = (ocupadas[i.produto] || 0) + 1;
  });
  const eventos = [], cursos = [];
  lerObjetos_(ABAS.PRODUTOS).forEach(function (p) {
    if (!p.id || !p.nome || !sim_(p.site) || p.status === 'Encerrado') return;
    const cap = Number(p.capacidade) || 0;
    const usadas = ocupadas[p.id] || 0;
    const esgotado = cap > 0 && usadas >= cap;
    const situacao = p.status === 'Inscrições abertas' ? (esgotado ? 'esgotado' : 'disponivel') : 'em_breve';
    const link = situacao === 'disponivel' ? String(p.linkInscricao || '').trim() : '';
    if (p.tipo === 'Evento') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(p.data)) && p.data < hoje) return;
      const restam = cap - usadas;
      eventos.push({
        id: p.id, titulo: p.nome, data: p.data, horario: p.horario, formato: p.formato, local: p.local,
        descricao: p.descricao, preco: precoTexto_(p.preco), plataforma: p.plataforma || '',
        vagas: !cap ? '' : esgotado ? 'Vagas esgotadas' : restam <= 10 ? 'Últimas ' + restam + ' vagas' : cap + ' vagas',
        link_inscricao: link, status: situacao
      });
    } else {
      const horas = Number(p.cargaHoraria);
      cursos.push({
        id: p.id, titulo: p.nome, subtitulo: p.descricao, imagem: p.imagem, professora: p.professora,
        carga_horaria: horas ? horas + (horas === 1 ? ' hora' : ' horas') : String(p.cargaHoraria || ''),
        para_quem: p.paraQuem,
        o_que_aprende: String(p.topicos || '').split(/\n|;/).map(function (t) { return t.trim(); }).filter(String),
        tem_certificado: sim_(p.certificado) ? 'sim' : 'não',
        preco_a_partir: precoTexto_(p.preco), plataforma: p.plataforma || '',
        link_compra: link, status: situacao, destaque: sim_(p.destaque) ? 'sim' : 'não'
      });
    }
  });
  eventos.sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });
  return { ok: true, atualizado: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm"), eventos: eventos, cursos: cursos };
}

/** Painel: cria (sem id) ou atualiza (com id) um produto, com os campos do site. */
function painelSalvarProduto(f) {
  if (!f || !f.nome) throw new Error('Informe o nome do produto.');
  const lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try {
    if (!produtosTemColunasSite_()) configurarSite();
    const valores = [
      f.nome, f.tipo, f.formato, numero_(f.cargaHoraria), numero_(f.preco), f.plataforma, data_(f.data),
      f.local, numero_(f.capacidade), f.status || 'Planejado',
      f.site ? 'Sim' : 'Não', f.descricao, f.horario, String(f.linkInscricao || '').trim(),
      String(f.codigoPlataforma || '').trim(), f.professora, f.paraQuem, f.topicos,
      f.certificado || 'Sim', String(f.imagem || '').trim(), f.destaque ? 'Sim' : 'Não'
    ];
    let id = f.id;
    if (!id) {
      id = adicionarLinha_(ABAS.PRODUTOS, valores);
    } else {
      const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABAS.PRODUTOS);
      const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
      let r = -1;
      for (let i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === id) { r = i + 2; break; }
      if (r < 0) throw new Error('Produto não encontrado: ' + id);
      sh.getRange(r, 2, 1, valores.length).setValues([valores]);
    }
    limparCacheSite_();
    return id;
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------
// 2) SYMPLA / HOTMART → CRM
// ------------------------------------------------------------
const STATUS_COMPRA = { pago: 'Pago', pendente: 'Pendente', reembolsado: 'Reembolsado', cancelado: 'Reembolsado' };

function normalizarTexto_(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Acha o produto pelo código na plataforma, pelo link de inscrição ou pelo nome. */
function acharProduto_(codigo, nome) {
  const ps = lerObjetos_(ABAS.PRODUTOS).filter(function (p) { return p.id; });
  const cod = String(codigo || '').trim();
  if (cod) {
    let p = ps.filter(function (x) { return String(x.codigoPlataforma || '').trim() === cod; })[0];
    if (p) return p;
    const re = new RegExp('[/=]' + cod.replace(/[^\w-]/g, '') + '(?:[/?#&]|$)');
    p = ps.filter(function (x) { return x.linkInscricao && re.test(String(x.linkInscricao)); })[0];
    if (p) return p;
  }
  const n = normalizarTexto_(nome);
  return n ? (ps.filter(function (x) { return normalizarTexto_(x.nome) === n; })[0] || null) : null;
}

function acharContatoPorEmail_(email) {
  const alvo = String(email || '').trim().toLowerCase();
  if (alvo.indexOf('@') < 1) return '';
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABAS.CONTATOS);
  const ultima = sh.getLastRow();
  if (ultima < 2) return '';
  const v = sh.getRange(2, 1, ultima - 1, COL_C.EMAIL).getValues();
  for (let i = 0; i < v.length; i++) {
    if (v[i][0] && String(v[i][COL_C.EMAIL - 1]).trim().toLowerCase() === alvo) return v[i][0];
  }
  return '';
}

/** Última linha da aba Integrações para essa compra (para não lançar duas vezes). */
function acharNoLog_(plataforma, codigo) {
  const sh = garantirAbaIntegracoes_();
  const ultima = sh.getLastRow();
  if (ultima < 2 || !codigo) return null;
  const v = sh.getRange(2, 1, ultima - 1, CAB_INTEGRACOES.length).getValues();
  let achou = null;
  for (let i = 0; i < v.length; i++) {
    if (v[i][1] === plataforma && String(v[i][2]) === String(codigo)) {
      achou = { linha: i + 2, situacao: v[i][3], contato: v[i][7], inscricao: v[i][8] || (achou && achou.inscricao) || '' };
    }
  }
  return achou;
}

function anotar_(c, situacao, produto, contato, inscricao, oQueFez) {
  garantirAbaIntegracoes_().appendRow([
    new Date(), c.plataforma, String(c.codigoCompra || ''), situacao, produto || c.nomeProduto || '',
    c.nome || '', c.email || '', contato || '', inscricao || '', oQueFez
  ]);
}

/**
 * Registra uma compra vinda de uma plataforma.
 * c = { plataforma, codigoCompra, codigoProduto, nomeProduto, nome, email, telefone,
 *       valor, situacao ('pago'|'pendente'|'reembolsado'|'cancelado'), data ('aaaa-mm-dd'), cupom }
 */
function registrarCompra_(c) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (!c || !c.plataforma || !c.codigoCompra) return { ok: false, erro: 'compra sem plataforma ou código' };
    const situacao = STATUS_COMPRA[c.situacao] ? c.situacao : 'pendente';
    const statusPgto = STATUS_COMPRA[situacao];
    const antes = acharNoLog_(c.plataforma, c.codigoCompra);

    // Já está no CRM: só atualiza o pagamento quando muda
    if (antes && antes.inscricao) {
      if (antes.situacao === situacao) return { ok: true, inscricao: antes.inscricao, semMudanca: true };
      painelAtualizarInscricao(String(antes.inscricao), { statusPgto: statusPgto });
      anotar_(c, situacao, '', antes.contato, antes.inscricao, 'Pagamento atualizado para "' + statusPgto + '"');
      limparCacheSite_();
      return { ok: true, inscricao: antes.inscricao, atualizada: true };
    }
    const valida = situacao === 'pago' || situacao === 'pendente';
    // Já anotada antes sem produto: tenta de novo (o código pode ter sido preenchido depois)
    if (antes && antes.contato && valida) {
      const p = acharProduto_(c.codigoProduto, c.nomeProduto);
      if (!p) return { ok: true, semMudanca: true, produtoNaoEncontrado: true };
      const insc = salvarInscricao({
        contato: String(antes.contato), produto: p.id, data: c.data || hoje_iso_(), valor: c.valor, cupom: c.cupom || '',
        plataforma: c.plataforma, status: statusPgto, conclusao: 'Não', certificado: 'Não'
      });
      anotar_(c, situacao, p.nome, antes.contato, insc, 'Inscrição criada (o produto foi encontrado agora)');
      limparCacheSite_();
      return { ok: true, contato: antes.contato, inscricao: insc };
    }
    if (antes && antes.situacao === situacao) return { ok: true, semMudanca: true };
    if (!valida) {
      anotar_(c, situacao, '', '', '', 'Nada lançado: compra cancelada antes de ser paga');
      return { ok: true, ignorada: true };
    }

    // Contato: acha pelo e-mail ou WhatsApp; se não existir, cria
    const whats = formatarWhats_(c.telefone);
    let contato = acharContatoPorEmail_(c.email) || acharContatoPorWhats_(whats);
    if (!contato) {
      garantirNaLista_('origens', c.plataforma);
      contato = salvarContato({
        nome: String(c.nome || c.email || 'Compra ' + c.plataforma).slice(0, 80), email: c.email, whatsapp: whats,
        origem: c.plataforma, etapa: 'Interessado', lgpd: false, obs: 'Cadastrada automaticamente por uma compra na ' + c.plataforma
      });
      painelAtualizarContato(contato, { qualificado: 'A avaliar', mvp: 'Não' });
    } else {
      const campos = {};
      const atual = D_contato_(contato);
      if (atual && !atual.email && c.email) campos.email = c.email;
      if (atual && !atual.whatsapp && whats) campos.whatsapp = whats;
      if (Object.keys(campos).length) painelAtualizarContato(contato, campos);
    }

    const produto = acharProduto_(c.codigoProduto, c.nomeProduto);
    if (!produto) {
      garantirNaLista_('canais', c.plataforma);
      salvarInteracao({
        contato: contato, canal: c.plataforma, data: c.data || hoje_iso_(),
        resumo: 'Comprou "' + (c.nomeProduto || 'produto') + '" na ' + c.plataforma + ' (' + statusPgto.toLowerCase() + '), mas esse produto não foi achado no CRM.',
        proxAcao: 'Lançar a inscrição à mão (e preencher o código na plataforma no produto)', proxData: hoje_iso_()
      });
      anotar_(c, situacao, '', contato, '', '⚠️ Produto não encontrado no CRM: confira o "Código na plataforma" do produto');
      return { ok: true, contato: contato, produtoNaoEncontrado: true };
    }

    const inscricao = salvarInscricao({
      contato: contato, produto: produto.id, data: c.data || hoje_iso_(), valor: c.valor, cupom: c.cupom || '',
      plataforma: c.plataforma, status: statusPgto, conclusao: 'Não', certificado: 'Não'
    });
    anotar_(c, situacao, produto.nome, contato, inscricao, 'Inscrição criada (' + statusPgto + ')');
    limparCacheSite_();
    return { ok: true, contato: contato, inscricao: inscricao };
  } catch (err) {
    try { anotar_(c || {}, 'erro', '', '', '', '❌ ' + String(err && err.message || err)); } catch (e) { }
    return { ok: false, erro: String(err && err.message || err) };
  } finally {
    lock.releaseLock();
  }
}

function D_contato_(id) {
  return lerObjetos_(ABAS.CONTATOS).filter(function (x) { return x.id === id; })[0] || null;
}

// ------------------------------------------------------------
// Sympla: consulta os participantes de hora em hora
// ------------------------------------------------------------
function codigoSympla_(p) {
  const cod = String(p.codigoPlataforma || '').trim();
  if (cod) return cod;
  const m = String(p.linkInscricao || '').match(/sympla\.com\.br\/[^?#]*?\/(\d{4,})(?:[/?#]|$)/);
  return m ? m[1] : '';
}

function telefoneDoFormulario_(form) {
  const item = (form || []).filter(function (x) { return /whats|celular|telefone|fone/i.test(String(x.name || '')); })[0];
  return item ? item.value : '';
}

function situacaoSympla_(t) {
  if (/cancel/i.test(String(t.ticket_status || ''))) return 'cancelado';
  const st = String(t.order_status || '').toUpperCase();
  if (!st || st === 'A') return 'pago';
  if (st === 'P') return 'pendente';
  if (st === 'R') return 'reembolsado';
  return 'cancelado';
}

/** Busca todos os participantes de um evento (aceita a API nova, com cursor, e a antiga, com página). */
function participantesSympla_(idEvento, token) {
  const base = 'https://api.sympla.com.br/public/';
  const pedir = function (url) {
    const r = UrlFetchApp.fetch(url, { headers: { s_token: token, Accept: 'application/json' }, muteHttpExceptions: true });
    const cod = r.getResponseCode();
    if (cod === 204) return { vazio: true };
    if (cod !== 200) return { erro: cod };
    return JSON.parse(r.getContentText() || '{}');
  };
  let todos = [], cursor = '', n = 0, j;
  do {
    j = pedir(base + 'v1.6.0/events/' + encodeURIComponent(idEvento) + '/participants?page_size=200&cancelled_filter=include' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    if (j.erro || j.vazio) break;
    todos = todos.concat(j.data || []);
    cursor = j.pagination && j.pagination.next_cursor;
    n++;
  } while (cursor && n < 30);
  if (j && j.erro && !todos.length) {
    // API antiga (v1.5.1), paginada por número
    let pagina = 1;
    do {
      j = pedir(base + 'v1.5.1/events/' + encodeURIComponent(idEvento) + '/participants?page_size=200&page=' + pagina);
      if (j.erro) throw new Error('Sympla respondeu ' + j.erro + ' para o evento ' + idEvento + (j.erro === 401 ? ' (token inválido)' : ''));
      if (j.vazio) break;
      todos = todos.concat(j.data || []);
      pagina++;
    } while (j.pagination && j.pagination.has_next && pagina < 30);
  }
  return todos;
}

function sincronizarSympla() {
  const token = PropertiesService.getScriptProperties().getProperty('SYMPLA_TOKEN');
  if (!token) return 'Falta o token do Sympla (⚙️ Configurações → Integrações).';
  const limite = Utilities.formatDate(new Date(Date.now() - 15 * 864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const produtos = lerObjetos_(ABAS.PRODUTOS).filter(function (p) {
    return p.id && p.plataforma === 'Sympla' && codigoSympla_(p) && (p.status !== 'Encerrado' || String(p.data) >= limite);
  });
  let novas = 0, atualizadas = 0;
  const erros = [];
  produtos.forEach(function (p) {
    try {
      participantesSympla_(codigoSympla_(p), token).forEach(function (t) {
        const r = registrarCompra_({
          plataforma: 'Sympla',
          codigoCompra: t.ticket_number || t.id,
          codigoProduto: codigoSympla_(p), nomeProduto: p.nome,
          nome: [t.first_name, t.last_name].filter(Boolean).join(' '), email: t.email,
          telefone: telefoneDoFormulario_(t.custom_form),
          valor: t.ticket_sale_price, situacao: situacaoSympla_(t),
          data: String(t.order_approved_date || t.order_date || '').slice(0, 10),
          cupom: ''
        });
        if (r.inscricao && !r.semMudanca && !r.atualizada) novas++;
        if (r.atualizada) atualizadas++;
        if (!r.ok) erros.push(r.erro);
      });
    } catch (err) {
      erros.push(p.nome + ': ' + (err && err.message || err));
    }
  });
  PropertiesService.getScriptProperties().setProperty('SYMPLA_ULTIMA', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'));
  const msg = 'Sympla: ' + produtos.length + ' evento(s) conferido(s), ' + novas + ' inscrição(ões) nova(s), ' + atualizadas + ' atualizada(s)' + (erros.length ? '. Problemas: ' + erros.slice(0, 3).join(' | ') : '');
  console.log(msg);
  return msg;
}

// ------------------------------------------------------------
// Painel → ⚙️ Configurações → Integrações
// ------------------------------------------------------------
function painelIntegracao(acao, valor) {
  SEM_UI_ = true;
  const props = PropertiesService.getScriptProperties();
  const gatilhos = function () {
    return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'sincronizarSympla'; });
  };
  switch (acao) {
    case 'status':
      return {
        colunasSite: !!produtosTemColunasSite_(),
        temTokenSympla: !!props.getProperty('SYMPLA_TOKEN'),
        symplaLigado: gatilhos().length > 0,
        symplaUltima: props.getProperty('SYMPLA_ULTIMA') || '',
        hotmartLigado: !!props.getProperty('ROBO_SEGREDO'),
        linkSite: (URL_APP_WEB || '') + '?api=site'
      };
    case 'site': return configurarSite();
    case 'tokenSympla':
      if (!String(valor || '').trim()) throw new Error('Cole o token do Sympla.');
      props.setProperty('SYMPLA_TOKEN', String(valor).trim());
      return 'Token do Sympla salvo ✅';
    case 'symplaOn':
      if (!props.getProperty('SYMPLA_TOKEN')) throw new Error('Salve o token do Sympla primeiro.');
      gatilhos().forEach(function (t) { ScriptApp.deleteTrigger(t); });
      ScriptApp.newTrigger('sincronizarSympla').timeBased().everyHours(1).create();
      return 'Sympla ligado: o CRM confere as inscrições de hora em hora ✅';
    case 'symplaOff':
      gatilhos().forEach(function (t) { ScriptApp.deleteTrigger(t); });
      return 'Sincronização com o Sympla desligada';
    case 'symplaAgora': return sincronizarSympla();
  }
  throw new Error('Ação desconhecida: ' + acao);
}
