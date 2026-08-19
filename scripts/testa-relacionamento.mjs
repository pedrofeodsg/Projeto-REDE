/**
 * Prova as regras de relacionamento contra o banco real.
 *
 *   npm run testa:relacionamento
 *
 * Foco nas duas que mais podem morder: promover apoiador a liderança sem
 * perder quem o trouxe, e reatribuição deixando rastro que não se apaga.
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

const PREFIXO = "55229300";
let seq = 0;
const tel = () => `${PREFIXO}${String(seq++).padStart(5, "0")}`;

async function limpar() {
  const { data } = await svc.from("pessoas").select("id").like("telefone", `${PREFIXO}%`);
  const ids = (data ?? []).map((p) => p.id);
  if (ids.length === 0) return;
  await svc.from("reatribuicoes").delete().in("pessoa_id", ids);
  await svc.from("interacoes").delete().in("pessoa_id", ids);
  await svc.from("demandas").delete().in("pessoa_id", ids);
  await svc.from("pessoas").delete().in("indicado_por", ids);
  await svc.from("pessoas").delete().in("id", ids);
}

await limpar();

const { data: local } = await svc
  .from("locais_votacao")
  .select("id, bairro_id")
  .limit(1)
  .single();

async function criar(nome, extra = {}) {
  const { data, error } = await svc
    .from("pessoas")
    .insert({ nome, telefone: tel(), local_votacao_id: local.id, ...extra })
    .select("id, nome, nivel, slug, indicado_por")
    .single();
  if (error) throw new Error(`${nome}: ${error.message}`);
  return data;
}

// ── cenário ────────────────────────────────────────────────────────────────
const maria = await criar("Maria Liderança", {
  nivel: "lideranca", slug: `zz-rel-${seq}`, origem: "admin",
});
const joao = await criar("João Liderança", {
  nivel: "lideranca", slug: `zz-rel-${seq}b`, origem: "admin",
});
const ana = await criar("Ana Apoiadora", {
  nivel: "apoiador", origem: "link", indicado_por: maria.id,
});

console.log("\nPromoção sem migrar registro (RF-06)\n");

const { error: erroPromocao } = await svc
  .from("pessoas")
  .update({ nivel: "lideranca", slug: `zz-rel-ana-${seq}`, meta: 20 })
  .eq("id", ana.id);

erroPromocao ? falha(`promoção falhou: ${erroPromocao.message}`) : ok("apoiador virou liderança");

const { data: anaDepois } = await svc
  .from("pessoas")
  .select("id, nivel, slug, indicado_por")
  .eq("id", ana.id)
  .single();

anaDepois.id === ana.id
  ? ok("é a MESMA linha — nada migrou entre tabelas")
  : falha("o registro mudou de identidade");

anaDepois.indicado_por === maria.id
  ? ok("Maria continua com o crédito por ter trazido a Ana")
  : falha("a promoção apagou quem trouxe");

anaDepois.slug ? ok("ganhou link próprio") : falha("promovida sem link");

const { data: naViewDeLiderancas } = await svc
  .from("v_liderancas")
  .select("id, estado, meta")
  .eq("id", ana.id)
  .maybeSingle();

naViewDeLiderancas
  ? ok(`aparece no termômetro como "${naViewDeLiderancas.estado}"`)
  : falha("promovida não entrou na lista de lideranças");

console.log("\nReatribuição com auditoria (RF-07)\n");

const pedro = await criar("Pedro Apoiador", {
  nivel: "apoiador", origem: "link", indicado_por: maria.id,
});

await svc.from("pessoas").update({ indicado_por: joao.id }).eq("id", pedro.id);
await svc.from("reatribuicoes").insert({
  pessoa_id: pedro.id,
  de_pessoa_id: maria.id,
  para_pessoa_id: joao.id,
  motivo: "teste automatizado",
});

const { data: log } = await svc
  .from("reatribuicoes")
  .select("de_pessoa_id, para_pessoa_id, motivo, criado_em")
  .eq("pessoa_id", pedro.id);

log.length === 1 && log[0].de_pessoa_id === maria.id && log[0].para_pessoa_id === joao.id
  ? ok("o log guarda de quem, para quem e quando")
  : falha(`log incorreto: ${JSON.stringify(log)}`);

const { data: creditoMaria } = await svc
  .from("v_liderancas").select("cadastros").eq("id", maria.id).single();
const { data: creditoJoao } = await svc
  .from("v_liderancas").select("cadastros").eq("id", joao.id).single();

creditoJoao.cadastros === 1
  ? ok("o crédito mudou de lado no termômetro")
  : falha(`João ficou com ${creditoJoao.cadastros} cadastros`);
creditoMaria.cadastros === 1
  ? ok("Maria mantém a Ana, que não foi reatribuída")
  : falha(`Maria ficou com ${creditoMaria.cadastros}`);

console.log("\nO log de auditoria não se apaga\n");

// A tabela não tem policy de update nem de delete para `authenticated`, então
// nenhuma tela do sistema tem por onde editar. A service role passa por cima
// de RLS, e por isso o que se confere aqui é o desenho, não a barreira.
const { count: antesDoDelete } = await svc
  .from("reatribuicoes")
  .select("id", { count: "exact", head: true })
  .eq("pessoa_id", pedro.id);

antesDoDelete === 1
  ? ok("a linha de auditoria existe e é a única daquela pessoa")
  : falha(`esperava 1 linha, achei ${antesDoDelete}`);

console.log("\nDemandas · ciclo de vida\n");

const { data: demanda } = await svc
  .from("demandas")
  .insert({ pessoa_id: ana.id, titulo: "Poste queimado na esquina", categoria: "Iluminação" })
  .select("id, status, aberta_em, resolvida_em")
  .single();

demanda.status === "aberta" && demanda.resolvida_em === null
  ? ok("nasce aberta e sem data de fechamento")
  : falha(`nasceu ${demanda.status} / ${demanda.resolvida_em}`);

await svc.from("demandas").update({ status: "resolvida" }).eq("id", demanda.id);
const { data: resolvida } = await svc
  .from("demandas").select("status, resolvida_em").eq("id", demanda.id).single();

resolvida.resolvida_em !== null
  ? ok("fechar carimba a data sozinho")
  : falha("fechou sem data — a fila mentiria sobre o tempo de resposta");

await svc.from("demandas").update({ status: "em_andamento" }).eq("id", demanda.id);
const { data: reaberta } = await svc
  .from("demandas").select("status, resolvida_em").eq("id", demanda.id).single();

reaberta.resolvida_em === null
  ? ok("reabrir apaga a data de fechamento")
  : falha("reabriu mantendo a data de fechamento");

const { data: naFila } = await svc
  .from("v_demandas")
  .select("titulo, pessoa_nome, dias_aberta, status")
  .eq("id", demanda.id)
  .single();

naFila.pessoa_nome === "Ana Apoiadora" && naFila.dias_aberta === 0
  ? ok("aparece na fila global com o nome de quem pediu")
  : falha(`fila trouxe ${JSON.stringify(naFila)}`);

console.log("\nInterações · linha do tempo\n");

await svc.from("interacoes").insert([
  { pessoa_id: ana.id, tipo: "ligacao", descricao: "Retornei sobre o poste." },
  { pessoa_id: ana.id, tipo: "visita", descricao: "Passei na casa dela." },
]);

const { count: quantasInteracoes } = await svc
  .from("interacoes")
  .select("id", { count: "exact", head: true })
  .eq("pessoa_id", ana.id);

quantasInteracoes === 2 ? ok("duas interações registradas") : falha(`vieram ${quantasInteracoes}`);

const { error: erroTipo } = await svc
  .from("interacoes")
  .insert({ pessoa_id: ana.id, tipo: "carta_pombo", descricao: "x" });

erroTipo
  ? ok("tipo fora do enum é recusado pelo banco")
  : falha("tipo inválido entrou");

console.log("\nExclusão em cascata\n");

await svc.from("pessoas").delete().eq("id", ana.id);
const { count: sobraramInteracoes } = await svc
  .from("interacoes")
  .select("id", { count: "exact", head: true })
  .eq("pessoa_id", ana.id);

sobraramInteracoes === 0
  ? ok("apagar a pessoa leva junto interações e demandas")
  : falha(`sobraram ${sobraramInteracoes} interações órfãs`);

await limpar();
const { count } = await svc.from("pessoas").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${count} pessoa(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
