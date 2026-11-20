/* =========================================================
   WEBHOOK DA HOTMART → CRM · Nutrensinando
   ---------------------------------------------------------
   Toda compra na Hotmart vira contato + inscrição no CRM, sozinha.
   (Aprovada = "Pago"; boleto/pix gerado = "Pendente";
    reembolso/chargeback = "Reembolsado"; cancelada antes de pagar = nada.)

   Como ligar (uma vez só):
   1. Hotmart → Ferramentas → Webhook (API e notificações) → aba Autenticação:
      copie o "Hottok de verificação".
   2. Vercel → Settings → Environment Variables:
        HOTMART_HOTTOK = o hottok copiado
      (CRM_SEGREDO já precisa estar lá, é o mesmo do robô) → Redeploy.
   3. Hotmart → Webhook → Cadastrar: versão 2.0.0, URL
        https://nutrensinando-paginas.vercel.app/api/hotmart
      eventos: compra aprovada, compra completa, boleto impresso, compra
      atrasada, compra cancelada, compra expirada, compra reembolsada,
      chargeback. Pode usar "Enviar teste".

   Para a compra cair no produto certo, o produto no CRM precisa ter o
   mesmo nome da Hotmart, ou o "Código na plataforma" = ID do produto
   na Hotmart. Se não achar, o CRM cria o contato e avisa no painel.
   ========================================================= */

import { postarNoCRM, crmLigado } from "./_robo.mjs";

const SITUACAO = {
  PURCHASE_APPROVED: "pago",
  PURCHASE_COMPLETE: "pago",
  PURCHASE_BILLET_PRINTED: "pendente",
  PURCHASE_DELAYED: "pendente",
  PURCHASE_REFUNDED: "reembolsado",
  PURCHASE_CHARGEBACK: "reembolsado",
  PURCHASE_CANCELED: "cancelado",
  PURCHASE_EXPIRED: "cancelado"
};

// Data no horário de Brasília (aaaa-mm-dd)
const dataBR = (ms) => (ms ? new Date(Number(ms) - 3 * 3600_000).toISOString().slice(0, 10) : "");

export async function GET() {
  const pronto = !!process.env.HOTMART_HOTTOK && crmLigado();
  return new Response(pronto
    ? "Webhook da Hotmart no ar. Cadastre este endereço na Hotmart (versão 2.0.0)."
    : "Webhook da Hotmart: falta HOTMART_HOTTOK e/ou CRM_SEGREDO nas variáveis da Vercel.",
  { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request) {
  const hottok = process.env.HOTMART_HOTTOK || "";
  const corpo = await request.json().catch(() => ({}));
  const recebido = request.headers.get("x-hotmart-hottok") || corpo.hottok || "";
  if (!hottok || recebido !== hottok) return new Response("não autorizado", { status: 401 });

  const situacao = SITUACAO[corpo.event];
  if (!situacao) return Response.json({ ok: true, ignorado: corpo.event || "sem evento" });

  const d = corpo.data || {};
  const compra = d.purchase || {};
  const comprador = d.buyer || {};
  const produto = d.product || {};
  // "Enviar teste" da Hotmart: responde ok sem sujar o CRM
  if (Number(produto.id) === 0 || /@example\.com$/i.test(comprador.email || "")) {
    return Response.json({ ok: true, teste: true, mensagem: "Teste recebido. Compras de verdade vão para o CRM." });
  }

  const resposta = await postarNoCRM({
    tipo: "compra",
    plataforma: "Hotmart",
    codigoCompra: compra.transaction || corpo.id,
    codigoProduto: produto.id != null ? String(produto.id) : "",
    nomeProduto: produto.name || "",
    nome: comprador.name || "",
    email: comprador.email || "",
    telefone: comprador.checkout_phone || comprador.phone || "",
    valor: compra.price?.value ?? compra.full_price?.value ?? "",
    situacao,
    data: dataBR(compra.approved_date || compra.order_date || corpo.creation_date),
    cupom: compra.offer?.coupon_code || ""
  }).catch((e) => ({ ok: false, erro: String(e) }));

  if (!resposta.ok) console.error("Hotmart → CRM:", resposta.erro);
  // Erro devolve 500 para a Hotmart tentar de novo mais tarde
  return Response.json(resposta, { status: resposta.ok ? 200 : 500 });
}
