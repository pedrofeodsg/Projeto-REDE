/**
 * Os 4 checks de integridade do seed territorial (PRD, Seção 6.3).
 *
 *   npm run validate:seed
 *
 * Roda antes do build. O deploy não sobe com seed inconsistente, porque
 * penetração é uma divisão e denominador errado erra em silêncio.
 *
 * As regras moram em SQL, na função public.validar_seed() — este script só
 * chama e traduz o resultado em código de saída.
 */
import { createClient } from "@supabase/supabase-js";

import { comRetentativa, env } from "./env.mjs";

async function main() {
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const { data: checks, error } = await comRetentativa(() => supabase.rpc("validar_seed"));

  if (error) {
    console.error(`\n  não deu para validar o seed: ${error.message}\n`);
    return 1;
  }

  console.log("\nBase territorial · integridade do seed\n");

  let falhas = 0;
  for (const c of checks) {
    if (!c.ok) falhas += 1;
    console.log(
      `  ${c.ok ? "ok   " : "FALHA"} ${c.verificacao.padEnd(38)} ${String(c.encontrado).padEnd(22)} ${c.detalhe}`,
    );
  }

  console.log(
    falhas === 0
      ? "\nSeed íntegro.\n"
      : `\n${falhas} check(s) falhando. O deploy não sobe assim.\n`,
  );

  return falhas === 0 ? 0 : 1;
}

// process.exit() aqui derruba o Node no Windows: o cliente do Supabase mantém
// socket keep-alive aberto e o libuv aborta com código 127, o que faria o build
// falhar mesmo com o seed íntegro. Marcar o código e deixar o event loop
// drenar é o que faz a saída ser lida corretamente.
process.exitCode = await main();
