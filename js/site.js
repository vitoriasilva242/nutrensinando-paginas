/* =========================================================
   CONFIGURAÇÕES DO SITE · Nutrensinando
   ---------------------------------------------------------
   Troque só o que está entre aspas. Todo o resto do site
   lê estas informações daqui.
   ========================================================= */

// Endereço do sistema de eventos (Google Apps Script). Cada evento tem uma página
// própria nele: este endereço + "?evento=" + o apelido (slug) do evento.
const LINK_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwzXeHtvWtOHwimcLcGROb01U5CBNf_43F1xW4LimZZQtqHMT8RqKLe6tlHMCPiakk6Yw/exec";

// Link da área de alunos na Hotmart (ou plataforma parecida).
// TESTE: área de alunos geral da Hotmart. Troque pelo link de vocês.
const LINK_AREA_ALUNOS = "https://consumer.hotmart.com/";

// WhatsApp: só números, com código do país (55) e DDD. Ex.: "5521999999999"
// Vazio = o WhatsApp abre e a pessoa escolhe o contato (bom para testar).
const WHATSAPP = "";

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
  const linkWhats = (msg) => `https://wa.me/${String(WHATSAPP).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
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
  $("#rod-whats").href = linkWhats("Oi, pessoal! Vim pelo site da Nutrensinando e queria tirar uma dúvida.");
  $("#rod-insta").href = `https://instagram.com/${INSTAGRAM.replace("@", "")}`;
  $("#rod-insta-txt").textContent = "@" + INSTAGRAM.replace("@", "");
  // Contatos ainda não preenchidos ficam escondidos
  if (preenchido(EMAIL)) {
    $("#rod-email").href = `mailto:${EMAIL}`;
    $("#rod-email-txt").textContent = EMAIL;
  } else {
    $("#rod-email").closest("li").hidden = true;
  }
  if ($("#link-alunos")) $("#link-alunos").href = LINK_AREA_ALUNOS;
  const horarios = HORARIOS.filter(preenchido);
  if ($("#lista-horarios")) {
    if (horarios.length) $("#lista-horarios").innerHTML = horarios.map((h) => `<li>${esc(h)}</li>`).join("");
    else $("#lista-horarios").closest(".horarios").hidden = true;
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
    abrirAba(link.dataset.irAba, { alvo: link.dataset.alvo || null, focar: true });
  });

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
  if ($("#lista-eventos")) {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    $("#lista-eventos").innerHTML = EVENTOS.map((ev, i) => {
      const [a, m, d] = String(ev.data).split("-").map(Number);
      const pagina = ev.slug ? `${LINK_APPS_SCRIPT}?evento=${encodeURIComponent(ev.slug)}` : "";
      const inscrever = preenchido(ev.link_sympla)
        ? `<a class="botao botao--principal botao--pequeno" href="${esc(ev.link_sympla)}" target="_blank" rel="noopener">Quero me inscrever <span class="seta" aria-hidden="true">→</span><span class="sr-only">: ${esc(ev.titulo)} (abre o Sympla em nova aba)</span></a>`
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
            ${ev.preco ? `<p class="evento__preco">A partir de <b>${esc(ev.preco)}</b> · pagamento seguro pelo Sympla</p>` : ""}
            <div class="evento__acoes">
              ${inscrever}
              ${pagina ? `<a class="link-evento" href="${esc(pagina)}" target="_blank" rel="noopener">Ver detalhes do evento<span class="sr-only"> (abre em nova aba)</span></a>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");
  }

  /* ---------- Cursos ---------- */
  // Cada cartão leva direto para a Hotmart (ou para o WhatsApp, se o curso estiver em breve/esgotado)
  if ($("#grade-cursos")) {
    const CURSOS = window.CURSOS || [];
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
          return `<span class="${classe}" aria-disabled="true">Link da Hotmart em breve</span>`;
        }
        const href = esc(c.link_compra);
        return `<a class="${classe}" href="${href}" target="_blank" rel="noopener" data-principal>Quero este curso <span class="seta" aria-hidden="true">→</span><span class="sr-only">: ${esc(c.titulo)} (abre a Hotmart em nova aba)</span></a>
          <small class="curso__nota">Você vai direto para a página do curso na Hotmart.</small>`;
      }
      const msgW = status === "em_breve"
        ? `Oi, pessoal! Quero ser avisada quando o curso "${c.titulo}" abrir.`
        : `Oi, pessoal! O curso "${c.titulo}" está esgotado. Pode me avisar da próxima turma?`;
      const rot = status === "em_breve" ? "Me avise quando abrir" : "Avise-me da próxima turma";
      return `<a class="${classe.replace("botao--principal", "botao--roxo")}" href="${linkWhats(msgW)}" target="_blank" rel="noopener" data-principal><svg class="ic" aria-hidden="true"><use href="#ic-whats"/></svg> ${rot}<span class="sr-only">: ${esc(c.titulo)} (abre o WhatsApp)</span></a>`;
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
            <p class="curso__sub">${esc(c.subtitulo)}</p>
            <div class="curso__info">
              <span><svg class="ic" aria-hidden="true"><use href="#ic-relogio"/></svg>${esc(c.carga_horaria)}</span>
              ${sim(c.tem_certificado) ? '<span><svg class="ic" aria-hidden="true"><use href="#ic-certificado"/></svg>Certificado</span>' : ""}
            </div>
            <p class="curso__para"><b>Para quem é:</b> ${esc(c.para_quem)}</p>
            <ul class="lista-check">${(c.o_que_aprende || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            <p class="curso__profs"><span class="curso__fotos">${fotosProfs(c)}</span>Com ${esc(nomeProfs(c))}</p>
            ${c.preco_a_partir ? `<p class="curso__preco">A partir de <b>${esc(c.preco_a_partir)}</b></p>` : ""}
            <div class="curso__acoes">${botaoCurso(c)}</div>
          </div>
        </article>`;
    }

    // Cursos em destaque viram blocos alternados de imagem e texto
    const destaques = CURSOS.filter((c) => sim(c.destaque));
    if (destaques.length) {
      $("#bloco-destaques").hidden = false;
      $("#lista-destaques").innerHTML = destaques.map((c, n) => `
        <article class="alternado curso-alternado" data-surgir>
          <div class="alternado__img curso__capa">${capa(c)}<span class="status status--${esc(c.status)}">${rotuloStatus[c.status] || ""}</span></div>
          <div>
            <span class="num-pequeno">0.${n + 1} · Em destaque</span>
            <h3>${esc(c.titulo)}</h3>
            <p>${esc(c.subtitulo)}</p>
            <ul class="lista-check">${(c.o_que_aprende || []).slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            <div class="curso__acoes curso__acoes--destaque">${botaoCurso(c, "botao botao--principal botao--halo")}</div>
          </div>
        </article>`).join("");
    }

    const filtro = { prof: "todas", status: "todos" };
    function desenharGrade() {
      const lista = CURSOS
        .filter((c) => filtro.prof === "todas" || profsDo(c).includes(filtro.prof))
        .filter((c) => filtro.status === "todos" || c.status === filtro.status)
        .sort((a, b) => sim(b.destaque) - sim(a.destaque));
      grade.removeAttribute("data-sequencia");
      grade.innerHTML = lista.length
        ? lista.map(cartao).join("")
        : `<p class="aviso-vazio">Nenhum curso com esses filtros por enquanto. Que tal ver todos?</p>`;
    }

    if (CURSOS.length > 4) {
      filtros.hidden = false;
      const grupo = (nome, legenda, opcoes) => `
        <fieldset><legend>${legenda}</legend><div class="opcoes">
          ${opcoes.map(([v, t], i) => `<label class="opcao"><input type="radio" name="${nome}" value="${v}" ${i === 0 ? "checked" : ""}><span>${t}</span></label>`).join("")}
        </div></fieldset>`;
      filtros.innerHTML =
        grupo("prof", "Professora", [["todas", "Todas"], ...Object.keys(PROFS).map((n) => [n, n])]) +
        grupo("status", "Status", [["todos", "Todos"], ["disponivel", "Disponível"], ["em_breve", "Em breve"], ["esgotado", "Esgotado"]]);
      filtros.addEventListener("change", (e) => {
        filtro[e.target.name] = e.target.value;
        desenharGrade();
      });
    }
    desenharGrade();
    grade.setAttribute("data-sequencia", "");

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
  $$("[data-palavras]").forEach((el) => {
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
  });

  // Texto que acende: separa as palavras
  $$("[data-acende]").forEach((el) => {
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
  });

  // Numeração dos itens em sequência
  const numerarSequencias = () => $$("[data-sequencia]").forEach((g) => Array.from(g.children).forEach((c, i) => c.style.setProperty("--i", i)));
  numerarSequencias();

  const observados = "[data-surgir], [data-palavras], [data-sequencia], .divisor";
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
    caixaFlutuante.classList.toggle("visivel", y > innerHeight * 0.7 && rodape > innerHeight && !alvoNaTela);

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

  /* ---------- Início ---------- */
  lerEndereco();
  atualizarRolagem();
})();
