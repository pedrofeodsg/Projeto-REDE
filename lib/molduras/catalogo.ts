/**
 * Catálogo de molduras.
 *
 * Dado puro, sem `server-only`: a mesma lista alimenta a página (servidor) e o
 * estúdio (cliente). Acrescentar uma moldura é soltar o PNG em
 * `public/molduras/` e escrever uma entrada aqui — nada mais.
 *
 * A moldura é um PNG do tamanho exato da arte. A janela onde a foto entra
 * costuma vir recortada em transparência; quando vem, o estúdio detecta as
 * coordenadas sozinho e o campo `janela` daqui só serve de rede de segurança.
 * Ver `lerJanela()` em lib/molduras/janela.ts.
 */

export type Janela = {
  x: number;
  y: number;
  largura: number;
  altura: number;
  /**
   * Feitio do recorte da foto. "circulo" inscreve uma elipse no retângulo.
   * Só importa em moldura chapada: na vazada quem mascara é a transparência
   * do próprio PNG, e o recorte da foto é a caixa inteira.
   */
  forma: "retangulo" | "circulo";
  /** Retângulo: raio dos cantos de cima. Os de baixo ficam retos. */
  raio: number;
};

export type Moldura = {
  id: string;
  nome: string;
  chamada: string;
  arquivo: string;
  largura: number;
  altura: number;
  /**
   * Onde a arte vai parar. Muda a instrução de postagem na tela: story é a
   * tela cheia vertical, publicação é o quadrado que fica no perfil.
   */
  destino: "story" | "publicacao";
  janela: Janela;
  /** Legendas prontas para colar. A primeira é a padrão. */
  legendas: { rotulo: string; texto: string }[];
  /** Duas cores para a miniatura do seletor. */
  cores: [string, string];
};

export const MOLDURAS: Moldura[] = [
  {
    id: "eu-voto-e-indico",
    nome: "Eu voto e indico",
    chamada: "Marcio Rezende 5523 · João Pires 55021",
    arquivo: "/molduras/eu-voto-e-indico.png",
    largura: 1080,
    altura: 1920,
    destino: "story",
    // Medida lendo o alfa do arquivo: a janela vazada do cartão.
    janela: { x: 68, y: 68, largura: 946, altura: 1150, forma: "retangulo", raio: 48 },
    legendas: [
      {
        rotulo: "Direta",
        texto: [
          "Eu voto e indico! 💚💛",
          "",
          "Deputado Federal: MARCIO REZENDE 5523",
          "Deputado Estadual: JOÃO PIRES 55021",
          "",
          "São Pedro da Aldeia precisa de gente que aparece, escuta e resolve. É por isso que eu tô nessa.",
          "",
          "Faz a sua moldura também 👉 {LINK}",
          "",
          "#EuVotoEIndico #5523 #55021 #SãoPedroDaAldeia",
        ].join("\n"),
      },
      {
        rotulo: "Pessoal",
        texto: [
          "Tô com eles. 💚💛",
          "",
          "Não é por cargo, não é por promessa. É porque eu conheço o trabalho e sei o que já foi feito aqui pela nossa cidade.",
          "",
          "MARCIO REZENDE 5523 · JOÃO PIRES 55021",
          "",
          "Se você também acredita, faz a sua 👉 {LINK}",
          "",
          "#EuVotoEIndico #SãoPedroDaAldeia",
        ].join("\n"),
      },
      {
        rotulo: "Curta",
        texto: [
          "5523 e 55021. Tá escrito e tá assinado. 💚💛",
          "",
          "Faz a sua 👉 {LINK}",
          "",
          "#EuVotoEIndico #5523 #55021",
        ].join("\n"),
      },
    ],
    cores: ["#7CC243", "#F5C518"],
  },
  {
    id: "fechado-com-eles",
    nome: "Fechado com eles",
    chamada: "Paes 55 · Pedro Paulo 555 · Marcio 5523 · João Pires 55021",
    arquivo: "/molduras/fechado-com-eles.png",
    largura: 1080,
    altura: 1080,
    destino: "publicacao",
    // Medida lendo o alfa do arquivo. A área à mostra é um círculo com o
    // título e os candidatos recortados por cima — quem faz essa máscara é o
    // alfa do PNG, e a caixa abaixo é só o limite da foto.
    janela: { x: 64, y: 64, largura: 952, altura: 738, forma: "circulo", raio: 0 },
    legendas: [
      {
        rotulo: "Direta",
        texto: [
          "#FechadoComEles 💚💛",
          "",
          "Governador: EDUARDO PAES 55",
          "Senador: PEDRO PAULO 555",
          "Deputado Federal: MARCIO REZENDE 5523",
          "Deputado Estadual: JOÃO PIRES 55021",
          "",
          "Time montado, do começo ao fim da cédula. É assim que São Pedro da Aldeia deixa de ser lembrada só em ano de eleição.",
          "",
          "Faz a sua também 👉 {LINK}",
          "",
          "#FechadoComEles #55 #555 #5523 #55021",
        ].join("\n"),
      },
      {
        rotulo: "Pessoal",
        texto: [
          "Eu escolhi de quem eu tô perto. 💚💛",
          "",
          "Do governo ao vereador, votando junto o peso é outro — e quem ganha com isso é a nossa cidade.",
          "",
          "PAES 55 · PEDRO PAULO 555 · MARCIO REZENDE 5523 · JOÃO PIRES 55021",
          "",
          "Se você tá comigo, faz a sua 👉 {LINK}",
          "",
          "#FechadoComEles #SãoPedroDaAldeia",
        ].join("\n"),
      },
      {
        rotulo: "Curta",
        texto: [
          "#FechadoComEles 💚💛",
          "",
          "55 · 555 · 5523 · 55021",
          "",
          "Faz a sua 👉 {LINK}",
        ].join("\n"),
      },
    ],
    cores: ["#2E8B2E", "#7CC243"],
  },
];

export function acharMoldura(id: string): Moldura | undefined {
  return MOLDURAS.find((m) => m.id === id);
}

/** Troca o marcador {LINK} pelo endereço real desta página. */
export function montarLegenda(texto: string, link: string): string {
  return texto.replaceAll("{LINK}", link);
}
