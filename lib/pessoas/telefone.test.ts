import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { formatarTelefone, normalizarTelefone } from "./telefone.ts";

describe("normalizarTelefone", () => {
  test("celular com máscara vira dígitos com 55", () => {
    assert.deepEqual(normalizarTelefone("(22) 99999-9999"), {
      ok: true,
      telefone: "5522999999999",
    });
  });

  test("celular só com dígitos ganha o 55", () => {
    assert.deepEqual(normalizarTelefone("22999999999"), {
      ok: true,
      telefone: "5522999999999",
    });
  });

  test("número que já tem 55 é mantido", () => {
    assert.deepEqual(normalizarTelefone("5522999999999"), {
      ok: true,
      telefone: "5522999999999",
    });
  });

  test("formato internacional com espaços e sinal", () => {
    assert.deepEqual(normalizarTelefone("+55 22 99999-9999"), {
      ok: true,
      telefone: "5522999999999",
    });
  });

  test("curto demais falha", () => {
    const r = normalizarTelefone("99999999");
    assert.equal(r.ok, false);
  });

  test("fixo de 10 dígitos ganha o 55", () => {
    assert.deepEqual(normalizarTelefone("2226431234"), {
      ok: true,
      telefone: "552226431234",
    });
  });

  test("as três grafias do mesmo número convergem", () => {
    const grafias = ["(22) 99999-9999", "22999999999", "+55 22 99999-9999"];
    const normalizados = new Set(
      grafias.map((g) => {
        const r = normalizarTelefone(g);
        return r.ok ? r.telefone : g;
      }),
    );
    assert.equal(normalizados.size, 1, "grafias diferentes viraram pessoas diferentes");
  });

  test("vazio falha com mensagem própria", () => {
    const r = normalizarTelefone("");
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.erro, /Informe/);
  });

  test("13 dígitos sem começar com 55 falha", () => {
    assert.equal(normalizarTelefone("1122999999999").ok, false);
  });

  test("longo demais falha", () => {
    assert.equal(normalizarTelefone("55229999999999999").ok, false);
  });
});

describe("formatarTelefone", () => {
  test("celular", () => {
    assert.equal(formatarTelefone("5522999999999"), "+55 (22) 99999-9999");
  });

  test("fixo", () => {
    assert.equal(formatarTelefone("552226431234"), "+55 (22) 2643-1234");
  });
});
