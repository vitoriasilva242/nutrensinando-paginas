/* =========================================================
   ROBÔ · versão Telegram (para testar a conversa)
   ---------------------------------------------------------
   Mesma conversa do api/whatsapp.mjs, com botões do Telegram.

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
import { executarCom } from "./whatsapp.mjs";

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
  if (c.type === "text") return chamar("sendMessage", { chat_id: chat, text: html(c.text.body), parse_mode: "HTML", disable_web_page_preview: true });
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
  } else if (u.message?.text) {
    chat = u.message.chat.id; quem = u.message.from;
    const texto = u.message.text.replace(/^\/start\b.*/, "oi"); // primeira conversa no Telegram começa com /start
    msg = { from: String(chat), id: "tg" + u.update_id, type: "text", text: { body: texto } };
  } else {
    return new Response("ok");
  }

  try {
    const respostas = await executarCom(msg, { profile: { name: quem?.first_name || "" } });
    for (const c of respostas) await mandar(chat, c);
  } catch (e) { console.error("Erro no robô (Telegram):", e); }
  return new Response("ok");
}
