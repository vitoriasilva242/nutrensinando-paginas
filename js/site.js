/* =========================================================
   CONFIGURAÇÕES DO SITE · Nutrensinando
   ---------------------------------------------------------
   EVENTOS E CURSOS vêm do CRM Nutrensinando (painel → 📚 Produtos):
   todo produto com "Mostrar no site" marcado aparece aqui sozinho.
   Contatos (Telegram, Instagram, e-mail, horários) vêm da PLANILHA do
   Google (veja PLANILHA_ID abaixo). Enquanto nenhum evento/curso estiver
   marcado no CRM, valem os da planilha; e se nada carregar, os deste arquivo.
   ========================================================= */

// Código da planilha do Google que alimenta o site. É o trecho do link da planilha
// entre "/d/" e "/edit". A planilha precisa estar como "Qualquer pessoa com o link: Leitor".
const PLANILHA_ID = "1OqUwWHoEyYROP3I-rKOwKYHMKhbaETscsKEUBEFKhRg";

// Endereço do CRM (App da Web do Apps Script) + "?api=site". Só devolve os produtos
// marcados "Mostrar no site" (nenhum dado de pessoas). Deixe "" para desligar.
const LINK_CRM = "https://script.google.com/macros/s/AKfycbwb5JJiVypvAGMoNGGO2jvqIuIXXG3ZS3eRfErJ661byCRDwSI-CYIg7kubn-MWOYFafg/exec?api=site";

// Endereço do sistema de eventos (Google Apps Script). Cada evento tem uma página
// própria nele: este endereço + "?evento=" + o apelido (slug) do evento.
const LINK_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwzXeHtvWtOHwimcLcGROb01U5CBNf_43F1xW4LimZZQtqHMT8RqKLe6tlHMCPiakk6Yw/exec";

// Link da área de alunos na Hotmart (ou plataforma parecida).
// TESTE: área de alunos geral da Hotmart. Troque pelo link de vocês.
const LINK_AREA_ALUNOS = "https://consumer.hotmart.com/";

// Usuário do robô de atendimento no Telegram, sem o @ (o site abre t.me/USUARIO).
// Também dá para trocar pela planilha: aba Contatos, linha "Telegram".
const TELEGRAM = "nutrensinando_bot";

// Usuário do Instagram, sem o @
const INSTAGRAM = "nutrensinando_";

// E-mail de contato
const EMAIL = "[E-MAIL DE CONTATO]";

// Horários de atendimento. Uma linha por item.
const HORARIOS = [
  "[Segunda a sexta: 9h às 18h]",
  "[Sábado: 9h às 12h]"
];

// Próximos eventos. Para adicionar, copie um bloco { ... } e troque os textos.
// data: "AAAA-MM-DD" · formato: "Online" ou "Presencial"
// slug: o apelido do evento no sistema de eventos (o que vem depois de "?evento=")
// link_sympla: link de compra no Sympla. Deixe "" se as inscrições ainda não abriram.
// preco e vagas: textos opcionais (deixe "" para não mostrar)
const EVENTOS = [
  {
    titulo: "Nutrição Materno-Infantil na Prática",
    data: "2026-12-12",
    horario: "9h às 18h",
    formato: "Presencial",
    local: "Centro de Convenções Barra, Barra da Tijuca",
    descricao: "Da gestação à introdução alimentar: condutas baseadas em evidência para o consultório.",
    preco: "R$ 197",
    vagas: "40 vagas",
    slug: "nutricao-materno-infantil-na-pratica",
    link_sympla: "https://www.sympla.com.br/evento/nutricao-materno-infantil-na-pratica/3639130"
  }
];

// SÓ PARA A VERSÃO GOOGLE SITES (pasta google-sites/).
// Cole aqui o endereço de cada página depois de publicar o Google Sites,
// para os botões "Quero me inscrever", "Ver cursos" etc. levarem à página certa.
const PAGINAS_GOOGLE_SITES = {
  inicio: "https://sites.google.com/view/nutrensinando",
  eventos: "https://sites.google.com/view/nutrensinando/eventos",
  cursos: "https://sites.google.com/view/nutrensinando/cursos",
  privacidade: "https://sites.google.com/view/nutrensinando/pol%C3%ADtica-de-privacidade"
};

/* =========================================================
   Daqui para baixo é o funcionamento do site.
   Não precisa mexer.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const comMouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  const celular = window.matchMedia("(max-width: 899px)");

  const preenchido = (v) => v && !/^\[.*\]$/.test(String(v).trim());
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Informações que a planilha pode substituir
  const dados = {
    telegram: TELEGRAM,
    email: EMAIL,
    instagram: INSTAGRAM,
    areaAlunos: LINK_AREA_ALUNOS,
    horarios: HORARIOS,
    eventos: EVENTOS,
    cursos: window.CURSOS || []
  };
  // Abre o robô no Telegram já no assunto: "curso", "evento" ou "falar" (falar com a equipe)
  const linkRobo = (assunto = "") => {
    const u = String(dados.telegram || "").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "").trim();
    return `https://t.me/${u}${assunto ? `?start=${assunto}` : ""}`;
  };
  const sim = (v) => v === true || /^s/i.test(String(v || ""));

  // Versão Google Sites: cada aba é uma página separada, dentro de um "Incorporar"
  const modoSites = document.documentElement.classList.contains("modo-sites");
  // A página não rola por dentro quando o Google Sites mostra o bloco inteiro (bloco alto)
  const semRolagemPropria = () => document.documentElement.scrollHeight <= innerHeight + 4;
  function irParaPagina(id) {
    const url = PAGINAS_GOOGLE_SITES[id];
    if (!preenchido(url)) return;
    // O Google Sites não deixa o bloco trocar a página inteira; por isso abre em nova aba
    window.open(url, "_blank", "noopener");
  }
  if (modoSites) {
    $$('a[href="politica-privacidade.html"]').forEach((a) => {
      a.href = PAGINAS_GOOGLE_SITES.privacidade;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  /* ---------- Contatos ---------- */
  $("#ano").textContent = new Date().getFullYear();
  function desenharContatos() {
    const insta = String(dados.instagram || "").replace("@", "");
    $("#rod-robo").href = linkRobo();
    // Seção "Fale conosco": cada botão abre o robô já no assunto certo
    $$("[data-robo]").forEach((a) => { a.href = linkRobo(a.dataset.robo); });
    $("#rod-insta").href = `https://instagram.com/${insta}`;
    $("#rod-insta-txt").textContent = "@" + insta;
    // Contatos ainda não preenchidos ficam escondidos
    const temEmail = preenchido(dados.email);
    $("#rod-email").closest("li").hidden = !temEmail;
    if (temEmail) {
      $("#rod-email").href = `mailto:${dados.email}`;
      $("#rod-email-txt").textContent = dados.email;
    }
    if ($("#link-alunos")) $("#link-alunos").href = dados.areaAlunos;
    const horarios = (dados.horarios || []).filter(preenchido);
    if ($("#lista-horarios")) {
      $("#lista-horarios").innerHTML = horarios.map((h) => `<li>${esc(h)}</li>`).join("");
      $("#lista-horarios").closest(".horarios").hidden = !horarios.length;
    }
  }

  /* ---------- Abas ---------- */
  const abas = $$('[role="tab"]');
  const paineis = $$('[role="tabpanel"]');
  const metaDesc = $('meta[name="description"]');
  const flutuante = $(".cta-flutuante a");

  function abrirAba(id, { alvo = null, focar = false, atualizarEndereco = true } = {}) {
    const painel = document.getElementById(id);
    if (!painel || painel.getAttribute("role") !== "tabpanel") {
      if (modoSites && PAGINAS_GOOGLE_SITES[id]) irParaPagina(id);
      return;
    }
    const mudou = painel.hidden;

    abas.forEach((a) => {
      const ativa = a.getAttribute("aria-controls") === id;
      a.setAttribute("aria-selected", ativa);
      a.tabIndex = ativa ? 0 : -1;
    });
    paineis.forEach((p) => (p.hidden = p.id !== id));

    document.title = painel.dataset.titulo;
    metaDesc.setAttribute("content", painel.dataset.descricao);
    flutuante.textContent = painel.dataset.cta;
    flutuante.dataset.irAba = painel.dataset.ctaAba;
    flutuante.dataset.alvo = painel.dataset.ctaAlvo;
    flutuante.href = "#" + painel.dataset.ctaAlvo;

    if (atualizarEndereco && !modoSites) history.replaceState(null, "", "#" + (alvo || id));

    const destino = alvo ? document.getElementById(alvo) : null;
    if (destino) {
      requestAnimationFrame(() => {
        destino.scrollIntoView({ behavior: semMovimento.matches || mudou ? "auto" : "smooth" });
        if (focar) destino.focus({ preventScroll: true });
      });
    } else if (mudou) {
      window.scrollTo(0, 0);
      if (focar) painel.focus({ preventScroll: true });
    }
    if (mudou) requestAnimationFrame(atualizarRolagem);
  }

  abas.forEach((aba, i) => {
    aba.addEventListener("click", () => abrirAba(aba.getAttribute("aria-controls")));
    aba.addEventListener("keydown", (e) => {
      let n = null;
      if (e.key === "ArrowRight") n = (i + 1) % abas.length;
      if (e.key === "ArrowLeft") n = (i - 1 + abas.length) % abas.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = abas.length - 1;
      if (n === null) return;
      e.preventDefault();
      abas[n].focus();
      abrirAba(abas[n].getAttribute("aria-controls"));
    });
  });

  // Links que trocam de aba: data-ir-aba="eventos" data-alvo="inscricao"
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-ir-aba]");
    if (!link) return;
    e.preventDefault();
    const janela = $("#escolha");
    // "Quero me inscrever": pergunta se a pessoa quer eventos ou cursos
    if (link.dataset.irAba === "escolher") {
      if (janela && janela.showModal) janela.showModal();
      else abrirAba("eventos", { alvo: "agenda", focar: true });
      return;
    }
    if (janela && janela.open) janela.close();
    abrirAba(link.dataset.irAba, { alvo: link.dataset.alvo || null, focar: true });
  });

  // Fecha a janela de escolha pelo X ou clicando fora dela
  const janelaEscolha = $("#escolha");
  if (janelaEscolha) {
    janelaEscolha.addEventListener("click", (e) => {
      const r = janelaEscolha.getBoundingClientRect();
      const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if ((e.target === janelaEscolha && fora) || e.target.closest(".escolha__fechar")) janelaEscolha.close();
    });
  }

  // Abre a aba certa pelo endereço (ex.: site.com/#cursos ou #inscricao)
  function lerEndereco() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const el = hash && document.getElementById(hash);
    if (!el) return abrirAba(paineis[0].id, { atualizarEndereco: false });
    const painel = el.closest('[role="tabpanel"]');
    if (!painel) return;
    abrirAba(painel.id, { alvo: el === painel ? null : hash, atualizarEndereco: false });
  }
  window.addEventListener("hashchange", lerEndereco);

  /* ---------- Eventos ---------- */
  // Cada evento leva para a compra no Sympla e para a página completa do evento
  // Eventos com data que já passou somem sozinhos
  function desenharEventos() {
    if (!$("#lista-eventos")) return;
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const hoje = new Date().toISOString().slice(0, 10);
    const proximos = (dados.eventos || []).filter((ev) => !ev.data || ev.data >= hoje).sort((a, b) => String(a.data).localeCompare(String(b.data)));
    if (!proximos.length) {
      $("#lista-eventos").innerHTML = `<p class="aviso-vazio">Novos eventos em breve! Acompanhe pelo Instagram para saber primeiro.</p>`;
      return;
    }
    $("#lista-eventos").innerHTML = proximos.map((ev, i) => {
      const [a, m, d] = String(ev.data).split("-").map(Number);
      const pagina = ev.slug ? `${LINK_APPS_SCRIPT}?evento=${encodeURIComponent(ev.slug)}` : "";
      const plataforma = preenchido(ev.plataforma) ? ev.plataforma : "Sympla";
      const inscrever = ev.status === "esgotado"
        ? `<a class="botao botao--roxo botao--pequeno" href="${linkRobo("falar")}" target="_blank" rel="noopener">Vagas esgotadas · avise-me da próxima<span class="sr-only"> (abre o atendimento no Telegram)</span></a>`
        : preenchido(ev.link_sympla)
        ? `<a class="botao botao--principal botao--pequeno" href="${esc(ev.link_sympla)}" target="_blank" rel="noopener">Quero me inscrever <span class="seta" aria-hidden="true">→</span><span class="sr-only">: ${esc(ev.titulo)} (abre o ${esc(plataforma)} em nova aba)</span></a>`
        : `<span class="botao botao--principal botao--pequeno" aria-disabled="true">Inscrições em breve</span>`;
      return `
        <article class="evento" style="--i:${i}">
          <div class="evento__data" aria-hidden="true"><b>${String(d || "").padStart(2, "0")}</b><span>${meses[(m || 1) - 1]} ${a || ""}</span></div>
          <div>
            <h3>${esc(ev.titulo)}</h3>
            <div class="evento__meta">
              <span class="sr-only">Data: ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}.</span>
              <span><svg class="ic" aria-hidden="true"><use href="#ic-relogio"/></svg>${esc(ev.horario)}</span>
              <span><svg class="ic" aria-hidden="true"><use href="#ic-local"/></svg>${esc(ev.formato)}${ev.local ? " · " + esc(ev.local) : ""}</span>
              ${ev.vagas ? `<span><svg class="ic" aria-hidden="true"><use href="#ic-pessoas"/></svg>${esc(ev.vagas)}</span>` : ""}
            </div>
            <p>${esc(ev.descricao)}</p>
            ${/^gratuit/i.test(ev.preco || "") ? `<p class="evento__preco"><b>Gratuito</b> · inscrição pelo ${esc(plataforma)}</p>` : ev.preco ? `<p class="evento__preco">A partir de <b>${esc(ev.preco)}</b> · pagamento seguro pelo ${esc(plataforma)}</p>` : ""}
            <div class="evento__acoes">
              ${inscrever}
              ${pagina ? `<a class="link-evento" href="${esc(pagina)}" target="_blank" rel="noopener">Ver detalhes do evento<span class="sr-only"> (abre em nova aba)</span></a>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");
  }

  /* ---------- Cursos ---------- */
  // Cada cartão leva direto para a Hotmart (ou para o robô do Telegram, se o curso estiver em breve/esgotado)
  let desenharCursos = () => {};
  if ($("#grade-cursos")) {
    let CURSOS = [];
    const PROFS = window.PROFESSORAS || {};
    const rotuloStatus = { disponivel: "Disponível", em_breve: "Em breve", esgotado: "Esgotado" };
    const grade = $("#grade-cursos");
    const filtros = $("#filtros");

    const profsDo = (c) => {
      const p = String(c.professora || "").toLowerCase();
      if (p.includes("duas") || (p.includes("luana") && p.includes("taiane"))) return ["Luana", "Taiane"];
      return Object.keys(PROFS).filter((n) => p.includes(n.toLowerCase()));
    };
    const nomeProfs = (c) => profsDo(c).join(" e ") || c.professora;
    const fotosProfs = (c) => profsDo(c).map((n) => PROFS[n]).filter(Boolean)
      .map((p) => `<img src="${esc(p.foto)}" alt="" width="32" height="32" loading="lazy">`).join("");

    function capa(c) {
      if (preenchido(c.imagem)) return `<img src="${esc(c.imagem)}" alt="" loading="lazy">`;
      return `<div class="capa-padrao"><div><img src="img/simbolo.webp" alt="" width="208" height="242" loading="lazy"><span>${esc(c.titulo)}</span></div></div>`;
    }

    function botaoCurso(c, classe = "botao botao--principal") {
      const status = c.status || "disponivel";
      if (status === "disponivel") {
        // Enquanto o link da Hotmart não for preenchido, o botão aparece desativado
        if (!preenchido(c.link_compra)) {
          return `<span class="${classe}" aria-disabled="true">Link de compra em breve</span>`;
        }
        const href = esc(c.link_compra);
        return `<a class="${classe}" href="${href}" target="_blank" rel="noopener" data-principal>Quero este curso <span class="seta" aria-hidden="true">→</span><span class="sr-only">: ${esc(c.titulo)} (abre a página de compra em nova aba)</span></a>
          <small class="curso__nota">Você vai direto para a página do curso na ${esc(preenchido(c.plataforma) ? c.plataforma : "Hotmart")}.</small>`;
      }
      const rot = status === "em_breve" ? "Me avise quando abrir" : "Avise-me da próxima turma";
      return `<a class="${classe.replace("botao--principal", "botao--roxo")}" href="${linkRobo("falar")}" target="_blank" rel="noopener" data-principal><svg class="ic" aria-hidden="true"><use href="#ic-telegram"/></svg> ${rot}<span class="sr-only">: ${esc(c.titulo)} (abre o atendimento no Telegram)</span></a>`;
    }

    function cartao(c, n) {
      return `
        <article class="curso${sim(c.destaque) ? " curso--destaque" : ""}" style="--i:${n}">
          <div class="curso__capa">
            <span class="status status--${esc(c.status)}">${rotuloStatus[c.status] || ""}</span>
            ${sim(c.destaque) ? '<span class="selo-destaque">Destaque</span>' : ""}
            ${capa(c)}
          </div>
          <div class="curso__corpo">
            <h3>${esc(c.titulo)}</h3>
            ${preenchido(c.subtitulo) ? `<p class="curso__sub">${esc(c.subtitulo)}</p>` : ""}
            <div class="curso__info">
              ${preenchido(c.carga_horaria) ? `<span><svg class="ic" aria-hidden="true"><use href="#ic-relogio"/></svg>${esc(c.carga_horaria)}</span>` : ""}
              ${sim(c.tem_certificado) ? '<span><svg class="ic" aria-hidden="true"><use href="#ic-certificado"/></svg>Certificado</span>' : ""}
            </div>
            ${preenchido(c.para_quem) ? `<p class="curso__para"><b>Para quem é:</b> ${esc(c.para_quem)}</p>` : ""}
            <ul class="lista-check">${(c.o_que_aprende || []).filter(preenchido).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            <p class="curso__profs"><span class="curso__fotos">${fotosProfs(c)}</span>Com ${esc(nomeProfs(c))}</p>
            ${preenchido(c.preco_a_partir) ? `<p class="curso__preco">A partir de <b>${esc(c.preco_a_partir)}</b></p>` : ""}
            <div class="curso__acoes">${botaoCurso(c)}</div>
          </div>
        </article>`;
    }

    // Cursos em destaque viram blocos alternados de imagem e texto
    function desenharDestaques() {
      const destaques = CURSOS.filter((c) => sim(c.destaque));
      $("#bloco-destaques").hidden = !destaques.length;
      $("#lista-destaques").innerHTML = destaques.map((c, n) => `
        <article class="alternado curso-alternado" data-surgir>
          <div class="alternado__img curso__capa">${capa(c)}<span class="status status--${esc(c.status)}">${rotuloStatus[c.status] || ""}</span></div>
          <div class="destaque__texto">
            <span class="etiqueta-destaque">★ Curso em destaque</span>
            <h3>${esc(c.titulo)}</h3>
            ${preenchido(c.subtitulo) ? `<p class="destaque__sub">${esc(c.subtitulo)}</p>` : ""}
            <div class="curso__info">
              ${preenchido(c.carga_horaria) ? `<span><svg class="ic" aria-hidden="true"><use href="#ic-relogio"/></svg>${esc(c.carga_horaria)}</span>` : ""}
              ${sim(c.tem_certificado) ? '<span><svg class="ic" aria-hidden="true"><use href="#ic-certificado"/></svg>Certificado</span>' : ""}
              ${profsDo(c).length ? `<span><svg class="ic" aria-hidden="true"><use href="#ic-pessoas"/></svg>Com ${esc(nomeProfs(c))}</span>` : ""}
            </div>
            <ul class="lista-check">${(c.o_que_aprende || []).filter(preenchido).slice(0, 4).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            ${preenchido(c.preco_a_partir) ? `<p class="curso__preco">A partir de <b>${esc(c.preco_a_partir)}</b></p>` : ""}
            <div class="curso__acoes curso__acoes--destaque">${botaoCurso(c)}</div>
          </div>
        </article>`).join("");
      $$("#lista-destaques [data-surgir]").forEach((el) => revelar(el));
    }

    const filtro = { prof: "todas", status: "todos" };
    function desenharGrade() {
      // Os cursos em destaque já aparecem no bloco de cima; na grade entram só os outros
      const semDestaque = CURSOS.filter((c) => !sim(c.destaque));
      const base = semDestaque.length ? semDestaque : CURSOS;
      if ($("#rotulo-grade")) $("#rotulo-grade").textContent = base.length < CURSOS.length ? "Mais cursos" : "Todos os cursos";
      const lista = base
        .filter((c) => filtro.prof === "todas" || profsDo(c).includes(filtro.prof))
        .filter((c) => filtro.status === "todos" || c.status === filtro.status)
        .sort((a, b) => sim(b.destaque) - sim(a.destaque));
      grade.removeAttribute("data-sequencia");
      grade.innerHTML = lista.length
        ? lista.map(cartao).join("")
        : `<p class="aviso-vazio">Nenhum curso com esses filtros por enquanto. Que tal ver todos?</p>`;
    }

    function desenharFiltros() {
      filtros.hidden = CURSOS.length <= 4;
      if (filtros.hidden) return;
      const grupo = (nome, legenda, opcoes) => `
        <fieldset><legend>${legenda}</legend><div class="opcoes">
          ${opcoes.map(([v, t], i) => `<label class="opcao"><input type="radio" name="${nome}" value="${v}" ${i === 0 ? "checked" : ""}><span>${t}</span></label>`).join("")}
        </div></fieldset>`;
      filtros.innerHTML =
        grupo("prof", "Professora", [["todas", "Todas"], ...Object.keys(PROFS).map((n) => [n, n])]) +
        grupo("status", "Status", [["todos", "Todos"], ["disponivel", "Disponível"], ["em_breve", "Em breve"], ["esgotado", "Esgotado"]]);
    }
    filtros.addEventListener("change", (e) => {
      filtro[e.target.name] = e.target.value;
      desenharGrade();
    });

    desenharCursos = () => {
      CURSOS = (dados.cursos || []).map((c) => ({ ...c, status: c.status || "disponivel" }));
      desenharDestaques();
      desenharFiltros();
      desenharGrade();
      grade.setAttribute("data-sequencia", "");
      numerarSequencias();
      revelar(grade);
    };

    // Clicar em qualquer parte do cartão também leva para a Hotmart
    grade.addEventListener("click", (e) => {
      if (e.target.closest("a, button") || String(getSelection()).length) return;
      const card = e.target.closest(".curso");
      const link = card && card.querySelector("[data-principal]");
      if (link) link.click();
    });
  }

  /* ---------- Efeitos de rolagem ---------- */
  // Títulos: separa as palavras para subirem uma a uma
  function separarPalavras(el) {
    let i = 0;
    const percorrer = (no) => {
      Array.from(no.childNodes).forEach((filho) => {
        if (filho.nodeType === 3) {
          const partes = filho.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          partes.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) return frag.appendChild(document.createTextNode(" "));
            const pal = document.createElement("span");
            pal.className = "pal";
            pal.innerHTML = `<span style="--i:${i++}">${esc(p)}</span>`;
            frag.appendChild(pal);
          });
          filho.replaceWith(frag);
        } else if (filho.nodeType === 1 && filho.tagName !== "svg") {
          if (filho.classList.contains("destaque-circulo")) {
            // a palavra com círculo sobe inteira
            const pal = document.createElement("span");
            pal.className = "pal";
            pal.style.overflow = "visible";
            const dentro = document.createElement("span");
            dentro.style.setProperty("--i", i++);
            filho.replaceWith(pal);
            dentro.appendChild(filho);
            pal.appendChild(dentro);
          } else percorrer(filho);
        }
      });
    };
    percorrer(el);
  }
  $$("[data-palavras]").forEach(separarPalavras);

  // Texto que acende: separa as palavras
  function separarAcende(el) {
    const percorrer = (no) => {
      Array.from(no.childNodes).forEach((filho) => {
        if (filho.nodeType === 3) {
          const frag = document.createDocumentFragment();
          filho.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) return frag.appendChild(document.createTextNode(" "));
            const s = document.createElement("span");
            s.className = "p";
            s.textContent = p;
            frag.appendChild(s);
          });
          filho.replaceWith(frag);
        } else if (filho.nodeType === 1) percorrer(filho);
      });
    };
    percorrer(el);
  }
  $$("[data-acende]").forEach(separarAcende);

  /* ---------- Textos do site (aba "Textos do site" da planilha) ---------- */
  // Cada elemento com data-t="código" recebe o texto da linha com o mesmo código.
  // *palavra* = destaque (círculo nos títulos, verde no texto que acende, itálico na frase)
  // **palavra** = negrito · listas: um item por linha
  const CIRCULO = '<svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M18 44 C14 18 70 6 118 8 C170 10 198 28 192 48 C186 70 118 78 72 74 C30 70 6 58 10 36 C14 22 40 12 66 10"/></svg>';
  const negrito = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const comDestaque = (t, abre, fecha) => negrito(t).replace(/\*([^*]+?)\*/g, (_, x) => abre + x + fecha);
  const linhas = (t) => String(t).split(/\n/).map((x) => x.trim()).filter(Boolean);
  function aplicarTextos(textos) {
    if (!textos) return;
    $$("[data-t]").forEach((el) => {
      const valor = textos[el.dataset.t];
      if (valor === undefined) return;
      const vazio = !String(valor).trim();
      if (el.hasAttribute("data-t-some")) el.hidden = vazio;
      if (vazio) return; // vazio = fica o texto original
      const tipo = el.dataset.tTipo || "";
      if (tipo === "titulo") el.innerHTML = comDestaque(valor, '<span class="destaque-circulo">', CIRCULO + "</span>");
      else if (tipo === "frase") el.innerHTML = comDestaque(valor, "<em>", "</em>");
      else if (tipo === "acende") el.innerHTML = comDestaque(valor, '<span class="verde">', "</span>");
      else if (tipo === "selo") el.innerHTML = String(valor).split("·").map((x) => esc(x.trim())).filter(Boolean).join(' <span class="ponto" aria-hidden="true"></span> ');
      else if (tipo === "etiqueta") el.innerHTML = String(valor).split("·").map((x) => esc(x.trim())).join(" <i>·</i> ");
      else if (tipo === "lista") el.innerHTML = linhas(valor).map((x) => `<li>${negrito(x)}</li>`).join("");
      else if (tipo === "faixa") { const sp = linhas(valor).map((x) => `<span>${esc(x)}</span>`).join(""); el.innerHTML = sp + sp; }
      else if (tipo === "comparar") {
        el.innerHTML = linhas(valor).map((x) => {
          const [titulo, ...resto] = x.split("|");
          return `<li><svg class="ic" aria-hidden="true"><use href="#${el.dataset.tIcone}"/></svg><span><strong>${esc(titulo.trim())}</strong><small>${esc(resto.join("|").trim())}</small></span></li>`;
        }).join("");
      } else el.innerHTML = linhas(valor).map(negrito).join("<br>");
      if (el.hasAttribute("data-palavras")) separarPalavras(el);
      if (el.hasAttribute("data-acende")) separarAcende(el);
    });
  }

  // Numeração dos itens em sequência
  const numerarSequencias = () => $$("[data-sequencia]").forEach((g) => Array.from(g.children).forEach((c, i) => c.style.setProperty("--i", i)));
  numerarSequencias();

  const observados = "[data-surgir], [data-palavras], [data-sequencia], .divisor";
  // Elementos criados depois (ex.: cursos vindos da planilha) também entram nas animações
  let revelar = (el) => el.classList.add("visivel");
  if ("IntersectionObserver" in window && !semMovimento.matches) {
    const io = new IntersectionObserver((itens) => {
      itens.forEach((it) => {
        if (it.isIntersecting) {
          it.target.classList.add("visivel");
          io.unobserve(it.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    $$(observados).forEach((el) => io.observe(el));
    revelar = (el) => io.observe(el);
    // A grade de cursos é redesenhada pelos filtros: mantém visível
    if ($("#filtros")) $("#filtros").addEventListener("change", () => $("#grade-cursos").classList.add("visivel"));
  } else {
    $$(observados).forEach((el) => el.classList.add("visivel"));
  }

  // Bloco alto no Google Sites: o texto acende conforme aparece na tela
  if (modoSites && "IntersectionObserver" in window && !semMovimento.matches) {
    const passos = Array.from({ length: 41 }, (_, i) => i / 40);
    const ioAcende = new IntersectionObserver((itens) => {
      if (!semRolagemPropria()) return;
      itens.forEach((it) => {
        const pals = it.target.querySelectorAll(".p");
        const n = Math.round(Math.min(1, it.intersectionRatio * 1.25) * pals.length);
        pals.forEach((p, i) => p.classList.toggle("acesa", i < n));
      });
    }, { threshold: passos });
    $$("[data-acende]").forEach((el) => ioAcende.observe(el));
  }

  /* ---------- Rolagem: menu, barra de progresso, parallax, texto que acende ---------- */
  const topo = $(".topo");
  const barra = $(".progresso");
  const caixaFlutuante = $(".cta-flutuante");
  let pedido = false;

  function atualizarRolagem() {
    pedido = false;
    const y = window.scrollY;
    const alt = document.documentElement.scrollHeight - innerHeight;
    topo.classList.toggle("rolou", y > 20);
    barra.style.transform = `scaleX(${alt > 0 ? Math.min(1, y / alt) : 0})`;

    // Botão flutuante: aparece depois da primeira tela e some perto do formulário/rodapé
    const rodape = $(".rodape").getBoundingClientRect().top;
    const alvo = document.getElementById(flutuante.dataset.alvo);
    const secaoAlvo = alvo && !alvo.closest("[hidden]") ? alvo.closest("section") : null;
    const r = secaoAlvo && secaoAlvo.getBoundingClientRect();
    const alvoNaTela = r && r.top < innerHeight && r.bottom > 0;
    // ...e também quando já há outro botão laranja à vista
    const outroBotao = $$(".painel:not([hidden]) .botao--principal").some((bt) => {
      const rb = bt.getBoundingClientRect();
      return rb.height && rb.top < innerHeight && rb.bottom > 0;
    });
    caixaFlutuante.classList.toggle("visivel", y > innerHeight * 0.7 && rodape > innerHeight && !alvoNaTela && !outroBotao);

    if (semMovimento.matches) return;

    // Parallax leve
    $$("[data-parallax]").forEach((el) => {
      if (el.closest("[hidden]")) return;
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const vel = parseFloat(el.dataset.parallax) * (celular.matches ? 0.5 : 1);
      const desloc = (r.top + r.height / 2 - innerHeight / 2) * vel;
      const base = el.dataset.base ?? (el.dataset.base = el.style.transform || "");
      el.style.transform = `translate3d(0, ${desloc.toFixed(1)}px, 0) ${base}`;
    });

    // Palavras acendendo conforme desce
    $$("[data-acende]").forEach((el) => {
      if (el.closest("[hidden]")) return;
      const r = el.getBoundingClientRect();
      const inicio = innerHeight * 0.85, fim = innerHeight * 0.35;
      const prog = Math.min(1, Math.max(0, (inicio - r.top) / (r.height + inicio - fim)));
      const pals = el.querySelectorAll(".p");
      const n = Math.round(prog * pals.length);
      pals.forEach((p, i) => p.classList.toggle("acesa", i < n));
    });
  }
  window.addEventListener("scroll", () => {
    if (!pedido) { pedido = true; requestAnimationFrame(atualizarRolagem); }
  }, { passive: true });
  window.addEventListener("resize", atualizarRolagem);

  /* ---------- Cursor personalizado (só com mouse) ---------- */
  const cursor = $(".cursor");
  if (comMouse.matches && !semMovimento.matches) {
    let cx = 0, cy = 0, mx = 0, my = 0, rodando = false;
    const mover = () => {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.3) requestAnimationFrame(mover);
      else rodando = false;
    };
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add("ativo");
      if (!rodando) { rodando = true; requestAnimationFrame(mover); }
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("ativo"));
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("sobre", !!e.target.closest("a, button, label, select, input, textarea, [role='tab']"));
    });
  } else {
    cursor.remove();
  }

  /* ---------- Planilha (onde a equipe muda as informações) ---------- */
  // Lê um CSV, respeitando aspas, vírgulas e quebras de linha dentro das células
  function lerCSV(texto) {
    const linhas = [];
    let linha = [], celula = "", aspas = false;
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
  // "Título do curso" → "titulo_do_curso"
  const chave = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  // Pega a coluna cujo nome começa com um destes trechos
  const col = (linha, ...nomes) => {
    const k = Object.keys(linha).find((n) => nomes.some((x) => n.startsWith(x)));
    return k ? linha[k].trim() : "";
  };
  const lista = (t) => String(t || "").split(/\n|;/).map((x) => x.trim()).filter(Boolean);
  // "12/12/2026" → "2026-12-12"
  const dataISO = (t) => {
    const m = String(t).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : String(t).trim();
  };

  async function baixarAba(aba) {
    const url = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(aba)}`;
    const resp = await fetch(url, { cache: "no-store" });
    const texto = await resp.text();
    if (!resp.ok || texto.trim().startsWith("<")) throw new Error("planilha indisponível");
    const [cab, ...resto] = lerCSV(texto);
    const nomes = cab.map(chave);
    return resto
      .filter((l) => l.some((c) => c.trim()))
      .map((l) => Object.fromEntries(nomes.map((n, i) => [n, l[i] || ""])));
  }

  // Eventos e cursos do CRM (painel → Produtos → "Mostrar no site")
  async function carregarCRM() {
    if (!preenchido(LINK_CRM)) return null;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const tempo = ctrl && setTimeout(() => ctrl.abort(), 7000);
    try {
      const resp = await fetch(LINK_CRM, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
      const j = await resp.json();
      return j && j.ok ? j : null;
    } finally {
      if (tempo) clearTimeout(tempo);
    }
  }
  function usarCRM(crm) {
    if (!crm) return;
    if ((crm.eventos || []).length) {
      dados.eventos = crm.eventos.map((e) => ({
        titulo: e.titulo, data: e.data, horario: e.horario, formato: e.formato, local: e.local,
        descricao: e.descricao, preco: e.preco, vagas: e.vagas, plataforma: e.plataforma,
        link_sympla: e.link_inscricao, status: e.status, slug: ""
      }));
    }
    if ((crm.cursos || []).length) dados.cursos = crm.cursos;
  }

  async function carregarPlanilha() {
    if (!preenchido(PLANILHA_ID)) return;
    const [contatos, eventos, cursos, textos] = await Promise.all(["Contatos", "Eventos", "Cursos", "Textos do site"].map((a) => baixarAba(a).catch(() => null)));
    if (textos) {
      dados.textos = {};
      textos.forEach((l) => { const k = col(l, "codigo"); if (k) dados.textos[k] = l[Object.keys(l).find((n) => n === "texto")] || ""; });
    }
    const aparece = (l) => !/^n/i.test(col(l, "mostrar"));

    if (contatos) {
      const horarios = [];
      contatos.forEach((l) => {
        const nome = chave(col(l, "informacao", "campo"));
        const valor = col(l, "valor", "resposta");
        if (!valor) return;
        if (nome.includes("whats")) return; // "WhatsApp atendimento" (número das nutricionistas): só o robô usa
        if (nome.includes("telegram")) dados.telegram = valor;
        else if (nome.includes("mail")) dados.email = valor;
        else if (nome.includes("insta")) dados.instagram = valor;
        else if (nome.includes("alun")) dados.areaAlunos = valor;
        else if (nome.includes("horario")) horarios.push(valor);
      });
      dados.horarios = horarios;
    }
    if (eventos) {
      dados.eventos = eventos.filter(aparece).filter((l) => col(l, "titulo")).map((l) => ({
        titulo: col(l, "titulo"),
        data: dataISO(col(l, "data")),
        horario: col(l, "horario"),
        formato: col(l, "formato"),
        local: col(l, "local"),
        descricao: col(l, "descricao"),
        preco: col(l, "preco"),
        vagas: col(l, "vagas"),
        link_sympla: col(l, "link_do_sympla", "sympla"),
        slug: col(l, "apelido", "slug")
      }));
    }
    if (cursos) {
      const situacao = (t) => { const k = chave(t); return k.startsWith("em_breve") ? "em_breve" : k.startsWith("esgot") ? "esgotado" : "disponivel"; };
      dados.cursos = cursos.filter(aparece).filter((l) => col(l, "titulo")).map((l) => ({
        titulo: col(l, "titulo"),
        subtitulo: col(l, "subtitulo"),
        imagem: col(l, "foto", "imagem"),
        professora: col(l, "professora"),
        carga_horaria: col(l, "carga"),
        para_quem: col(l, "para_quem"),
        o_que_aprende: lista(col(l, "o_que", "topicos")),
        tem_certificado: col(l, "tem_certificado", "certificado"),
        preco_a_partir: col(l, "preco"),
        link_compra: col(l, "link_da_hotmart", "link"),
        status: situacao(col(l, "situacao", "status")),
        destaque: col(l, "destaque")
      }));
    }
  }

  function desenharTudo() {
    aplicarTextos(dados.textos);
    desenharContatos();
    desenharEventos();
    desenharCursos();
  }

  /* ---------- Início ---------- */
  lerEndereco();
  atualizarRolagem();
  // Espera a planilha e o CRM (até 6 segundos); o CRM vale mais que a planilha,
  // e se nada responder, usa o que está neste arquivo
  const limite = new Promise((ok) => setTimeout(ok, 6000));
  const tudo = Promise.all([carregarPlanilha().catch(() => {}), carregarCRM().catch(() => null)])
    .then(([, crm]) => usarCRM(crm));
  Promise.race([tudo, limite]).then(() => {
    desenharTudo();
    atualizarRolagem();
  });
})();
