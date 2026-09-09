/**
 * Catálogo de molduras.
 *
 * Dado puro, sem `server-only`: a mesma lista alimenta a página (servidor) e o
 * estúdio (cliente). Acrescentar uma moldura é soltar o PNG em
 * `public/molduras/` e escrever uma entrada aqui — nada mais.
 *
 * A moldura é um PNG do tamanho exato do story (1080×1920). A janela onde a
 * foto entra costuma vir recortada em transparência; quando vem, o estúdio
 * detecta as coordenadas sozinho e o campo `janela` daqui só serve de rede de
 * segurança. Ver `analisarMoldura()` em app/molduras/estudio.tsx.
 */

export type Janela = {
  x: number;
  y: number;
  largura: number;
  altura: number;
  /**
   * Feitio do recorte da foto. "circulo" inscreve uma elipse no retângulo —
   * é o que a arte redonda pede. Só importa em moldura chapada; na vazada,
   * quem recorta é a própria transparência do PNG.
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
  /** Legendas prontas para colar no story. A primeira é a padrão. */
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
        texto:
          "Eu voto e indico! 💚💛\n\n" +
          "Deputado Federal: MARCIO REZENDE 5523\n" +
          "Deputado Estadual: JOÃO PIRES 55021\n\n" +
          "São Pedro da Aldeia precisa de gente que aparece, escuta e resolve. " +
          "É por isso que eu tô nessa.\n\n" +
          "Faz a sua moldura também 👉 {LINK}\n\n" +
          "#EuVotoEIndico #5523 #55021 #SãoPedroDaAldeia",
      },
      {
        rotulo: "Pessoal",
        texto:
          "Tô com eles. 💚💛\n\n" +
          "Não é por cargo, não é por promessa. É porque eu conheço o trabalho " +
          "e sei o que já foi feito aqui pela nossa cidade.\n\n" +
          "MARCIO REZENDE 5523 · JOÃO PIRES 55021\n\n" +
          "Se você também acredita, faz a sua 👉 {LINK}\n\n" +
          "#EuVotoEIndico #SãoPedroDaAldeia",
      },
      {
        rotulo: "Curta",
        texto:
          "5523 e 55021. Tá escrito e tá assinado. 💚💛\n\n" +
          "Faz a sua 👉 {LINK}\n\n" +
          "#EuVotoEIndico #5523 #55021",
      },
    ],
    cores: ["#7CC243", "#F5C518"],
  },
];

export function acharMoldura(id: string): Moldura | undefined {
  return MOLDURAS.find((m) => m.id === id);
}

/** Troca o marcador {LINK} pelo endereço real desta página. */
export function montarLegenda(texto: string, link: string): string {
  return texto.replaceAll("{LINK}", link);
}
