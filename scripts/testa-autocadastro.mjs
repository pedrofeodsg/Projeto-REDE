/**
 * Prova o autocadastro de liderança e a separação voto/trabalho.
 *
 *   npm run testa:autocadastro
 *
 * Exercita registrarLideranca() de verdade — a mesma função que a página
 * /sou-lideranca usa. Cria dados de teste e apaga tudo no fim.
 */
import { createClient } from "@supabase/supabase-js";

import { env } from "./env.mjs";
import { registrarLideranca } from "../lib/pessoas/publico.ts";
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

const PREFIXO = "55229600";
let seq = 0;
const tel = () => `${PREFIXO}${String(seq++).padStart(5, "0")}`;

async function limpar() {
  const { data } = await svc.from("pessoas").select("id").like("telefone", `${PREFIXO}%`);
  const ids = (data ?? []).map((p) => p.id);
  if (ids.length === 0) return;
  await svc.from("pessoas").delete().in("indicado_por", ids);
  await svc.from("pessoas").delete().in("id", ids);
}

await limpar();

// Dois bairros diferentes: um onde a pessoa mora, outro onde vota.
const { data: bairros } = await svc
  .from("bairros")
  .select("id, nome, eleitores")
  .order("eleitores", { ascending: false })
  .limit(2);

const [bairroGrande, bairroSegundo] = bairros;

const { data: localDeOutroBairro } = await svc
  .from("locais_votacao")
  .select("id, nome, bairro_id")
  .eq("bairro_id", bairroSegundo.id)
  .limit(1)
  .single();

console.log("\nAutocadastro · quem não estava na base\n");

const telNova = tel();
const r1 = await registrarLideranca({
  nome: "Nova Liderança Teste",
  apelido: "Dona Nova",
  telefone: telNova,
  instagramHandle: "zzteste.nova",
  // Mora num bairro, vota em outro. É o caso do Pedro.
  bairroId: bairroGrande.id,
  localId: localDeOutroBairro.id,
  foraDoMunicipio: false,
  slugSugerido: `zz-auto-${seq}`,
});

r1.situacao === "criada" ? ok("entrou na base") : falha(`veio ${r1.situacao}`);

const { data: nova } = await svc
  .from("pessoas")
  .select("nivel, ativo, apelido, slug, origem, bairro_moradia_id, local_votacao_id")
  .eq("telefone", telNova)
  .single();

nova.nivel === "lideranca" ? ok("nasce como liderança") : falha(`nivel ${nova.nivel}`);
nova.ativo === false
  ? ok("mas INATIVA — a coordenação ainda decide")
  : falha("nasceu ativa, sem aval de ninguém");
nova.apelido === "Dona Nova" ? ok("apelido gravado") : falha("apelido perdido");
nova.slug ? ok("já tem endereço reservado para quando for ativada") : falha("sem slug");
nova.origem === "link" ? ok("origem marcada como link") : falha(`origem ${nova.origem}`);

nova.bairro_moradia_id === bairroGrande.id && nova.local_votacao_id === localDeOutroBairro.id
  ? ok("mora num bairro e vota em outro, sem o sistema reclamar")
  : falha("território gravado errado");

console.log("\nA página dela só abre depois do aval\n");

const { data: aindaNao } = await svc
  .from("pessoas")
  .select("id")
  .eq("slug", nova.slug)
  .eq("nivel", "lideranca")
  .eq("ativo", true)
  .maybeSingle();

aindaNao === null
  ? ok("o convite dela devolve 404 enquanto estiver inativa")
  : falha("a página abriu sem aprovação");

console.log("\nO território separa voto de trabalho\n");

const { data: penetracaoMoradia } = await svc
  .from("v_penetracao_bairro")
  .select("nome, liderancas")
  .eq("id", bairroGrande.id)
  .single();

// Inativa não conta em lugar nenhum ainda.
penetracaoMoradia.liderancas === 0
  ? ok("liderança inativa não conta como cobertura de bairro")
  : falha(`contou ${penetracaoMoradia.liderancas} sem estar ativa`);

await svc.from("pessoas").update({ ativo: true }).eq("telefone", telNova);

const [{ data: moradia }, { data: voto }] = await Promise.all([
  svc.from("v_penetracao_bairro").select("nome, liderancas").eq("id", bairroGrande.id).single(),
  svc.from("v_penetracao_bairro").select("nome, liderancas").eq("id", bairroSegundo.id).single(),
]);

moradia.liderancas === 1
  ? ok(`ativada, ela cobre ${moradia.nome} — onde MORA`)
  : falha(`bairro de moradia contou ${moradia.liderancas}`);

voto.liderancas === 0
  ? ok(`e NÃO cobre ${voto.nome}, onde só vota`)
  : falha(`o bairro onde ela vota contou ${voto.liderancas} como cobertura`);

const { data: colegio } = await svc
  .from("v_penetracao_local")
  .select("liderancas_votam, liderancas_no_bairro")
  .eq("id", localDeOutroBairro.id)
  .single();

colegio.liderancas_votam === 1
  ? ok("no colégio, ela aparece como quem vota ali")
  : falha(`liderancas_votam veio ${colegio.liderancas_votam}`);

console.log("\nApoiador que se cadastra como liderança\n");

const { data: lider } = await svc
  .from("pessoas")
  .insert({
    nome: "Quem Trouxe", telefone: tel(), nivel: "lideranca",
    slug: `zz-auto-trouxe-${seq}`, origem: "admin", ativo: true,
  })
  .select("id").single();

const telApoiador = tel();
await svc.from("pessoas").insert({
  nome: "Era Apoiador", telefone: telApoiador,
  nivel: "apoiador", origem: "link", indicado_por: lider.id,
});

const r2 = await registrarLideranca({
  nome: "Era Apoiador Silva",
  apelido: null,
  telefone: telApoiador,
  instagramHandle: null,
  bairroId: bairroGrande.id,
  localId: localDeOutroBairro.id,
  foraDoMunicipio: false,
  slugSugerido: `zz-auto-promovido-${seq}`,
});

r2.situacao === "atualizada" ? ok("não cria registro novo") : falha(`veio ${r2.situacao}`);

const { data: promovido } = await svc
  .from("pessoas")
  .select("nivel, ativo, indicado_por, nome")
  .eq("telefone", telApoiador)
  .single();

promovido.nivel === "lideranca" ? ok("virou liderança") : falha(`nivel ${promovido.nivel}`);
promovido.ativo === false ? ok("aguardando aval") : falha("ativada sozinha");
promovido.indicado_por === lider.id
  ? ok("e quem a trouxe CONTINUA com o crédito por ela")
  : falha("a promoção apagou quem trouxe");
promovido.nome === "Era Apoiador Silva"
  ? ok("o nome dela foi corrigido pelo que ela mesma escreveu")
  : falha("o nome não foi atualizado");

const { count: quantos } = await svc
  .from("pessoas")
  .select("id", { count: "exact", head: true })
  .eq("telefone", telApoiador);
quantos === 1 ? ok("um registro só, sem duplicata") : falha(`${quantos} registros`);

console.log("\nLiderança já ativa corrigindo os próprios dados\n");

const r3 = await registrarLideranca({
  nome: "Nova Liderança Teste",
  apelido: "Cota",
  telefone: telNova,
  instagramHandle: "zzteste.corrigido",
  bairroId: bairroSegundo.id,
  localId: localDeOutroBairro.id,
  foraDoMunicipio: false,
  slugSugerido: "zz-nao-deve-usar",
});

r3.situacao === "atualizada" ? ok("atualiza em vez de criar") : falha(`veio ${r3.situacao}`);

const { data: corrigida } = await svc
  .from("pessoas")
  .select("apelido, instagram_handle, ativo, slug")
  .eq("telefone", telNova)
  .single();

corrigida.apelido === "Cota" && corrigida.instagram_handle === "zzteste.corrigido"
  ? ok("os dados novos entraram")
  : falha("a correção não gravou");
corrigida.ativo === true
  ? ok("quem já estava ativa CONTINUA ativa")
  : falha("a correção desativou a liderança");
corrigida.slug === nova.slug
  ? ok("e o link dela não muda — já pode estar circulando")
  : falha(`o slug mudou de ${nova.slug} para ${corrigida.slug}`);

const telFora = tel();
console.log("\nQuem mora fora do município\n");

const r4 = await registrarLideranca({
  nome: "Mora Em Cabo Frio",
  apelido: null,
  telefone: telFora,
  instagramHandle: null,
  bairroId: null,
  localId: null,
  foraDoMunicipio: true,
  slugSugerido: `zz-auto-fora-${seq}`,
});

r4.situacao === "criada" ? ok("é aceita") : falha(`veio ${r4.situacao}`);

const { data: deFora } = await svc
  .from("pessoas")
  .select("fora_do_municipio, local_votacao_id")
  .eq("telefone", telFora)
  .single();

deFora.fora_do_municipio === true && deFora.local_votacao_id === null
  ? ok("sem colégio daqui, e fora do cálculo territorial")
  : falha("gravou errado");

await limpar();
const { count } = await svc.from("pessoas").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${count} pessoa(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
