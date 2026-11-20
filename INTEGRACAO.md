# Site ⇄ CRM · Nutrensinando

## 1. CRM → site (eventos e cursos)

O site e o robô do Telegram mostram os produtos do **CRM Nutrensinando**
(painel → 📚 Produtos) que estão com **🌐 Mostrar no site** marcado.

| No CRM (Status) | No site |
|---|---|
| Planejado | "Em breve" (botão leva ao robô para avisar quando abrir) |
| Inscrições abertas | Botão de inscrição → link do Sympla/Hotmart do produto |
| Inscrições abertas + vagas cheias | "Esgotado" |
| Encerrado | Sai do site |

- **Evento** vai para a aba Eventos (some sozinho depois da data); **Curso/Ebook** vai para a aba Cursos.
- As vagas são contadas pelas inscrições do CRM (as reembolsadas não contam).
- O site atualiza em até 5 minutos depois de salvar no painel.
- Enquanto nenhum evento (ou curso) estiver marcado no CRM, o site continua usando as abas
  Eventos/Cursos da planilha do site. Contatos (Telegram, Instagram, e-mail, horários) continuam na planilha do site.
- Endereço usado pelo site: `URL do App da Web do CRM + ?api=site` (constante `LINK_CRM` em `js/site.js`).
  Só devolve dados dos produtos, nunca de pessoas.

## 2. Sympla e Hotmart → CRM (inscrições)

Cada compra vira **contato + inscrição** no CRM, sem digitar nada, e fica anotada na aba **Integrações** da planilha.

| Na plataforma | No CRM |
|---|---|
| Aprovada | Inscrição "Pago" (a pessoa vai para "Inscrito") |
| Boleto/Pix gerado, atrasada | Inscrição "Pendente" (aparece em "Pagamentos pendentes") |
| Reembolso, chargeback, cancelada depois de lançada | "Reembolsado" |
| Cancelada/expirada antes de pagar | Nada é lançado (só anotado) |

A compra cai no produto certo por: **Código na plataforma** do produto → número no **link de inscrição** →
**nome igual**. Se não achar, o CRM cria o contato, registra a conversa com o próximo passo
"Lançar a inscrição à mão" e anota na aba Integrações.

### Sympla (o CRM consulta de hora em hora)
1. Sympla → Minha conta → Integrações → gerar **token da API**.
2. Painel do CRM → ⚙️ Configurações → **Sympla**: colar o token → **Salvar token** → **Ligar**.
3. No produto: plataforma **Sympla** e o link do evento no Sympla.

### Hotmart (chega na hora, pelo site)
1. Hotmart → Ferramentas → Webhook → aba **Autenticação** → copiar o **Hottok**.
2. Vercel → Settings → Environment Variables: `HOTMART_HOTTOK` = hottok (e `CRM_SEGREDO`, que já existe por causa do robô) → **Redeploy**.
3. Hotmart → Webhook → Cadastrar: versão **2.0.0**, URL `https://nutrensinando-paginas.vercel.app/api/hotmart`,
   eventos de compra (aprovada, completa, boleto impresso, atrasada, cancelada, expirada, reembolsada, chargeback).
   O "Enviar teste" da Hotmart responde ok sem criar nada no CRM.
4. No produto do CRM: o mesmo nome do produto na Hotmart, ou o **ID do produto** em "Código na plataforma".

## Código do CRM

Uma cópia do arquivo novo do Apps Script fica em `crm/Site.gs` (o painel usa `crm/painel-produtos.js`).
No Apps Script também mudaram: em `Código.gs`, as colunas/chaves de Produtos (`SCHEMA` e `CHAVES`),
`lerObjetos_`/`ultimaLinhaDados_` (aceitam aba com menos colunas), `doGet` (`?api=site`) e `doPost` (`tipo: 'compra'`);
em `Painel.html`, a aba Produtos (+ Produto / ✏️ Editar) e ⚙️ Configurações (Integrações).
