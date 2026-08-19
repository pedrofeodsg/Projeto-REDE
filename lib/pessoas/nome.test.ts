import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { comoChamar, nomeCompleto } from "./nome.ts";

describe("nomeCompleto", () => {
  test("junta nome e apelido", () => {
    assert.equal(
      nomeCompleto("Maria do Carmo Ferreira", "Dona Cota"),
      "Maria do Carmo Ferreira (Dona Cota)",
    );
  });

  test("sem apelido, devolve só o nome", () => {
    assert.equal(nomeCompleto("João Batista Alves"), "João Batista Alves");
    assert.equal(nomeCompleto("João Batista Alves", null), "João Batista Alves");
    assert.equal(nomeCompleto("João Batista Alves", "   "), "João Batista Alves");
  });

  test("apelido que já está no nome não vira repetição", () => {
    assert.equal(nomeCompleto("Zé do Bar Souza", "Zé do Bar"), "Zé do Bar Souza");
    assert.equal(nomeCompleto("MARIA COTA", "Cota"), "MARIA COTA");
  });
});

describe("comoChamar", () => {
  test("o apelido ganha do primeiro nome", () => {
    assert.equal(comoChamar("Maria do Carmo Ferreira", "Dona Cota"), "Dona Cota");
  });

  test("sem apelido, usa o primeiro nome", () => {
    assert.equal(comoChamar("Maria do Carmo Ferreira"), "Maria");
  });

  test("espaço extra não vira apelido", () => {
    assert.equal(comoChamar("João Batista", "  "), "João");
  });
});
