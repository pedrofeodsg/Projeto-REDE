/**
 * Carrega a base territorial no banco.
 *
 *   npm run seed:aplicar
 *
 * Idempotente: roda quantas vezes quiser. Usa service role porque as tabelas
 * de território não têm policy de escrita — não existe, e não vai existir,
 * tela de edição de território.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { comRetentativa, env, RAIZ } from "./env.mjs";

const fonte = JSON.parse(
  readFileSync(join(RAIZ, "supabase", "seed", "fonte", "territorio-tse.json"), "utf8"),
);

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

console.log(`bairros: ${fonte.bairros.length}`);
const { error: erroBairros } = await comRetentativa(() =>
  supabase
    .from("bairros")
    .upsert(
      fonte.bairros.map(({ nome, eleitores, regiao }) => ({ nome, eleitores, regiao })),
      { onConflict: "nome" },
    ),
);
if (erroBairros) {
  console.error("falha nos bairros:", erroBairros.message);
  process.exit(1);
}

const { data: bairros, error: erroLeitura } = await comRetentativa(() =>
  supabase.from("bairros").select("id, nome"),
);
if (erroLeitura) {
  console.error("falha ao reler bairros:", erroLeitura.message);
  process.exit(1);
}

const idPorNome = new Map(bairros.map((b) => [b.nome, b.id]));

console.log(`locais: ${fonte.locais.length}`);
const linhasLocais = fonte.locais.map((l) => {
  const bairroId = idPorNome.get(l.bairro);
  if (!bairroId) throw new Error(`Bairro "${l.bairro}" não está no banco.`);
  return {
    nome: l.nome,
    endereco: l.endereco,
    bairro_id: bairroId,
    eleitores: l.eleitores,
    secoes: l.secoes,
    regiao: l.regiao,
  };
});

const { error: erroLocais } = await comRetentativa(() =>
  supabase.from("locais_votacao").upsert(linhasLocais, { onConflict: "bairro_id,nome" }),
);
if (erroLocais) {
  console.error("falha nos locais:", erroLocais.message);
  process.exit(1);
}

console.log("\nseed aplicado. rode `npm run validate:seed` para conferir.");
