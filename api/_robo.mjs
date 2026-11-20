/* =========================================================
   CONVERSA DO ROBÔ · Nutrensinando
   ---------------------------------------------------------
   Aqui fica a conversa do robô (usada pelo api/telegram.mjs):

     Menu → [Cursos] [Eventos] [Falar com a equipe]

   - Cursos e eventos vêm da MESMA planilha do site (abas Cursos e Eventos).
   - Os textos podem ser trocados na aba "Robô" da planilha
     (colunas: Mensagem | Texto). Se a aba não existir, valem os textos abaixo.
   - "Falar com a equipe": se a aba Contatos tiver a linha
     "WhatsApp atendimento", o robô manda um botão que abre o WhatsApp
     das nutricionistas com a mensagem pronta. Se não tiver, avisa que
     elas vão responder ali mesmo e fica quieto naquela conversa por 24h.

   CRM: se a variável CRM_SEGREDO estiver na Vercel, antes de passar para a
   equipe o robô pede o número da pessoa (botão do Telegram) e grava o contato
   no CRM Nutrensinando (abas Contatos e Interações). Sem a variável, segue direto.

   Opcional (memória entre conversas, ex.: Upstash Redis pela Vercel):
     KV_REST_API_URL / KV_REST_API_TOKEN  (ou UPSTASH_REDIS_REST_URL / _TOKEN)
   O "_" no nome do arquivo faz a Vercel não tratar este arquivo como endereço.
   ========================================================= */

const PLANILHA_ID = process.env.PLANILHA_ID || "1OqUwWHoEyYROP3I-rKOwKYHMKhbaETscsKEUBEFKhRg";
const LINK_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwzXeHtvWtOHwimcLcGROb01U5CBNf_43F1xW4LimZZQtqHMT8RqKLe6tlHMCPiakk6Yw/exec";
const PAUSA_SEGUNDOS = 24 * 60 * 60;
// CRM Nutrensinando (Apps Script, função doPost). A senha fica só na Vercel (CRM_SEGREDO).
const CRM_URL = process.env.CRM_URL || "https://script.google.com/macros/s/AKfycbwb5JJiVypvAGMoNGGO2jvqIuIXXG3ZS3eRfErJ661byCRDwSI-CYIg7kubn-MWOYFafg/exec";
const CRM_SEGREDO = process.env.CRM_SEGREDO || "";
export const crmLigado = () => !!(CRM_URL && CRM_SEGREDO);

// Textos padrão. {nome} vira o primeiro nome da pessoa.
const TEXTOS_PADRAO = {
  boas_vindas: "Oi, {nome}! 💜 Aqui é a assistente da *Nutrensinando*, cursos e atualização em Nutrição com a Luana e a Taiane.\n\nSobre o que você quer saber?",
  cursos_intro: "📚 *Nossos cursos online*",
  sem_cursos: "No momento não temos cursos com inscrições abertas, mas novas turmas estão vindo! Quer falar com a equipe para ser avisada?",
  eventos_intro: "🗓️ *Próximos eventos*",
  sem_eventos: "Ainda não temos eventos com data marcada. Quer falar com a equipe para saber das próximas datas?",
  depois_da_lista: "Ficou com alguma dúvida? Posso te passar para a Luana ou a Taiane.",
  falar_equipe: "Claro! Toque no botão abaixo para falar direto com a Luana e a Taiane. A mensagem já vai pronta. 😊",
  falar_equipe_aqui: "Prontinho! A Luana ou a Taiane vai te chamar no WhatsApp assim que possível. 😊\n\nSe quiser voltar ao menu, é só escrever *menu*.",
  falar_equipe_instagram: "Você também pode falar com a Luana e a Taiane pelo Instagram. 😊",
  nao_entendi: "Não entendi muito bem 😅 Escolha uma das opções:",
  pedir_contato: "Para a Luana e a Taiane conseguirem te responder, toque em *Compartilhar meu número* aqui embaixo. 📱\n\n_Seu nome e telefone ficam guardados só com a equipe da Nutrensinando, para esse atendimento. Política de privacidade: https://nutrensinando-paginas.vercel.app/politica-privacidade.html_",
  contato_salvo: "Anotado, obrigada! 💜",
  contato_recusado: "Sem problemas! 😊"
};

/* ---------------- Planilha ---------------- */

const chave = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function lerCSV(texto) {
  const linhas = []; let linha = []; let celula = ""; let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { celula += '"'; i++; }
      else if (c === '"') aspas = false;
      else celula += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(celula); celula = ""; }
    else if (c === "\n") { linha.push(celula); linhas.push(linha); linha = []; celula = ""; }
    else if (c !== "\r") celula += c;
  }
  if (celula || linha.length) { linha.push(celula); linhas.push(linha); }
  return linhas;
}

async function baixarAba(aba) {
  const url = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(aba)}`;
  const resp = await fetch(url);
  const texto = await resp.text();
  if (!resp.ok || texto.trim().startsWith("<")) throw new Error("aba indisponível: " + aba);
  const [cab = [], ...resto] = lerCSV(texto);
  const nomes = cab.map(chave);
  // Aba inexistente: o Google devolve a primeira aba. Conferimos pelas colunas depois.
  return resto.filter((l) => l.some((c) => c.trim()))
    .map((l) => Object.fromEntries(nomes.map((n, i) => [n, (l[i] || "").trim()])));
}

const col = (linha, ...nomes) => {
  const k = Object.keys(linha).find((n) => nomes.some((x) => n.startsWith(x)));
  return k ? linha[k] : "";
};
const aparece = (l) => !/^n/i.test(col(l, "mostrar"));

let cache = { em: 0, dados: null };
export async function carregarDados() {
  if (cache.dados && Date.now() - cache.em < 60_000) return cache.dados;
  const [contatos, eventos, cursos, robo] = await Promise.all(
    ["Contatos", "Eventos", "Cursos", "Robô"].map((a) => baixarAba(a).catch(() => null))
  );
  const dados = { textos: { ...TEXTOS_PADRAO }, atendimento: "", instagram: "", cursos: [], eventos: [] };

  (contatos || []).forEach((l) => {
    const nome = chave(col(l, "informacao", "campo"));
    const valor = col(l, "valor", "resposta");
    if (valor && nome.includes("whats") && nome.includes("atend")) dados.atendimento = valor;
    if (valor && nome === "instagram") dados.instagram = valor.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  });

  // Aba Robô: só vale se tiver as colunas Mensagem e Texto
  (robo || []).forEach((l) => {
    const k = chave(col(l, "mensagem", "chave"));
    const t = col(l, "texto");
    if (k && t && k in TEXTOS_PADRAO) dados.textos[k] = t;
  });

  dados.cursos = (cursos || []).filter(aparece).filter((l) => col(l, "titulo")).map((l) => {
    const s = chave(col(l, "situacao", "status"));
    return {
      titulo: col(l, "titulo"),
      subtitulo: col(l, "subtitulo"),
      preco: col(l, "preco"),
      link: col(l, "link_da_hotmart", "link"),
      status: s.startsWith("em_breve") ? "em_breve" : s.startsWith("esgot") ? "esgotado" : "disponivel"
    };
  }).filter((c) => c.titulo);

  const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10); // horário de Brasília
  dados.eventos = (eventos || []).filter(aparece).filter((l) => col(l, "titulo") && col(l, "data")).map((l) => {
    const m = col(l, "data").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const iso = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : col(l, "data");
    const slug = col(l, "apelido", "slug");
    return {
      titulo: col(l, "titulo"),
      data: iso,
      horario: col(l, "horario"),
      formato: col(l, "formato"),
      local: col(l, "local"),
      preco: col(l, "preco"),
      link: col(l, "link_do_sympla", "sympla") || (slug ? `${LINK_APPS_SCRIPT}?evento=${encodeURIComponent(slug)}` : "")
    };
  }).filter((e) => !/^\d{4}-\d{2}-\d{2}$/.test(e.data) || e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));

  cache = { em: Date.now(), dados };
  return dados;
}

/* ---------------- Memória (pausa e mensagens repetidas) ---------------- */

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const memoria = new Map(); // reserva, caso não haja banco configurado

async function kv(...comando) {
  if (!KV_URL || !KV_TOKEN) return undefined;
  try {
    const r = await fetch(KV_URL, { method: "POST", headers: { Authorization: `Bearer ${KV_TOKEN}` }, body: JSON.stringify(comando) });
    return (await r.json()).result;
  } catch { return undefined; }
}
async function guardar(k, segundos, soSeNovo = false) {
  const r = await kv("SET", k, "1", "EX", String(segundos), ...(soSeNovo ? ["NX"] : []));
  if (r !== undefined) return r === "OK";
  const atual = memoria.get(k);
  if (soSeNovo && atual && atual > Date.now()) return false;
  memoria.set(k, Date.now() + segundos * 1000);
  return true;
}
async function existe(k) {
  const r = await kv("EXISTS", k);
  if (r !== undefined) return r === 1;
  const v = memoria.get(k);
  return !!v && v > Date.now();
}
async function apagar(k) { await kv("DEL", k); memoria.delete(k); memoriaValor.delete(k); }

// Guarda um texto curto (ex.: o assunto que a pessoa estava vendo)
const memoriaValor = new Map();
async function guardarValor(k, valor, segundos) {
  const r = await kv("SET", k, String(valor), "EX", String(segundos));
  if (r === undefined) memoriaValor.set(k, { valor: String(valor), ate: Date.now() + segundos * 1000 });
}
async function lerValor(k) {
  const r = await kv("GET", k);
  if (r !== undefined) return r || "";
  const v = memoriaValor.get(k);
  return v && v.ate > Date.now() ? v.valor : "";
}

/* ---------------- CRM ---------------- */

// Grava no CRM quem pediu atendimento. Nunca derruba a conversa se o CRM falhar.
export async function registrarNoCRM({ para, nome, telefone, usuario }) {
  if (!crmLigado()) return { ok: false, erro: "CRM desligado" };
  const assunto = await lerValor(`assunto:${para}`);
  try {
    const r = await fetch(CRM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segredo: CRM_SEGREDO, tipo: "pedido_atendimento", origem: "Telegram",
        nome, telefone, usuario, interesse: assunto === "cursos" ? "os cursos" : assunto === "eventos" ? "os eventos" : ""
      }),
      redirect: "follow"
    });
    const j = await r.json().catch(() => ({ ok: false, erro: "resposta inválida (" + r.status + ")" }));
    if (!j.ok) console.error("CRM:", j.erro);
    return j;
  } catch (e) {
    console.error("CRM:", e);
    return { ok: false, erro: String(e) };
  }
}

/* ---------------- Envio ---------------- */

// Quem chama (ex.: Telegram) recebe as respostas numa lista e manda do seu jeito
let enviar = async () => {};
export function trocarEnvio(fn) { enviar = fn; } // usado nos testes
export async function executarCom(msg, contato) {
  const saida = [];
  const anterior = enviar;
  enviar = async (c) => { saida.push(c); };
  try { await responder(msg, contato); } finally { enviar = anterior; }
  return saida;
}

const corta = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
const texto = (para, body) => enviar({ to: para, type: "text", text: { body: corta(body, 4096), preview_url: false } });
const botoes = (para, body, lista) => enviar({
  to: para, type: "interactive",
  interactive: {
    type: "button",
    body: { text: corta(body, 1024) },
    action: { buttons: lista.slice(0, 3).map(([id, titulo]) => ({ type: "reply", reply: { id, title: corta(titulo, 20) } })) }
  }
});
const botaoLink = (para, body, titulo, url) => enviar({
  to: para, type: "interactive",
  interactive: { type: "cta_url", body: { text: corta(body, 1024) }, action: { name: "cta_url", parameters: { display_text: corta(titulo, 20), url } } }
});

const pedirContato = (para, body, sim, nao) => enviar({ to: para, type: "pedir_contato", body: corta(body, 4096), sim, nao });

const MENU = [["cursos", "Cursos"], ["eventos", "Eventos"], ["equipe", "Falar com a equipe"]];
const preenche = (t, ctx) => t.replace(/\{nome\}/g, ctx.nome || "").replace(/,\s*!/, "!").replace(/Oi\s+!/, "Oi!");

// Manda a lista; se for longa, vai em texto separado e os botões depois
async function listaComBotoes(para, conteudo, rodape, extra) {
  const botoesDepois = [extra, ["equipe", "Falar com a equipe"], ["menu", "Voltar ao menu"]].filter(Boolean);
  const junto = `${conteudo}\n\n${rodape}`;
  if (junto.length <= 1024) return botoes(para, junto, botoesDepois);
  await texto(para, conteudo);
  return botoes(para, rodape, botoesDepois);
}

const dataBR = (iso) => {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}` : iso;
};

/* ---------------- Conversa ---------------- */

async function mostrarCursos(para, d, ctx) {
  await guardarValor(`assunto:${para}`, "cursos", PAUSA_SEGUNDOS);
  const lista = d.cursos.filter((c) => c.status !== "esgotado");
  if (!lista.length) return botoes(para, preenche(d.textos.sem_cursos, ctx), [["equipe", "Falar com a equipe"], ["menu", "Voltar ao menu"]]);
  ctx.interesse = "os cursos";
  const itens = lista.map((c) => {
    if (c.status === "em_breve") return `• *${c.titulo}* (em breve)`;
    return [`• *${c.titulo}*`, c.subtitulo, c.preco && `💳 ${c.preco}`, c.link && `👉 ${c.link}`].filter(Boolean).join("\n");
  });
  return listaComBotoes(para, `${preenche(d.textos.cursos_intro, ctx)}\n\n${itens.join("\n\n")}`, preenche(d.textos.depois_da_lista, ctx), ["eventos", "Ver eventos"]);
}

async function mostrarEventos(para, d, ctx) {
  await guardarValor(`assunto:${para}`, "eventos", PAUSA_SEGUNDOS);
  if (!d.eventos.length) return botoes(para, preenche(d.textos.sem_eventos, ctx), [["equipe", "Falar com a equipe"], ["menu", "Voltar ao menu"]]);
  ctx.interesse = "os eventos";
  const itens = d.eventos.map((e) => {
    const quando = [dataBR(e.data), e.horario].filter(Boolean).join(" · ");
    const onde = [e.formato, e.local].filter(Boolean).join(" · ");
    return [`• *${e.titulo}*`, quando && `📅 ${quando}`, onde && `📍 ${onde}`, e.preco && `💳 ${e.preco}`, e.link && `👉 Inscrição: ${e.link}`].filter(Boolean).join("\n");
  });
  return listaComBotoes(para, `${preenche(d.textos.eventos_intro, ctx)}\n\n${itens.join("\n\n")}`, preenche(d.textos.depois_da_lista, ctx), ["cursos", "Ver cursos"]);
}

async function falarComEquipe(para, d, ctx, assunto) {
  if (assunto) await guardarValor(`assunto:${para}`, assunto, PAUSA_SEGUNDOS);
  else assunto = await lerValor(`assunto:${para}`);
  // Antes de passar para a equipe, pede o número (só onde a plataforma permite e o CRM está ligado)
  if (ctx.podePedirContato && !ctx.contatoRespondido && crmLigado()) {
    return pedirContato(para, preenche(d.textos.pedir_contato, ctx), "📱 Compartilhar meu número", "Agora não");
  }
  const numero = String(d.atendimento).replace(/\D/g, "");
  if (numero) {
    const n = numero.length === 10 || numero.length === 11 ? "55" + numero : numero;
    const sobre = assunto === "cursos" ? " sobre os cursos" : assunto === "eventos" ? " sobre os eventos" : "";
    const msg = `Oi, Luana e Taiane! ${ctx.nome ? `Aqui é ${ctx.nome}. ` : ""}Vim pelo atendimento on-line da Nutrensinando e queria falar com vocês${sobre}.`;
    return botaoLink(para, preenche(d.textos.falar_equipe, ctx), "Falar com elas", `https://wa.me/${n}?text=${encodeURIComponent(msg)}`);
  }
  // Sem número de atendimento: quem deixou o número é chamada pela equipe (o contato está no CRM);
  // quem não deixou recebe o Instagram
  if (ctx.contatoCompartilhado) return texto(para, preenche(d.textos.falar_equipe_aqui, ctx));
  if (d.instagram) return botaoLink(para, preenche(d.textos.falar_equipe_instagram, ctx), "Abrir Instagram", `https://instagram.com/${d.instagram}`);
  return botoes(para, preenche(d.textos.nao_entendi, ctx).replace(/^.*?\s(?=Escolha)/, ""), MENU.slice(0, 2));
}

const QUER_MENU = /^(menu|inicio|início|voltar|robo|robô|0)$/;
const QUER_EQUIPE = /\b(falar|atendente|atendimento|humano|pessoa|luana|taiane|nutricionista)\b/;

export async function responder(msg, contato = {}) {
  const para = msg.from;
  const ctx = { nome: String(contato?.profile?.name || "").trim().split(/\s+/)[0] || "", podePedirContato: !!contato?.podePedirContato };

  // O Telegram pode reenviar a mesma mensagem: responde só uma vez
  if (msg.id && !(await guardar(`msg:${msg.id}`, 3 * 24 * 3600, true))) return "repetida";

  let escolha = "";
  if (msg.type === "interactive") escolha = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "";
  else if (msg.type === "button") escolha = chave(msg.button?.payload || msg.button?.text);
  const escrito = msg.type === "text" ? chave(msg.text?.body).replace(/_/g, " ") : "";

  // Atalhos digitados: 1 cursos, 2 eventos, 3 equipe, 0 menu
  const NUMEROS = { "1": "cursos", "2": "eventos", "3": "equipe" };
  if (NUMEROS[escrito]) escolha = NUMEROS[escrito];

  // Resposta ao pedido de número: o Telegram manda "contato_ok"; "Agora não" chega como texto
  if (escolha === "contato_ok" || escrito === "agora nao") {
    const d = await carregarDados();
    await enviar({ to: para, type: "text", text: { body: preenche(escolha === "contato_ok" ? d.textos.contato_salvo : d.textos.contato_recusado, ctx) }, tirarTeclado: true });
    await falarComEquipe(para, d, { ...ctx, contatoRespondido: true, contatoCompartilhado: escolha === "contato_ok" }, "");
    return "equipe";
  }

  if (QUER_MENU.test(escrito)) { await apagar(`pausa:${para}`); escolha = "menu"; }
  if (!escolha && (await existe(`pausa:${para}`))) return "pausado";

  if (!escolha && escrito) {
    if (QUER_EQUIPE.test(escrito)) escolha = "equipe";
    else if (/\bcursos?\b/.test(escrito)) escolha = "cursos";
    else if (/\beventos?\b/.test(escrito)) escolha = "eventos";
  }

  const d = await carregarDados();
  switch (escolha) {
    case "cursos": await mostrarCursos(para, d, ctx); return "cursos";
    case "eventos": await mostrarEventos(para, d, ctx); return "eventos";
    case "equipe": await falarComEquipe(para, d, ctx, /curso/.test(escrito) ? "cursos" : /evento/.test(escrito) ? "eventos" : ""); return "equipe";
    default: {
      // Primeira mensagem (ou "menu"): boas-vindas. Depois disso, mensagem solta = "não entendi"
      const novo = await guardar(`visto:${para}`, PAUSA_SEGUNDOS, true);
      const jaViu = escolha !== "menu" && !novo;
      await botoes(para, preenche(jaViu ? d.textos.nao_entendi : d.textos.boas_vindas, ctx), MENU);
      return jaViu ? "nao_entendi" : "menu";
    }
  }
}
