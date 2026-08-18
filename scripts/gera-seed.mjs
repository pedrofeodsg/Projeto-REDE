/**
 * Gera os arquivos de seed a partir da fonte extraída do TSE.
 *
 *   npm run seed:gerar
 *
 * Os .sql existem para quem quiser aplicar pelo SQL Editor ou auditar o que
 * entrou. O carregamento do dia a dia é `npm run seed:aplicar`, que fala
 * direto com o banco.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./env.mjs";

const fonte = JSON.parse(
  readFileSync(join(RAIZ, "supabase", "seed", "fonte", "territorio-tse.json"), "utf8"),
);

const aspas = (texto) => `'${String(texto).replace(/'/g, "''")}'`;

const cabecalho = (titulo) => `-- ${titulo}
-- Gerado por \`npm run seed:gerar\` a partir de supabase/seed/fonte/territorio-tse.json.
-- NÃO editar à mão: a fonte é ${fonte.origem}.
-- Extração de 03/08/2026 · ${fonte.municipio}/${fonte.uf} · ${fonte.zona}ª ZE.

`;

// ── bairros ────────────────────────────────────────────────────────────────
let bairrosSql = cabecalho("Bloco 2 · seed dos 31 bairros");
bairrosSql += "insert into public.bairros (nome, eleitores, regiao) values\n";
bairrosSql += fonte.bairros
  .map((b) => `  (${aspas(b.nome)}, ${b.eleitores}, ${aspas(b.regiao)})`)
  .join(",\n");
bairrosSql += `
on conflict (nome) do update
  set eleitores = excluded.eleitores,
      regiao    = excluded.regiao;
`;

// ── locais de votação ──────────────────────────────────────────────────────
let locaisSql = cabecalho("Bloco 2 · seed dos 40 locais de votação");
locaisSql += fonte.locais
  .map(
    (l) => `insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select ${aspas(l.nome)}, ${aspas(l.endereco)}, b.id, ${l.eleitores}, ${l.secoes}, ${aspas(l.regiao)}
from public.bairros b where b.nome = ${aspas(l.bairro)}
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;`,
  )
  .join("\n\n");
locaisSql += "\n";

const destino = join(RAIZ, "supabase", "seed");
writeFileSync(join(destino, "bairros.sql"), bairrosSql, "utf8");
writeFileSync(join(destino, "locais_votacao.sql"), locaisSql, "utf8");

console.log(`bairros.sql        · ${fonte.bairros.length} bairros`);
console.log(`locais_votacao.sql · ${fonte.locais.length} locais`);
