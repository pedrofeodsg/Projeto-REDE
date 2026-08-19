/**
 * Prova as agregações territoriais contra o banco real.
 *
 *   npm run testa:territorio
 *
 * O caso central é o do guia: um bairro com 1 cadastro em 136 eleitores tem
 * que aparecer ACIMA de um com 50 cadastros em 8.384. Volume absoluto mente, e
 * é essa inversão que decide onde a campanha faz a próxima caminhada.
 *
 * Cria dados de teste e apaga tudo no fim.
 */
import { createClient } from "@supabase/supabase-js";

import { env } from "./env.mjs";

const svc = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

let falhas = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const falha = (m) => {
  falhas += 1;
  console.log(`  FALHA ${m}`);
};

const PREFIXO = "55229200";
let seq = 0;
const tel = () => `${PREFIXO}${String(seq++).padStart(5, "0")}`;

async function limpar() {
  const { data } = await svc.from("pessoas").select("id").like("telefone", `${PREFIXO}%`);
  const ids = (data ?? []).map((p) => p.id);
  if (ids.length === 0) return;
  await svc.from("temperatura_historico").delete().in("pessoa_id", ids);
  await svc.from("envios").delete().in("pessoa_id", ids);
  await svc.from("pessoas").delete().in("indicado_por", ids);
  await svc.from("pessoas").delete().in("id", ids);
}

await limpar();

// ── cenário ────────────────────────────────────────────────────────────────
const { data: locais } = await svc
  .from("locais_votacao")
  .select("id, nome, eleitores, bairro_id, bairros!inner(nome, eleitores)")
  .order("eleitores", { ascending: false });

const grande = locais.find((l) => l.bairros.nome === "São João");
const minusculo = locais.find((l) => l.bairros.nome === "Três Vendas");

if (!grande || !minusculo) {
  console.error("cenário indisponível: faltam os bairros de referência");
  process.exit(1);
}

async function apoiadores(localId, quantos) {
  const linhas = Array.from({ length: quantos }, () => ({
    nome: `Apoiador de Teste ${tel()}`,
    telefone: tel(),
    nivel: "apoiador",
    origem: "link",
    local_votacao_id: localId,
  }));
  const { error } = await svc.from("pessoas").insert(linhas);
  if (error) throw new Error(error.message);
}

console.log("\nA inversão que o volume absoluto esconde\n");

await apoiadores(grande.id, 50);
await apoiadores(minusculo.id, 1);

const { data: bairros, error: erroBairros } = await svc
  .from("v_penetracao_bairro")
  .select("nome, eleitores, cadastros, penetracao_pct")
  .order("penetracao_pct", { ascending: true, nullsFirst: true });

if (erroBairros) {
  falha(`não deu para ler a penetração: ${erroBairros.message}`);
} else {
  const comCadastro = bairros.filter((b) => b.cadastros > 0);
  const saoJoao = comCadastro.find((b) => b.nome === "São João");
  const tresVendas = comCadastro.find((b) => b.nome === "Três Vendas");

  console.log(
    `        São João    ${saoJoao.cadastros} cadastros / ${saoJoao.eleitores.toLocaleString("pt-BR")} eleitores = ${Number(saoJoao.penetracao_pct).toFixed(3)}%`,
  );
  console.log(
    `        Três Vendas ${String(tresVendas.cadastros).padStart(2)} cadastro  / ${String(tresVendas.eleitores).padStart(5)} eleitores = ${Number(tresVendas.penetracao_pct).toFixed(3)}%`,
  );
  console.log("");

  Number(tresVendas.penetracao_pct) > Number(saoJoao.penetracao_pct)
    ? ok("1 em 136 é mais penetração que 50 em 8.384")
    : falha("a penetração não inverteu");

  const posSaoJoao = comCadastro.findIndex((b) => b.nome === "São João");
  const posTresVendas = comCadastro.findIndex((b) => b.nome === "Três Vendas");

  posSaoJoao < posTresVendas
    ? ok("na ordem crescente, São João aparece ANTES — é onde mais falta")
    : falha("a ordenação crescente não colocou o mais descoberto no topo");
}

console.log("\nBuraco e sobreposição\n");

const { data: antesBuraco } = await svc
  .from("v_penetracao_local")
  .select("nome, eleitores, buraco, liderancas_ancora")
  .eq("id", grande.id)
  .single();

antesBuraco.buraco === true
  ? ok(`"${antesBuraco.nome}" marcado como buraco: ${antesBuraco.eleitores.toLocaleString("pt-BR")} eleitores e zero âncora`)
  : falha("colégio grande sem liderança não foi marcado como buraco");

const { data: lider1 } = await svc
  .from("pessoas")
  .insert({
    nome: "Âncora Um", telefone: tel(), nivel: "lideranca",
    slug: `zz-terr-${seq}`, local_votacao_id: grande.id, origem: "admin",
  })
  .select("id").single();

const { data: comUma } = await svc
  .from("v_penetracao_local")
  .select("buraco, sobreposicao, liderancas_ancora")
  .eq("id", grande.id)
  .single();

comUma.buraco === false && comUma.sobreposicao === false
  ? ok("com uma âncora, deixa de ser buraco e ainda não é sobreposição")
  : falha(`com uma âncora veio buraco=${comUma.buraco} sobreposicao=${comUma.sobreposicao}`);

await svc.from("pessoas").insert({
  nome: "Âncora Dois", telefone: tel(), nivel: "lideranca",
  slug: `zz-terr-${seq}b`, local_votacao_id: grande.id, origem: "admin",
});

const { data: comDuas } = await svc
  .from("v_penetracao_local")
  .select("sobreposicao, liderancas_ancora")
  .eq("id", grande.id)
  .single();

comDuas.sobreposicao === true && comDuas.liderancas_ancora === 2
  ? ok("com duas âncoras, vira sobreposição")
  : falha(`sobreposição não detectada: ${JSON.stringify(comDuas)}`);

const { data: pequenoSemLider } = await svc
  .from("v_penetracao_local")
  .select("nome, eleitores, buraco")
  .eq("id", minusculo.id)
  .single();

pequenoSemLider.buraco === false
  ? ok(`colégio pequeno sem âncora não vira alarme (${pequenoSemLider.eleitores} eleitores)`)
  : falha("colégio abaixo de 2.000 eleitores foi marcado como buraco");

console.log("\nQuem vota fora do município\n");

await svc.from("pessoas").insert({
  nome: "Apoiador de Cabo Frio",
  telefone: tel(),
  nivel: "apoiador",
  origem: "link",
  indicado_por: lider1.id,
  fora_do_municipio: true,
});

const { data: bairrosDepois } = await svc
  .from("v_penetracao_bairro")
  .select("cadastros");
const somaTerritorial = bairrosDepois.reduce((s, b) => s + b.cadastros, 0);

somaTerritorial === 51
  ? ok("fica fora do cálculo territorial (51 no território, não 52)")
  : falha(`território somou ${somaTerritorial}, esperava 51`);

const { data: creditoDaLideranca } = await svc
  .from("v_liderancas")
  .select("cadastros")
  .eq("id", lider1.id)
  .single();

creditoDaLideranca.cadastros === 1
  ? ok("mas entra no crédito de quem o trouxe")
  : falha(`crédito da liderança veio ${creditoDaLideranca.cadastros}`);

console.log("\nCobertura por macro-região\n");

const { data: cobertura } = await svc
  .from("v_cobertura_regiao")
  .select("regiao, eleitorado_pct, cadastros_pct, desvio_pp")
  .order("regiao");

const esperado = { R1: 48.3, R2: 35.1, R3: 16.6 };
let regioesOk = true;
for (const r of cobertura) {
  if (Math.abs(Number(r.eleitorado_pct) - esperado[r.regiao]) > 0.15) {
    regioesOk = false;
    falha(`${r.regiao} eleitorado ${r.eleitorado_pct}%, esperava ${esperado[r.regiao]}%`);
  }
}
if (regioesOk) ok("proporção do eleitorado bate com o PRD: 48,3 / 35,1 / 16,6");

const r2 = cobertura.find((r) => r.regiao === "R2");
Number(r2.cadastros_pct) > 90
  ? ok(`com quase tudo em São João, R2 concentra ${r2.cadastros_pct}% e o desvio salta para ${r2.desvio_pp} pp`)
  : falha(`R2 deveria concentrar os cadastros, veio ${r2.cadastros_pct}%`);

console.log("\nSelos de volume\n");

const { data: comSelo } = await svc
  .from("v_liderancas")
  .select("selo, cadastros")
  .eq("id", lider1.id)
  .single();

comSelo.selo === 0
  ? ok("1 cadastro não ganha selo")
  : falha(`selo veio ${comSelo.selo} com ${comSelo.cadastros} cadastros`);

await apoiadores(grande.id, 0);
const extras = Array.from({ length: 12 }, () => ({
  nome: `Apoiador ${tel()}`, telefone: tel(), nivel: "apoiador",
  origem: "link", indicado_por: lider1.id, local_votacao_id: grande.id,
}));
await svc.from("pessoas").insert(extras);

const { data: comSelo10 } = await svc
  .from("v_liderancas")
  .select("selo, cadastros")
  .eq("id", lider1.id)
  .single();

comSelo10.selo === 10
  ? ok(`${comSelo10.cadastros} cadastros ganham o selo de 10`)
  : falha(`selo veio ${comSelo10.selo} com ${comSelo10.cadastros} cadastros`);

console.log("\nSnapshot semanal do histórico\n");

const { data: gravados, error: erroSnap } = await svc.rpc("gravar_snapshot_temperatura");
if (erroSnap) {
  falha(`snapshot falhou: ${erroSnap.message}`);
} else {
  gravados > 0 ? ok(`snapshot gravou ${gravados} liderança(s)`) : falha("snapshot não gravou nada");

  const { data: denovo } = await svc.rpc("gravar_snapshot_temperatura");
  denovo === 0
    ? ok("rodar de novo no mesmo dia não duplica linha")
    : falha(`segunda chamada gravou ${denovo} linhas`);
}

await limpar();
const { count } = await svc.from("pessoas").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${count} pessoa(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
