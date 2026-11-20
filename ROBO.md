# Robô de atendimento · Nutrensinando (Telegram)

- `api/_robo.mjs`: a conversa (menu, cursos, eventos, falar com a equipe). Lê a mesma planilha do site.
- `api/telegram.mjs`: liga a conversa ao Telegram.

```
/start  →  [Cursos] [Eventos] [Falar com a equipe]
             │         │            │
       aba Cursos  aba Eventos   [Compartilhar meu número] → contato no CRM
       (Hotmart)   (Sympla)         │
                                 botão que abre o WhatsApp da Luana e da Taiane
                                 com a mensagem pronta
```

## Como ligar

1. No Telegram, fale com **@BotFather** → `/newbot` → escolha o nome e o usuário (terminando em `bot`). Guarde o **token**.
2. Vercel → projeto → **Settings → Environment Variables** → crie `TELEGRAM_BOT_TOKEN` com o token. Depois faça um **Redeploy**.
3. Abra `https://nutrensinando-paginas.vercel.app/api/telegram?configurar=1`. Deve aparecer "Pronto!".
4. No Telegram, procure o robô pelo usuário e toque em **Começar**.

## Planilha

- Aba **Contatos**, linha **WhatsApp atendimento**: número da Luana e da Taiane. O botão "Falar com a equipe" abre esse WhatsApp. Se a linha não existir, o robô diz que elas respondem ali mesmo e fica quieto na conversa por 24 horas.
- Aba **Robô** (opcional), colunas **Mensagem | Texto**, para trocar os textos. `{nome}` vira o primeiro nome da pessoa. As mensagens que dá para trocar são: `boas_vindas`, `cursos_intro`, `sem_cursos`, `eventos_intro`, `sem_eventos`, `depois_da_lista`, `falar_equipe`, `falar_equipe_aqui` e `nao_entendi`.

## Ligação com o CRM

Quando a pessoa toca em **Falar com a equipe**, o robô pede o número dela com o botão do Telegram **Compartilhar meu número** (ou **Agora não**). Se ela compartilhar, o contato vai para o **CRM Nutrensinando**:

- aba **Contatos**: nome, WhatsApp, Origem = Telegram, Etapa = Interessado, Consentimento LGPD = Sim (se o número já existir, não duplica);
- aba **Interações**: Canal = Telegram, o assunto (cursos/eventos) e a próxima ação "Responder a pessoa" para hoje.

Quem recebe é a função `doPost` no Apps Script do CRM (mesmo endereço do painel). Para ligar, a mesma senha vai em dois lugares:

1. Apps Script do CRM → **Configurações do projeto → Propriedades do script** → `ROBO_SEGREDO`.
2. Vercel → **Settings → Environment Variables** → `CRM_SEGREDO`, depois **Redeploy**.

Sem `CRM_SEGREDO` na Vercel, o robô não pede o número e segue direto para a equipe, como antes. Se o painel for reimplantado com outro endereço, crie também `CRM_URL` na Vercel.

## Links diretos para um assunto

`https://t.me/USUARIO_DO_ROBO?start=curso` abre o robô já na lista de cursos. Também funciona com `start=evento` e `start=falar`.

## Memória (opcional)

Vercel → **Storage → Upstash (Redis)**, plano gratuito, conectado ao projeto. Serve para o robô lembrar quem já viu o menu e quem pediu atendimento. Sem isso, ele funciona igual, mas pode esquecer depois de um tempo.
