import type { Janela } from "./catalogo.ts";

/**
 * Onde a foto entra numa moldura.
 *
 * É uma medida do arquivo, não uma opinião — então quem mede é o código,
 * lendo os pixels do próprio PNG. Isso importa porque cada moldura nova que
 * aparecer na pasta se alinha sozinha, sem ninguém precisar abrir o Photoshop
 * com uma régua.
 *
 * Há dois feitios de moldura, e os dois são tratados:
 *
 * 1. Vazada — a área da foto vem recortada em transparência. O canal alfa
 *    entrega a janela de graça, e a moldura é desenhada POR CIMA da foto.
 * 2. Chapada — a área da foto vem pintada de branco. Aí o que delimita é a
 *    mancha branca contínua no meio da arte, achada por preenchimento a
 *    partir de um ponto que o catálogo garante estar dentro dela. Aqui a
 *    ordem inverte: a foto vai por cima, senão o branco a cobriria.
 *
 * Se as duas leituras falharem, valem as coordenadas do catálogo.
 *
 * Tudo aqui é função pura sobre o array RGBA do canvas — nada toca o DOM, e
 * por isso dá para testar contra artes sintéticas sem abrir navegador.
 */

export type Analise = {
  janela: Janela;
  /** true = a moldura tem janela vazada e é desenhada por cima da foto. */
  vazada: boolean;
};

export type Caixa = { minX: number; minY: number; maxX: number; maxY: number };

/** Array RGBA do canvas. Uint8ClampedArray na web, Uint8Array nos testes. */
type Pixels = Uint8ClampedArray | Uint8Array;

export function paraJanela(c: Caixa, molde: Janela, folga: number): Janela {
  return {
    x: c.minX,
    y: c.minY,
    largura: c.maxX - c.minX + folga,
    altura: c.maxY - c.minY + folga,
    // O feitio e o raio descrevem a arte, não a medida: continuam vindo do
    // catálogo mesmo quando as coordenadas saem do arquivo.
    forma: molde.forma,
    raio: molde.raio,
  };
}

/**
 * A caixa é grande o bastante para ser a janela, e pequena o bastante para não
 * ser a arte inteira? É o que impede um preenchimento vazado — uma fresta de
 * um pixel na faixa da arte — de virar uma janela do tamanho do story.
 */
export function plausivel(c: Caixa, largura: number, altura: number): boolean {
  const w = (c.maxX - c.minX) / largura;
  const h = (c.maxY - c.minY) / altura;
  // O teto de altura é 0,88 porque moldura quadrada com recorte redondo chega
  // perto de ocupar a arte toda — e um preenchimento vazado passa disso.
  return w > 0.2 && w < 0.99 && h > 0.15 && h < 0.88;
}

/** Caminho 1: a caixa que envolve tudo que é transparente. */
export function janelaVazada(dados: Pixels, w: number, h: number): Caixa | null {
  // Amostra de 2 em 2 pixels: um quarto do trabalho, e 2px de imprecisão numa
  // arte de 1080 de largura não aparece.
  const PASSO = 2;
  const c: Caixa = { minX: w, minY: h, maxX: -1, maxY: -1 };
  let vazios = 0;
  let lidos = 0;

  for (let y = 0; y < h; y += PASSO) {
    for (let x = 0; x < w; x += PASSO) {
      lidos += 1;
      if (dados[(y * w + x) * 4 + 3] >= 16) continue;
      vazios += 1;
      if (x < c.minX) c.minX = x;
      if (x > c.maxX) c.maxX = x;
      if (y < c.minY) c.minY = y;
      if (y > c.maxY) c.maxY = y;
    }
  }

  // Menos de 3% transparente não é janela, é antisserrilhado de borda.
  if (c.maxX < 0 || vazios / lidos < 0.03) return null;
  return c;
}

/**
 * Caminho 2: a mancha branca contínua onde a foto vai.
 *
 * Preenchimento por linhas a partir do centro da janela do catálogo. A
 * exigência sobre esse ponto é só cair dentro do branco — erro de dezenas de
 * pixels na medida não muda o resultado, porque quem delimita a caixa é a
 * borda real da mancha, não o palpite.
 */
export function janelaBranca(
  dados: Pixels,
  w: number,
  h: number,
  reserva: Janela,
): Caixa | null {
  const branco = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return (
      dados[i] >= 250 && dados[i + 1] >= 250 && dados[i + 2] >= 250 && dados[i + 3] >= 250
    );
  };

  const semeX = Math.round(reserva.x + reserva.largura / 2);
  const semeY = Math.round(reserva.y + reserva.altura / 2);
  if (semeX < 0 || semeY < 0 || semeX >= w || semeY >= h) return null;
  if (!branco(semeX, semeY)) return null;

  const visto = new Uint8Array(w * h);
  const pilha: number[] = [semeX, semeY];
  const c: Caixa = { minX: w, minY: h, maxX: -1, maxY: -1 };

  while (pilha.length > 0) {
    const y = pilha.pop() as number;
    const x0 = pilha.pop() as number;
    if (visto[y * w + x0]) continue;

    let esq = x0;
    while (esq > 0 && branco(esq - 1, y)) esq -= 1;
    let dir = x0;
    while (dir < w - 1 && branco(dir + 1, y)) dir += 1;

    for (let x = esq; x <= dir; x += 1) visto[y * w + x] = 1;
    if (esq < c.minX) c.minX = esq;
    if (dir > c.maxX) c.maxX = dir;
    if (y < c.minY) c.minY = y;
    if (y > c.maxY) c.maxY = y;

    // Uma semente por trecho contíguo da linha vizinha, e não uma por pixel —
    // senão a pilha cresce junto com a área preenchida.
    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= h) continue;
      let x = esq;
      while (x <= dir) {
        while (x <= dir && (visto[ny * w + x] === 1 || !branco(x, ny))) x += 1;
        if (x > dir) break;
        pilha.push(x, ny);
        while (x <= dir && visto[ny * w + x] === 0 && branco(x, ny)) x += 1;
      }
    }
  }

  return c.maxX < 0 ? null : c;
}

/** As duas leituras, em ordem, com o catálogo como último recurso. */
export function lerJanela(
  dados: Pixels,
  w: number,
  h: number,
  reserva: Janela,
): Analise {
  const vazada = janelaVazada(dados, w, h);
  if (vazada && plausivel(vazada, w, h)) {
    return { janela: paraJanela(vazada, reserva, 2), vazada: true };
  }

  const clara = janelaBranca(dados, w, h, reserva);
  if (clara && plausivel(clara, w, h)) {
    return { janela: paraJanela(clara, reserva, 1), vazada: false };
  }

  return { janela: reserva, vazada: false };
}
