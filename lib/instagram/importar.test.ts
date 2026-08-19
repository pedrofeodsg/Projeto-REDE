import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { casarComABase, extrairHandles } from "./importar.ts";

describe("extrairHandles · colagem de texto", () => {
  test("um @ por linha", () => {
    const r = extrairHandles("@joao.silva\n@maria_c\nana.paula");
    assert.equal(r.length, 3);
    assert.deepEqual(
      r.map((h) => h.normalizado),
      ["joao.silva", "maria_c", "ana.paula"],
    );
  });

  test("o cru sai exatamente como entrou", () => {
    const r = extrairHandles("@JoaoSilva");
    assert.equal(r[0].cru, "@JoaoSilva", "o handle cru foi transformado");
    assert.equal(r[0].normalizado, "joaosilva");
  });

  test("linha vazia e espaço não viram registro", () => {
    const r = extrairHandles("@a\n\n   \n@b\n");
    assert.equal(r.length, 2);
  });

  test("o mesmo @ repetido entra uma vez só", () => {
    const r = extrairHandles("@joao\n@JOAO\ninstagram.com/joao");
    assert.equal(r.length, 1);
  });

  test("URL completa vira handle", () => {
    const r = extrairHandles("https://www.instagram.com/maria.souza/");
    assert.equal(r[0].normalizado, "maria.souza");
  });
});

describe("extrairHandles · CSV", () => {
  test("cabeçalho conhecido é descartado", () => {
    const r = extrairHandles("handle,comentario\n@joao,Muito bom!\n@ana,Parabéns");
    assert.equal(r.length, 2);
    assert.deepEqual(
      r.map((h) => h.normalizado),
      ["joao", "ana"],
    );
  });

  test("segunda coluna vira o texto do comentário", () => {
    const r = extrairHandles("@joao,Excelente trabalho");
    assert.equal(r[0].texto, "Excelente trabalho");
  });

  test("vírgula dentro de aspas não quebra a célula", () => {
    const r = extrairHandles('@joao,"Muito bom, parabéns!"');
    assert.equal(r[0].normalizado, "joao");
    assert.equal(r[0].texto, "Muito bom, parabéns!");
  });

  test("aceita ponto e vírgula e tabulação", () => {
    assert.equal(extrairHandles("@joao;oi")[0].texto, "oi");
    assert.equal(extrairHandles("@joao\toi")[0].texto, "oi");
  });

  test("linha sem cabeçalho conhecido não é descartada", () => {
    const r = extrairHandles("@joao,Primeiro\n@ana,Segundo");
    assert.equal(r.length, 2);
  });

  test("@ inválido entra com normalizado nulo, sem perder o cru", () => {
    const r = extrairHandles("nome com espaço e acentuação!");
    assert.equal(r.length, 1);
    assert.equal(r[0].normalizado, null);
    assert.equal(r[0].cru, "nome com espaço e acentuação!");
  });
});

describe("casarComABase", () => {
  const base = new Map([
    ["joao.silva", "id-joao"],
    ["maria_c", "id-maria"],
  ]);

  test("casa por handle normalizado", () => {
    const r = casarComABase(extrairHandles("@Joao.Silva"), base);
    assert.equal(r[0].pessoaId, "id-joao");
  });

  test("quem não está na base fica sem vínculo, e isso não é erro", () => {
    const r = casarComABase(extrairHandles("@desconhecido"), base);
    assert.equal(r[0].pessoaId, null);
  });

  test("@ inválido nunca casa", () => {
    const r = casarComABase(extrairHandles("texto solto aqui"), base);
    assert.equal(r[0].pessoaId, null);
  });

  test("lista mista casa só o que existe", () => {
    const r = casarComABase(
      extrairHandles("@joao.silva\n@ninguem\n@maria_c"),
      base,
    );
    assert.deepEqual(
      r.map((x) => x.pessoaId),
      ["id-joao", null, "id-maria"],
    );
  });
});
