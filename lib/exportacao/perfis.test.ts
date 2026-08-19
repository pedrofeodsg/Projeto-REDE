import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  scanearVazamento,
  type RelatorioCandidato,
} from "./perfis.ts";

const RELATORIO: RelatorioCandidato = {
  perfil: "candidato",
  estrutura: "Gabinete do Vereador Pedro Abreu",
  municipio: "São Pedro da Aldeia",
  extraidoEm: "2026-08-18T12:00:00.000Z",
  fonteTerritorial: "TSE · 59ª ZE · extração de 03/08/2026",
  numeros: {
    cadastrados: 812,
    eleitorado: 75083,
    penetracaoPct: 1.08,
    liderancasAtivas: 48,
    liderancasTotal: 70,
    colegiosCobertos: 26,
    colegiosTotal: 40,
  },
  regioes: [
    {
      regiao: "R1",
      nome: "Central (Sede)",
      eleitores: 36252,
      eleitoradoPct: 48.3,
      cadastros: 380,
      cadastrosPct: 46.8,
      desvioPp: -1.5,
    },
  ],
  colegios: [
    {
      nome: "CIEP 272 - Gabriel Joaquim dos Santos",
      bairro: "São João",
      regiao: "R2",
      eleitores: 4047,
      cadastros: 61,
      penetracaoPct: 1.51,
      temCobertura: true,
    },
  ],
  curva: [{ semana: "2026-08-10", novos: 210, acumulado: 812 }],
  projecao: { ate: "2026-10-04", estimado: 2400 },
  liderancas: [
    { nome: "Maria do Carmo Ferreira", bairro: "São João", regiao: "R2", cadastros: 34 },
  ],
};

describe("o relatório do candidato não vaza contato", () => {
  test("o payload legítimo passa limpo", () => {
    assert.deepEqual(scanearVazamento(RELATORIO), []);
  });

  test("campo chamado telefone é pego", () => {
    const sujo = {
      ...RELATORIO,
      liderancas: [{ ...RELATORIO.liderancas[0], telefone: "5522999998888" }],
    };
    const achados = scanearVazamento(sujo);
    assert.ok(achados.length > 0, "o telefone passou batido");
    assert.match(achados[0].caminho, /liderancas\[0\]\.telefone/);
  });

  test("telefone escondido em campo de nome inocente é pego", () => {
    const sujo = {
      ...RELATORIO,
      liderancas: [{ ...RELATORIO.liderancas[0], observacao: "chamar no 5522999998888" }],
    };
    assert.ok(scanearVazamento(sujo).length > 0, "telefone em texto livre passou");
  });

  test("telefone mascarado também é pego", () => {
    const sujo = { ...RELATORIO, estrutura: "Gabinete · (22) 99999-8888" };
    assert.ok(scanearVazamento(sujo).length > 0, "telefone mascarado passou");
  });

  test("campo de e-mail é pego", () => {
    const sujo = { ...RELATORIO, contato_email: "x@y.com" };
    assert.ok(scanearVazamento(sujo).length > 0);
  });

  test("aninhamento profundo não escapa", () => {
    const sujo = {
      ...RELATORIO,
      extra: { nivel2: { nivel3: [{ whatsapp: "5522999998888" }] } },
    };
    const achados = scanearVazamento(sujo);
    assert.ok(achados.some((a) => a.caminho.includes("nivel3")));
  });

  test("número grande que não é telefone não gera falso positivo", () => {
    const limpo = { ...RELATORIO, numeros: { ...RELATORIO.numeros, eleitorado: 75083 } };
    assert.deepEqual(scanearVazamento(limpo), []);
  });

  test("a data ISO não vira falso positivo", () => {
    assert.deepEqual(scanearVazamento({ extraidoEm: "2026-08-18T12:00:00.000Z" }), []);
  });
});

describe("a forma do relatório não tem onde guardar contato", () => {
  test("liderança do candidato tem exatamente quatro campos", () => {
    const chaves = Object.keys(RELATORIO.liderancas[0]).sort();
    assert.deepEqual(chaves, ["bairro", "cadastros", "nome", "regiao"]);
  });

  test("não existe lista de apoiadores no relatório", () => {
    assert.equal(
      Object.keys(RELATORIO).some((k) => /apoiador/i.test(k)),
      false,
    );
  });
});
