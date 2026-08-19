import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { montarLinkWa, montarMensagem } from "./index.ts";

const CORPO = `Olá {nome}, aqui é o Pedro Abreu.

Vou ser direto.

{linha_pessoal}

Esta página é exclusivamente sua:
{link_cadastro}

Posso contar com você?`;

describe("montarMensagem", () => {
  test("trata pelo primeiro nome", () => {
    const m = montarMensagem(CORPO, {
      nome: "Maria do Carmo Ferreira",
      linkCadastro: "https://x.com.br/maria",
    });
    assert.match(m, /^Olá Maria, aqui é o Pedro Abreu\./);
    assert.doesNotMatch(m, /do Carmo/);
  });

  test("com linha pessoal, ela aparece no lugar", () => {
    const m = montarMensagem(CORPO, {
      nome: "Maria",
      linkCadastro: "https://x.com.br/maria",
      linhaPessoal: "depois do que você fez na Rua do Fogo em 2024",
    });
    assert.match(m, /Rua do Fogo em 2024/);
  });

  test("sem linha pessoal, o texto flui sem buraco", () => {
    const m = montarMensagem(CORPO, {
      nome: "Maria",
      linkCadastro: "https://x.com.br/maria",
    });
    assert.doesNotMatch(m, /\{linha_pessoal\}/);
    assert.doesNotMatch(m, /\n{3,}/, "sobrou quebra tripla onde a linha saiu");
    assert.match(m, /Vou ser direto\.\n\nEsta página é exclusivamente sua:/);
  });

  test("linha pessoal só com espaço conta como vazia", () => {
    const m = montarMensagem(CORPO, {
      nome: "Maria",
      linkCadastro: "https://x.com.br/maria",
      linhaPessoal: "   ",
    });
    assert.doesNotMatch(m, /\n{3,}/);
  });

  test("interpola números de reconhecimento e reativação", () => {
    const m = montarMensagem(
      "Você trouxe {cadastrados} e faltam {faltam} para a meta de {meta}.",
      { nome: "João", linkCadastro: "x", cadastrados: 12, meta: 20, faltam: 8 },
    );
    assert.equal(m, "Você trouxe 12 e faltam 8 para a meta de 20.");
  });

  test("números ausentes viram zero, nunca 'undefined'", () => {
    const m = montarMensagem("{cadastrados}/{meta}", {
      nome: "João",
      linkCadastro: "x",
    });
    assert.equal(m, "0/0");
  });

  test("nenhum marcador sobra na mensagem final", () => {
    const m = montarMensagem(CORPO, { nome: "Ana", linkCadastro: "https://x/a" });
    assert.doesNotMatch(m, /\{[a-z_]+\}/);
  });
});

describe("montarLinkWa", () => {
  test("monta o formato oficial com o telefone só em dígitos", () => {
    const link = montarLinkWa("5522999998888", "Olá");
    assert.match(link, /^https:\/\/wa\.me\/5522999998888\?text=Ol%C3%A1$/);
  });

  test("aceita telefone com máscara e limpa", () => {
    const link = montarLinkWa("+55 (22) 99999-8888", "oi");
    assert.match(link, /^https:\/\/wa\.me\/5522999998888\?text=oi$/);
  });

  test("quebra de linha vira %0A", () => {
    const link = montarLinkWa("5522999998888", "linha um\nlinha dois");
    assert.match(link, /linha%20um%0Alinha%20dois/);
  });

  test("acento e emoji sobrevivem", () => {
    const link = montarLinkWa("5522999998888", "Não é ação?");
    assert.equal(
      decodeURIComponent(link.split("?text=")[1]),
      "Não é ação?",
    );
  });
});
