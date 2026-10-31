/* =========================================================
   LISTA DE CURSOS · Nutrensinando
   ---------------------------------------------------------
   Para adicionar um curso: copie um bloco inteiro { ... },
   cole logo abaixo do último (não esqueça a vírgula entre eles)
   e troque os textos. Para tirar um curso, apague o bloco.

   O que é cada campo:

   titulo          Nome do curso.
   subtitulo       Uma frase curta explicando o curso.
   imagem          Caminho da foto de capa, ex.: "img/cursos/meu-curso.webp".
                   Deixe "" (vazio) para usar a capa padrão com as cores da marca.
   professora      "Luana", "Taiane" ou "as duas".
   carga_horaria   Texto livre, ex.: "12 horas" ou "6 aulas de 1h30".
   para_quem       Para quem o curso foi pensado.
   o_que_aprende   Lista de tópicos, cada um entre aspas e separado por vírgula.
   tem_certificado "sim" ou "não".
   preco_a_partir  Opcional. Ex.: "R$ 197 ou 12x de R$ 19,70". Deixe "" para não mostrar.
   link_compra     Link da página do curso na Hotmart (ou plataforma parecida).
                   Clicar no cartão ou no botão leva direto para este link.
   status          "disponivel"  → botão "Quero este curso" (abre a Hotmart)
                   "em_breve"    → botão "Me avise quando abrir" (abre o WhatsApp)
                   "esgotado"    → botão "Avise-me da próxima turma" (abre o WhatsApp)
   destaque        "sim" para aparecer em destaque no topo da página, "não" para o normal.

   Os filtros por professora e status aparecem sozinhos
   quando houver mais de 4 cursos na lista.
   ========================================================= */

window.CURSOS = [
  {
    titulo: "[NOME DO CURSO 1]",
    subtitulo: "[Uma frase curta sobre o curso]",
    imagem: "",
    professora: "Luana",
    carga_horaria: "[X horas]",
    para_quem: "[Para quem é este curso. Ex.: estudantes a partir do 3º período e nutricionistas recém-formados.]",
    o_que_aprende: [
      "[Tópico 1]",
      "[Tópico 2]",
      "[Tópico 3]"
    ],
    tem_certificado: "sim",
    preco_a_partir: "[R$ 000 ou 12x de R$ 00]",
    link_compra: "https://hotmart.com/pt-br", // TESTE: troque pelo link do curso
    status: "disponivel",
    destaque: "sim"
  },
  {
    titulo: "[NOME DO CURSO 2]",
    subtitulo: "[Uma frase curta sobre o curso]",
    imagem: "",
    professora: "Taiane",
    carga_horaria: "[X horas]",
    para_quem: "[Para quem é este curso]",
    o_que_aprende: [
      "[Tópico 1]",
      "[Tópico 2]",
      "[Tópico 3]"
    ],
    tem_certificado: "sim",
    preco_a_partir: "",
    link_compra: "https://hotmart.com/pt-br", // TESTE: troque pelo link do curso
    status: "em_breve",
    destaque: "não"
  },
  {
    titulo: "[NOME DO CURSO 3]",
    subtitulo: "[Uma frase curta sobre o curso]",
    imagem: "",
    professora: "as duas",
    carga_horaria: "[X horas]",
    para_quem: "[Para quem é este curso]",
    o_que_aprende: [
      "[Tópico 1]",
      "[Tópico 2]",
      "[Tópico 3]"
    ],
    tem_certificado: "não",
    preco_a_partir: "[R$ 000]",
    link_compra: "https://hotmart.com/pt-br", // TESTE: troque pelo link do curso
    status: "disponivel",
    destaque: "não"
  }
];

/* Fotos que aparecem no cartão de cada curso, ao lado do nome da professora. */
window.PROFESSORAS = {
  Luana: {
    nome: "Luana",
    foto: "img/luana.webp"
  },
  Taiane: {
    nome: "Taiane",
    foto: "img/taiane.webp"
  }
};
