/* =========================================================
   ROBÔ DO WHATSAPP · versão para o Twilio (Sandbox de teste)
   ---------------------------------------------------------
   Mesma conversa do api/whatsapp.mjs, mas recebendo e respondendo
   no formato do Twilio. Como o Sandbox não mostra botões, as opções
   aparecem numeradas: 1 Cursos · 2 Eventos · 3 Falar com a equipe · 0 Menu.

   No Twilio: Messaging → Try it out → Send a WhatsApp message →
   Sandbox settings → "When a message comes in":
     https://SEU-DOMINIO/api/twilio   (método POST)

   Opcional (recomendado fora do teste): TWILIO_AUTH_TOKEN na Vercel,
   para conferir que a mensagem veio mesmo do Twilio.
   ========================================================= */

import crypto from "node:crypto";
import { executarCom } from "./whatsapp.mjs";

const NUMERO_DO_BOTAO = { cursos: "1", eventos: "2", equipe: "3", menu: "0" };

function paraTexto(c) {
  if (c.type === "text") return c.text.body;
  const i = c.interactive;
  if (i.type === "button") {
    const opcoes = i.action.buttons.map((b) => `*${NUMERO_DO_BOTAO[b.reply.id] ?? "•"}* ${b.reply.title}`).join("\n");
    return `${i.body.text}\n\n${opcoes}\n\n_Responda com o número._`;
  }
  if (i.type === "cta_url") return `${i.body.text.replace(/no botão/g, "no link")}\n\n👉 ${i.action.parameters.display_text}: ${i.action.parameters.url}`;
  return "";
}

const xml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function assinaturaOk(request, params) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true;
  const base = request.url + [...params.keys()].sort().map((k) => k + params.get(k)).join("");
  const esperado = crypto.createHmac("sha1", token).update(base).digest("base64");
  const veio = request.headers.get("x-twilio-signature") || "";
  return veio.length === esperado.length && crypto.timingSafeEqual(Buffer.from(veio), Buffer.from(esperado));
}

export async function GET() {
  return new Response("Robô da Nutrensinando (Twilio) no ar.");
}

export async function POST(request) {
  const params = new URLSearchParams(await request.text());
  if (!assinaturaOk(request, params)) return new Response("assinatura inválida", { status: 401 });

  const from = (params.get("From") || "").replace(/^whatsapp:/, "").replace(/\D/g, "");
  const msg = {
    from,
    id: params.get("MessageSid") || "",
    type: params.get("ButtonPayload") ? "interactive" : "text",
    text: { body: params.get("Body") || "" },
    interactive: { button_reply: { id: params.get("ButtonPayload") || "" } }
  };
  const contato = { profile: { name: params.get("ProfileName") || "" } };

  let respostas = [];
  try { respostas = await executarCom(msg, contato); } catch (e) { console.error("Erro no robô (Twilio):", e); }

  const corpo = respostas.map(paraTexto).filter(Boolean)
    .map((t) => `<Message>${xml(t.length > 1600 ? t.slice(0, 1599) + "…" : t)}</Message>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${corpo}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" }
  });
}
