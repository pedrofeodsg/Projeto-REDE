import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { gerarSlug, gerarSlugUnico, slugEhReservado, slugEhValido } from "./slug.ts";

describe("gerarSlug", () => {
  test("tira acento e junta com hífen", () => {
    assert.equal(gerarSlug("João da Conceição"), "joao-da-conceicao");
  });

  test("cedilha e til", () => {
    assert.equal(gerarSlug("Assunção Gonçalves"), "assuncao-goncalves");
  });

  test("pontuação e espaço extra viram um hífen só", () => {
    assert.equal(gerarSlug("  Maria   J.  Silva-Souza  "), "maria-j-silva-souza");
  });

  test("não sobra hífen na ponta", () => {
    assert.equal(gerarSlug("!!! Zé !!!"), "ze");
  });

  test("nome sem letra devolve vazio", () => {
    assert.equal(gerarSlug("###"), "");
  });
});

describe("slugEhValido", () => {
  test("aceita o formato canônico", () => {
    assert.equal(slugEhValido("joao-da-conceicao"), true);
  });

  test("recusa hífen duplo, ponta e maiúscula", () => {
    assert.equal(slugEhValido("joao--silva"), false);
    assert.equal(slugEhValido("-joao"), false);
    assert.equal(slugEhValido("Joao"), false);
  });
});

describe("slugEhReservado", () => {
  test("rotas do admin não podem virar slug de liderança", () => {
    for (const rota of ["painel", "liderancas", "territorio", "login", "api"]) {
      assert.equal(slugEhReservado(rota), true, `${rota} deveria ser reservado`);
    }
  });

  test("nome comum não é reservado", () => {
    assert.equal(slugEhReservado("joao-silva"), false);
  });
});

describe("gerarSlugUnico", () => {
  test("sem colisão devolve a base", () => {
    assert.equal(gerarSlugUnico("João Silva", []), "joao-silva");
  });

  test("colisão ganha sufixo", () => {
    assert.equal(gerarSlugUnico("João Silva", ["joao-silva"]), "joao-silva-2");
  });

  test("colisão em cadeia continua contando", () => {
    assert.equal(
      gerarSlugUnico("João Silva", ["joao-silva", "joao-silva-2", "joao-silva-3"]),
      "joao-silva-4",
    );
  });

  test("liderança chamada Painel não sequestra o dashboard", () => {
    assert.equal(gerarSlugUnico("Painel", []), "painel-2");
  });
});
