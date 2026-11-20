/* =========================================================
   ROBÔ DO TELEGRAM · Nutrensinando
   ---------------------------------------------------------
   A conversa fica em api/_robo.mjs; aqui ela é ligada ao Telegram.

   Como ligar:
   1. No Telegram, fale com @BotFather → /newbot → escolha nome e usuário.
      Ele devolve um token.
   2. Vercel → Settings → Environment Variables:
        TELEGRAM_BOT_TOKEN = o token do BotFather
      e faça um novo deploy (Redeploy).
   3. Abra no navegador:  https://SEU-DOMINIO/api/telegram?configurar=1
      Isso avisa o Telegram para mandar as mensagens para cá.
   ========================================================= */

import crypto from "node:crypto";
import { executarCom, registrarNoCRM } from "./_robo.mjs";

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || "";
const API = (metodo) => `https://api.telegram.org/bot${TOKEN()}/${metodo}`;
// Senha que o Telegram manda de volta em cada mensagem (derivada do token)
const SEGREDO = () => crypto.createHash("sha256").update("nutrensinando:" + TOKEN()).digest("hex").slice(0, 48);

async function chamar(metodo, corpo) {
  const r = await fetch(API(metodo), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error("Telegram", metodo, JSON.stringify(j));
  return j;
}

// O robô escreve no estilo do WhatsApp (*negrito*, _itálico_); aqui vira HTML do Telegram
function html(t) {
  return String(t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*([^*\n]+)\*/g, "<b>$1</b>")
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.!?,])/g, "$1<i>$2</i>");
}

async function mandar(chat, c) {
  if (c.type === "text") {
    return chamar("sendMessage", {
      chat_id: chat, text: html(c.text.body), parse_mode: "HTML", disable_web_page_preview: true,
      ...(c.tirarTeclado ? { reply_markup: { remove_keyboard: true } } : {})
    });
  }
  // Botão nativo do Telegram que manda o número da pessoa (ela que toca, então é consentimento)
  if (c.type === "pedir_contato") {
    return chamar("sendMessage", {
      chat_id: chat, text: html(c.body), parse_mode: "HTML", disable_web_page_preview: true,
      reply_markup: { keyboard: [[{ text: c.sim, request_contact: true }], [{ text: c.nao }]], resize_keyboard: true, one_time_keyboard: true }
    });
  }
  const i = c.interactive;
  if (i.type === "button") {
    return chamar("sendMessage", {
      chat_id: chat, text: html(i.body.text), parse_mode: "HTML", disable_web_page_preview: true,
      reply_markup: { inline_keyboard: i.action.buttons.map((b) => [{ text: b.reply.title, callback_data: b.reply.id }]) }
    });
  }
  if (i.type === "cta_url") {
    return chamar("sendMessage", {
      chat_id: chat, text: html(i.body.text), parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: i.action.parameters.display_text, url: i.action.parameters.url }]] }
    });
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  if (!TOKEN()) return new Response("Falta o TELEGRAM_BOT_TOKEN nas variáveis da Vercel.", { status: 500 });
  if (url.searchParams.get("configurar")) {
    const destino = `${url.origin}/api/telegram`;
    const r = await chamar("setWebhook", { url: destino, secret_token: SEGREDO(), allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
    // Perfil do robô: nome, textos da tela inicial e menu de comandos
    await chamar("setMyName", { name: "Nutrensinando" });
    await chamar("setMyShortDescription", { short_description: "Cursos e eventos de Nutrição com a Luana e a Taiane. 💜" });
    await chamar("setMyDescription", { description: "Oi! Aqui é o atendimento da Nutrensinando: cursos e atualização em Nutrição, com base científica e prática, para estudantes e nutricionistas.\n\nToque em Começar para ver os cursos, os próximos eventos ou falar com a equipe." });
    await chamar("setMyCommands", { commands: [
      { command: "start", description: "Começar / voltar ao menu" },
      { command: "cursos", description: "Ver os cursos" },
      { command: "eventos", description: "Ver os próximos eventos" },
      { command: "equipe", description: "Falar com a Luana e a Taiane" }
    ] });
    const eu = await chamar("getMe", {});
    return new Response(r.ok
      ? `Pronto! O robô @${eu.result?.username} agora recebe as mensagens em ${destino}. Abra o Telegram e mande "oi" para ele.`
      : `Não deu certo: ${r.description || "erro desconhecido"}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return new Response("Robô da Nutrensinando (Telegram) no ar. Para ligar, abra este endereço com ?configurar=1 no final.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request) {
  if (!TOKEN() || request.headers.get("x-telegram-bot-api-secret-token") !== SEGREDO()) {
    return new Response("não autorizado", { status: 401 });
  }
  const u = await request.json().catch(() => ({}));
  let msg, quem, chat;

  if (u.callback_query) {
    const q = u.callback_query;
    chamar("answerCallbackQuery", { callback_query_id: q.id }); // tira o "carregando" do botão
    chat = q.message?.chat?.id; quem = q.from;
    msg = { from: String(chat), id: "tg" + u.update_id, type: "interactive", interactive: { button_reply: { id: q.data } } };
  } else if (u.message?.contact) {
    // A pessoa tocou em "Compartilhar meu número": grava no CRM e segue para a equipe
    chat = u.message.chat.id; quem = u.message.from;
    const ct = u.message.contact;
    if (ct.user_id && ct.user_id === quem?.id) {
      await registrarNoCRM({
        para: String(chat),
        nome: [ct.first_name || quem.first_name, ct.last_name || quem.last_name].filter(Boolean).join(" "),
        telefone: ct.phone_number,
        usuario: quem.username || ""
      });
    }
    msg = { from: String(chat), id: "tg" + u.update_id, type: "interactive", interactive: { button_reply: { id: "contato_ok" } } };
  } else if (u.message?.text) {
    chat = u.message.chat.id; quem = u.message.from;
    // Primeira conversa começa com /start. O link do site pode mandar o assunto: t.me/ROBO?start=curso
    const inicio = u.message.text.match(/^\/start(?:\s+(\S+))?/);
    const comando = u.message.text.match(/^\/(cursos|eventos|equipe|menu)\b/);
    const texto = inicio ? (inicio[1] || "oi") : comando ? (comando[1] === "equipe" ? "falar" : comando[1]) : u.message.text;
    msg = { from: String(chat), id: "tg" + u.update_id, type: "text", text: { body: texto } };
  } else {
    return new Response("ok");
  }

  try {
    const respostas = await executarCom(msg, { profile: { name: quem?.first_name || "" }, podePedirContato: true });
    for (const c of respostas) await mandar(chat, c);
  } catch (e) { console.error("Erro no robô (Telegram):", e); }
  return new Response("ok");
}
