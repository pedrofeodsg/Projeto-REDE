import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { normalizarHandle } from "./instagram.ts";

describe("normalizarHandle", () => {
  test("tira o arroba", () => {
    assert.deepEqual(normalizarHandle("@JoaoSilva"), { ok: true, handle: "joaosilva" });
  });

  test("aceita sem arroba", () => {
    assert.deepEqual(normalizarHandle("JoaoSilva"), { ok: true, handle: "joaosilva" });
  });

  test("extrai de URL completa", () => {
    assert.deepEqual(normalizarHandle("https://www.instagram.com/joao.silva/"), {
      ok: true,
      handle: "joao.silva",
    });
  });

  test("descarta parâmetro de rastreio da URL", () => {
    assert.deepEqual(normalizarHandle("instagram.com/joao_silva?igsh=abc123"), {
      ok: true,
      handle: "joao_silva",
    });
  });

  test("vazio é ausência, não erro", () => {
    assert.deepEqual(normalizarHandle(""), { ok: true, handle: null });
    assert.deepEqual(normalizarHandle("   "), { ok: true, handle: null });
    assert.deepEqual(normalizarHandle(null), { ok: true, handle: null });
  });

  test("as grafias do mesmo perfil convergem", () => {
    const grafias = [
      "@Joao.Silva",
      "joao.silva",
      "https://instagram.com/joao.silva",
      " JOAO.SILVA ",
    ];
    const normalizados = new Set(
      grafias.map((g) => {
        const r = normalizarHandle(g);
        return r.ok ? r.handle : g;
      }),
    );
    assert.equal(normalizados.size, 1, "grafias diferentes viraram perfis diferentes");
  });

  test("caractere proibido falha", () => {
    assert.equal(normalizarHandle("joão silva!").ok, false);
  });

  test("longo demais falha", () => {
    assert.equal(normalizarHandle("a".repeat(31)).ok, false);
  });
});
