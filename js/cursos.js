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
    titulo: "Nutrição Clínica na Prática (curso teste)",
    subtitulo: "Do diagnóstico nutricional à conduta: casos reais para atender com segurança.",
    imagem: "",
    professora: "Luana",
    carga_horaria: "20 horas",
    para_quem: "Estudantes a partir do 5º período e nutricionistas recém-formados.",
    o_que_aprende: [
      "Avaliação nutricional completa",
      "Cálculo de necessidades energéticas",
      "Condutas em diabetes e hipertensão",
      "Discussão de casos clínicos"
    ],
    tem_certificado: "sim",
    preco_a_partir: "R$ 197 ou 12x de R$ 19,70",
    link_compra: "https://hotmart.com/pt-br", // TESTE: troque pelo link do curso
    status: "disponivel",
    destaque: "sim"
  },
  {
    titulo: "Gestão em Unidades de Alimentação (curso teste)",
    subtitulo: "Ferramentas de qualidade e gestão de equipe para quem atua em UAN.",
    imagem: "",
    professora: "Taiane",
    carga_horaria: "12 horas",
    para_quem: "Nutricionistas e estudantes interessados em produção de refeições.",
    o_que_aprende: [
      "Boas práticas e controle de qualidade",
      "Fichas técnicas e custos",
      "Liderança de equipe"
    ],
    tem_certificado: "sim",
    preco_a_partir: "",
    link_compra: "https://hotmart.com/pt-br", // TESTE: troque pelo link do curso
    status: "em_breve",
    destaque: "não"
  },
  {
    titulo: "Alimentação Vegetariana sem Mitos (curso teste)",
    subtitulo: "Como planejar dietas vegetarianas e veganas completas e equilibradas.",
    imagem: "",
    professora: "as duas",
    carga_horaria: "8 horas",
    para_quem: "Estudantes e nutricionistas de todas as áreas.",
    o_que_aprende: [
      "Proteínas e combinações vegetais",
      "Vitamina B12, ferro e zinco",
      "Montagem de cardápios"
    ],
    tem_certificado: "sim",
    preco_a_partir: "R$ 97",
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
