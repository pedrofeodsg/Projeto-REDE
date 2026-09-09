import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Janela } from "./catalogo.ts";
import { lerJanela } from "./janela.ts";

/*
 * Artes sintéticas no tamanho real do story.
 *
 * A moldura de verdade só existe como PNG, então o que se prova aqui é a
 * leitura: dado um arquivo com este feitio, as coordenadas saem certas. Os
 * números batem com a moldura "Eu voto e indico" — cartão branco no meio de um
 * fundo texturizado, cortado por uma faixa colorida na altura dos logos.
 */

const W = 1080;
const H = 1920;

// A mesma reserva que está no catálogo.
const RESERVA: Janela = {
  x: 75,
  y: 78,
  largura: 930,
  altura: 1107,
  forma: "retangulo",
  raio: 48,
};

const CARTAO = { x: 75, y: 78, x2: 1004, y2: 1844 };
const FAIXA = { y: 1185, y2: 1250 };

type Tinta = [number, number, number, number];

const FUNDO: Tinta = [232, 232, 232, 255]; // textura cinza, fora do cartão
const BRANCO: Tinta = [255, 255, 255, 255];
const AZUL: Tinta = [20, 58, 126, 255];
const VAZIO: Tinta = [0, 0, 0, 0];

function tela(base: Tinta): Uint8Array {
  const px = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i += 1) {
    px[i * 4] = base[0];
    px[i * 4 + 1] = base[1];
    px[i * 4 + 2] = base[2];
    px[i * 4 + 3] = base[3];
  }
  return px;
}

function pintar(
  px: Uint8Array,
  x: number,
  y: number,
  x2: number,
  y2: number,
  cor: Tinta,
) {
  for (let l = y; l <= y2; l += 1) {
    for (let c = x; c <= x2; c += 1) {
      const i = (l * W + c) * 4;
      px[i] = cor[0];
      px[i + 1] = cor[1];
      px[i + 2] = cor[2];
      px[i + 3] = cor[3];
    }
  }
}

/** Moldura chapada: a área da foto vem pintada de branco. */
function molduraChapada({ frestaNaFaixa = false } = {}): Uint8Array {
  const px = tela(FUNDO);
  pintar(px, CARTAO.x, CARTAO.y, CARTAO.x2, CARTAO.y2, BRANCO);
  pintar(px, CARTAO.x, FAIXA.y, CARTAO.x2, FAIXA.y2, AZUL);
  if (frestaNaFaixa) {
    // Um pixel de branco atravessando a faixa: o caso que faria o
    // preenchimento vazar para a metade de baixo do cartão.
    pintar(px, 540, FAIXA.y, 540, FAIXA.y2, BRANCO);
  }
  return px;
}

/** Moldura vazada: a área da foto vem recortada em transparência. */
function molduraVazada(): Uint8Array {
  const px = molduraChapada();
  pintar(px, CARTAO.x, CARTAO.y, CARTAO.x2, FAIXA.y - 1, VAZIO);
  return px;
}

describe("lerJanela · moldura vazada", () => {
  const r = lerJanela(molduraVazada(), W, H, RESERVA);

  test("reconhece que a moldura é vazada", () => {
    assert.equal(r.vazada, true);
  });

  test("acha a janela com a precisão da amostragem de 2px", () => {
    // A varredura anda de 2 em 2, então cada borda pode errar por até 1px.
    assert.ok(Math.abs(r.janela.x - CARTAO.x) <= 2, `x = ${r.janela.x}`);
    assert.ok(Math.abs(r.janela.y - CARTAO.y) <= 2, `y = ${r.janela.y}`);
    assert.ok(
      Math.abs(r.janela.largura - (CARTAO.x2 - CARTAO.x + 1)) <= 3,
      `largura = ${r.janela.largura}`,
    );
    assert.ok(
      Math.abs(r.janela.altura - (FAIXA.y - CARTAO.y)) <= 3,
      `altura = ${r.janela.altura}`,
    );
  });

  test("mantém o raio do catálogo", () => {
    assert.equal(r.janela.raio, RESERVA.raio);
  });
});

describe("lerJanela · moldura chapada", () => {
  const r = lerJanela(molduraChapada(), W, H, RESERVA);

  test("desenha a foto por cima, porque a moldura não tem buraco", () => {
    assert.equal(r.vazada, false);
  });

  test("a mancha branca dá a janela exata", () => {
    assert.deepEqual(r.janela, {
      x: CARTAO.x,
      y: CARTAO.y,
      largura: CARTAO.x2 - CARTAO.x + 1,
      altura: FAIXA.y - CARTAO.y,
      forma: "retangulo",
      raio: RESERVA.raio,
    });
  });

  test("a faixa segura o preenchimento longe da metade de baixo", () => {
    assert.ok(r.janela.y + r.janela.altura <= FAIXA.y, "vazou para depois da faixa");
  });
});

describe("lerJanela · a medida do catálogo é só rede de segurança", () => {
  test("um palpite torto ainda encontra a janela certa", () => {
    // Semente 200px fora do centro: o que delimita é a borda da mancha, não o
    // palpite. É por isso que medir no olho não compromete o alinhamento.
    const torta: Janela = { ...RESERVA, x: 275, y: 278, largura: 530, altura: 707 };
    const r = lerJanela(molduraChapada(), W, H, torta);
    assert.equal(r.janela.x, CARTAO.x);
    assert.equal(r.janela.altura, FAIXA.y - CARTAO.y);
  });

  test("vazamento pela fresta é recusado e o catálogo assume", () => {
    const r = lerJanela(molduraChapada({ frestaNaFaixa: true }), W, H, RESERVA);
    assert.deepEqual(r.janela, RESERVA);
    assert.equal(r.vazada, false);
  });

  test("arte sem janela nenhuma cai no catálogo", () => {
    const r = lerJanela(tela(FUNDO), W, H, RESERVA);
    assert.deepEqual(r.janela, RESERVA);
  });

  test("arte inteiramente transparente cai no catálogo", () => {
    const r = lerJanela(tela(VAZIO), W, H, RESERVA);
    assert.deepEqual(r.janela, RESERVA);
  });
});
