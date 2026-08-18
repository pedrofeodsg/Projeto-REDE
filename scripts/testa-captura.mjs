/**
 * Prova a regra de captura pública contra o banco real.
 *
 *   npm run testa:captura
 *
 * Exercita as MESMAS funções que a página `/[slug]` usa — não uma imitação
 * delas. Por isso roda com `--conditions=react-server`: é a condição que faz o
 * pacote `server-only` resolver para o módulo vazio, como acontece dentro do
 * Next.
 *
 * Cria dados de teste, prova cada regra e apaga tudo no fim.
 */
import { createClient } from "@supabase/supabase-js";

import { env } from "./env.mjs";
import {
  getLiderancaPorSlug,
  primeiroNome,
  registrarApoiador,
} from "../lib/pessoas/publico.ts";
import { permitirCadastroPara, LIMITE } from "../lib/rate-limit-core.ts";
import { normalizarTelefone } from "../lib/pessoas/telefone.ts";

process.env.NEXT_PUBLIC_SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
process.env.SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let falhas = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const falha = (m) => {
  falhas += 1;
  console.log(`  FALHA ${m}`);
};

const SLUG_A = "zz-teste-maria";
const SLUG_B = "zz-teste-joao";
const TELS = ["5522988770001", "5522988770002", "5522988770010", "5522988770011"];
const IP_TESTE = "zz-teste-ip";

async function limpar() {
  await svc.from("conflitos_cadastro").delete().in("telefone", TELS);
  await svc.from("pessoas").delete().in("telefone", TELS);
  await svc.from("pessoas").delete().in("slug", [SLUG_A, SLUG_B]);
  await svc.from("tentativas_cadastro").delete().eq("ip_hash", IP_TESTE);
}

await limpar();

// ── cenário ────────────────────────────────────────────────────────────────
const { data: local } = await svc
  .from("locais_votacao")
  .select("id, bairro_id")
  .order("eleitores", { ascending: false })
  .limit(1)
  .single();

const liderancas = {};
for (const [slug, nome, tel] of [
  [SLUG_A, "Maria do Carmo Ferreira", TELS[0]],
  [SLUG_B, "João Batista Alves", TELS[1]],
]) {
  const { data, error } = await svc
    .from("pessoas")
    .insert({
      nome,
      telefone: tel,
      nivel: "lideranca",
      slug,
      local_votacao_id: local.id,
      bairro_moradia_id: local.bairro_id,
      origem: "admin",
      ativo: true,
    })
    .select("id, nome")
    .single();
  if (error) {
    console.error("não deu para preparar o cenário:", error.message);
    process.exit(1);
  }
  liderancas[slug] = data;
}

// ── leitura pública ────────────────────────────────────────────────────────
console.log("\nLeitura da liderança pelo slug\n");

const maria = await getLiderancaPorSlug(SLUG_A);
maria?.nome === "Maria do Carmo Ferreira"
  ? ok("slug existente devolve a liderança")
  : falha("slug existente não devolveu a liderança");

(await getLiderancaPorSlug("nao-existe-mesmo")) === null
  ? ok("slug inexistente devolve nulo, e a página vira 404")
  : falha("slug inexistente devolveu algo");

await svc.from("pessoas").update({ ativo: false }).eq("slug", SLUG_B);
(await getLiderancaPorSlug(SLUG_B)) === null
  ? ok("liderança inativa devolve nulo")
  : falha("liderança inativa continuou publicando link");
await svc.from("pessoas").update({ ativo: true }).eq("slug", SLUG_B);

// ── primeiro cadastro ──────────────────────────────────────────────────────
console.log("\nPrimeiro cadastro pelo link da Maria\n");

const tel = normalizarTelefone("(22) 98877-0010");
tel.ok ? ok("telefone normalizado da máscara") : falha("normalização falhou");

const r1 = await registrarApoiador({
  liderancaId: liderancas[SLUG_A].id,
  nome: "Ana Paula Souza",
  telefone: tel.telefone,
  bairroId: local.bairro_id,
  localId: local.id,
  foraDoMunicipio: false,
});

r1.situacao === "criado" ? ok("apoiador criado") : falha(`esperava criado, veio ${r1.situacao}`);

const { data: ana } = await svc
  .from("pessoas")
  .select("id, nome, nivel, origem, indicado_por, local_votacao_id, fora_do_municipio")
  .eq("telefone", tel.telefone)
  .single();

ana.indicado_por === liderancas[SLUG_A].id
  ? ok("atribuído à Maria — é a razão de o sistema existir")
  : falha("atribuição errada");
ana.nivel === "apoiador" && ana.origem === "link"
  ? ok("nivel apoiador, origem link")
  : falha(`nivel/origem errados: ${ana.nivel}/${ana.origem}`);
ana.local_votacao_id === local.id
  ? ok("colégio de votação gravado")
  : falha("colégio não gravado");

// ── duplicidade ────────────────────────────────────────────────────────────
console.log("\nMesmo telefone, agora pelo link do João\n");

const r2 = await registrarApoiador({
  liderancaId: liderancas[SLUG_B].id,
  nome: "Ana P. Souza",
  telefone: tel.telefone,
  bairroId: local.bairro_id,
  localId: local.id,
  foraDoMunicipio: false,
});

r2.situacao === "ja_estava"
  ? ok("resposta é 'já estava', não erro — quem preencheu não tem culpa")
  : falha(`esperava ja_estava, veio ${r2.situacao}`);

const { count: quantasAna } = await svc
  .from("pessoas")
  .select("id", { count: "exact", head: true })
  .eq("telefone", tel.telefone);
quantasAna === 1 ? ok("nenhum registro novo foi criado") : falha(`${quantasAna} registros com o mesmo telefone`);

const { data: anaDepois } = await svc
  .from("pessoas")
  .select("indicado_por")
  .eq("telefone", tel.telefone)
  .single();
anaDepois.indicado_por === liderancas[SLUG_A].id
  ? ok("atribuição da Maria intacta — o primeiro cadastro prevalece")
  : falha("a atribuição foi roubada pelo segundo cadastro");

const { data: conflitos } = await svc
  .from("conflitos_cadastro")
  .select("telefone, nome_tentado, lideranca_tentou_id, pessoa_existente_id, resolvido")
  .eq("telefone", tel.telefone);

if (conflitos.length !== 1) {
  falha(`esperava 1 conflito na fila, achei ${conflitos.length}`);
} else {
  const c = conflitos[0];
  c.lideranca_tentou_id === liderancas[SLUG_B].id && c.pessoa_existente_id === ana.id
    ? ok("conflito registrado com quem tentou e quem já tinha")
    : falha("conflito gravado com vínculos errados");
  c.resolvido === false ? ok("conflito entra na fila como aberto") : falha("conflito nasceu resolvido");
}

// ── fora do município ──────────────────────────────────────────────────────
console.log("\nApoiador de outro município\n");

const r3 = await registrarApoiador({
  liderancaId: liderancas[SLUG_A].id,
  nome: "Carlos Eduardo Lima",
  telefone: TELS[3],
  bairroId: null,
  localId: null,
  foraDoMunicipio: true,
});

r3.situacao === "criado" ? ok("criado") : falha(`esperava criado, veio ${r3.situacao}`);

const { data: carlos } = await svc
  .from("pessoas")
  .select("fora_do_municipio, local_votacao_id, indicado_por")
  .eq("telefone", TELS[3])
  .single();

carlos.fora_do_municipio === true && carlos.local_votacao_id === null
  ? ok("marcado como fora do município, sem colégio daqui")
  : falha("fora do município gravado errado");
carlos.indicado_por === liderancas[SLUG_A].id
  ? ok("entra no crédito da liderança, mas fica fora do cálculo territorial")
  : falha("perdeu a atribuição");

// ── rate limit ─────────────────────────────────────────────────────────────
console.log("\nRate limit por IP\n");

let liberadas = 0;
for (let i = 0; i < LIMITE + 3; i += 1) {
  if (await permitirCadastroPara(IP_TESTE)) liberadas += 1;
}
liberadas === LIMITE
  ? ok(`liberou ${LIMITE} e barrou a partir daí`)
  : falha(`liberou ${liberadas}, esperava ${LIMITE}`);

(await permitirCadastroPara("zz-outro-ip-qualquer"))
  ? ok("outro IP não é afetado pelo limite do primeiro")
  : falha("o limite vazou entre IPs");
await svc.from("tentativas_cadastro").delete().eq("ip_hash", "zz-outro-ip-qualquer");

const { data: linhas } = await svc
  .from("tentativas_cadastro")
  .select("ip_hash")
  .eq("ip_hash", IP_TESTE)
  .limit(1);
linhas.length > 0 && !linhas[0].ip_hash.includes(".")
  ? ok("a tabela guarda o hash, nunca o IP")
  : falha("IP em claro na tabela");

// ── agradecimento ──────────────────────────────────────────────────────────
console.log("\nPrimeiro nome no agradecimento\n");
primeiroNome("ANA PAULA SOUZA") === "Ana" ? ok('"ANA PAULA SOUZA" vira "Ana"') : falha("primeiro nome errado");
primeiroNome("  maria  ") === "Maria" ? ok("espaço e caixa tratados") : falha("primeiro nome errado");

await limpar();
const { count: sobrou } = await svc.from("pessoas").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${sobrou} pessoa(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
