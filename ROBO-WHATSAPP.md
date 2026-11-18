# Robô do WhatsApp · Nutrensinando

O robô fica em `api/whatsapp.mjs`, no mesmo projeto da Vercel do site. Ele usa a API oficial do WhatsApp (Cloud API, da Meta) e lê a mesma planilha do site.

```
Pessoa manda mensagem (pelo botão do site ou direto)
        │
        ▼
Menu:  [Cursos]  [Eventos]  [Falar com a equipe]
        │           │              │
  lista da aba  lista da aba   botão que abre o WhatsApp da Luana e da Taiane
  Cursos        Eventos        com a mensagem pronta ("Aqui é Maria, queria
  (Hotmart)     (Sympla)       falar sobre os cursos")
```

- A pessoa escreveu "curso", "evento" ou "falar com a Luana"? O robô vai direto para o assunto. As mensagens dos botões do site já trazem essas palavras.
- Escrever **menu** sempre volta ao começo.
- Custo: a Meta dá **1.000 respostas grátis por mês** para cada número. Passando disso, cada mensagem custa cerca de R$ 0,035. A Vercel é gratuita.

## Por que o robô precisa de um número próprio

Para o robô e o app WhatsApp Business usarem o **mesmo** número (a chamada "coexistência"), a Meta exige uma empresa parceira, que cobra mensalidade. Por isso:

- **Número do robô**: um chip novo, ou um número fixo, que **não** esteja cadastrado no WhatsApp. Esse é o número que vai no site.
- **Número das nutricionistas**: o WhatsApp de sempre delas. O robô manda a pessoa para lá quando ela pede para falar com a equipe.

---

## Passo 1 · Testar agora, com o número de teste da Meta (sem chip)

1. Entre em **developers.facebook.com** e crie uma conta de desenvolvedor, se ainda não tiver.
2. Vá em **Meus apps → Criar app**. Escolha o caso de uso **WhatsApp** ("Conectar-se com clientes pelo WhatsApp") e vincule um portfólio empresarial (pode criar um na hora).
3. No app, abra **WhatsApp → Configuração da API** (API Setup). Lá aparecem:
   - um **número de teste** da Meta;
   - o **Phone number ID** (identificação do número de telefone);
   - um **token temporário**, que vale 24 horas.
4. Ainda nessa tela, em **Para (To)**, adicione o seu WhatsApp como destinatário e confirme com o código que chega. Dá para cadastrar até 5 números.
5. Pegue a **Chave secreta do app** em **Configurações do app → Básico**.

## Passo 2 · Colocar as chaves na Vercel

Vercel → projeto `nutrensinando-paginas` → **Settings → Environment Variables**. Crie:

| Nome | Valor |
|---|---|
| `WHATSAPP_TOKEN` | o token (o temporário serve para testar) |
| `WHATSAPP_PHONE_NUMBER_ID` | o Phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | uma senha que você inventar, ex.: `nutrensinando-robo-2026` |
| `WHATSAPP_APP_SECRET` | a chave secreta do app |

Depois faça um novo deploy de produção (Deployments → ⋯ → Redeploy), para as chaves valerem.

> O webhook precisa do endereço de **produção** (ex.: `https://SEU-DOMINIO.vercel.app/api/whatsapp`). As versões de preview da Vercel são protegidas por login, e a Meta não consegue acessar. Para testar se o robô está no ar, é só abrir esse endereço no navegador: deve aparecer "Robô da Nutrensinando no ar."

## Passo 3 · Ligar o webhook na Meta

No app da Meta: **WhatsApp → Configuração** (Configuration) → **Webhook → Editar**.

- **URL de callback**: `https://SEU-DOMINIO.vercel.app/api/whatsapp`
- **Token de verificação**: a mesma senha do `WHATSAPP_VERIFY_TOKEN`

Clique em **Verificar e salvar**. Depois, em **Campos do webhook**, ative **messages**.

Para testar, mande "oi" do seu WhatsApp para o número de teste.

## Passo 4 · Planilha do site, aba Contatos

| Informação | Valor |
|---|---|
| WhatsApp | número **do robô**, que é para onde os botões do site levam |
| WhatsApp atendimento | número **da Luana e da Taiane** (crie esta linha) |

Se a linha "WhatsApp atendimento" ficar vazia, o robô responde "uma delas vai te responder por aqui" e para de responder naquela conversa por 24 horas. Esse modo serve para quando o robô e as nutricionistas usam o mesmo número.

## Passo 5 (opcional) · Trocar os textos do robô sem mexer no código

Crie na planilha uma aba chamada **Robô**, com as colunas **Mensagem** e **Texto**. Só precisa colocar as linhas que quiser mudar. Nas mensagens, `{nome}` vira o primeiro nome da pessoa.

| Mensagem | Quando aparece |
|---|---|
| `boas_vindas` | primeira mensagem, com os botões Cursos, Eventos e Falar com a equipe |
| `cursos_intro` | título da lista de cursos |
| `sem_cursos` | quando não há cursos para mostrar |
| `eventos_intro` | título da lista de eventos |
| `sem_eventos` | quando não há eventos futuros |
| `depois_da_lista` | frase depois das listas |
| `falar_equipe` | junto com o botão que abre o WhatsApp das nutricionistas |
| `falar_equipe_aqui` | quando não há "WhatsApp atendimento" na planilha |
| `nao_entendi` | quando a pessoa escreve algo que o robô não entende |

Cursos e eventos já vêm das abas **Cursos** e **Eventos**. O robô segue o "Mostrar no site?", esconde cursos esgotados e eventos que já passaram.

## Passo 6 · Colocar no ar para valer (número real)

1. **Número do robô**: em WhatsApp → Configuração da API → **Adicionar número de telefone**. Use um número que não esteja no WhatsApp, cadastre o nome de exibição "Nutrensinando" e confirme por SMS ou ligação.
2. **Token permanente** (o temporário vence em 24 horas): em **business.facebook.com → Configurações → Usuários do sistema**, crie um usuário administrador, adicione o app e o número a ele e gere um token com as permissões `whatsapp_business_messaging` e `whatsapp_business_management`. Troque o `WHATSAPP_TOKEN` e o `WHATSAPP_PHONE_NUMBER_ID` na Vercel e faça um novo deploy.
3. **Forma de pagamento**: a Meta pode pedir um cartão na conta do WhatsApp. Até 1.000 respostas por mês não é cobrado nada.
4. Na planilha, troque o "WhatsApp" pelo número do robô.

## Passo 7 (opcional) · Memória do robô

Sem banco de dados, o robô funciona, mas pode esquecer quem já viu o menu e quem pediu para falar com a equipe. A memória só importa no modo sem "WhatsApp atendimento". Para guardar isso: Vercel → **Storage → Create → Upstash (Redis)**, plano gratuito, e conecte ao projeto. As chaves `KV_REST_API_URL` e `KV_REST_API_TOKEN` entram sozinhas, e o código já usa as duas.

## Observação sobre a Vercel

O plano gratuito (Hobby) da Vercel é, pelas regras dela, para uso não comercial. Isso vale para o site e para o robô. Se a Nutrensinando crescer, o caminho é o plano Pro, ou passar o projeto para uma conta da própria cliente.
