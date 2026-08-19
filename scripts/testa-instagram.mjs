/**
 * Prova o módulo digital contra o banco real.
 *
 *   npm run testa:instagram
 *
 * As duas invariantes do bloco: o roster congela na data do post, e o
 * handle_cru nunca é sobrescrito. Ambas só falhariam meses depois, quando
 * ninguém mais lembra do que mudou.
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

const PREFIXO = "55229400";
const MARCA = "zz-teste-ig";
let seq = 0;
const tel = () => `${PREFIXO}${String(seq++).padStart(5, "0")}`;
const diasAtras = (d) => new Date(Date.now() - d * 86_400_000).toISOString();

async function limpar() {
  const { data: posts } = await svc.from("posts").select("id").like("url", `%${MARCA}%`);
  const idsPosts = (posts ?? []).map((p) => p.id);
  if (idsPosts.length > 0) {
    await svc.from("engajamentos").delete().in("post_id", idsPosts);
    await svc.from("post_roster").delete().in("post_id", idsPosts);
    await svc.from("posts").delete().in("id", idsPosts);
  }
  const { data: pessoas } = await svc.from("pessoas").select("id").like("telefone", `${PREFIXO}%`);
  const ids = (pessoas ?? []).map((p) => p.id);
  if (ids.length > 0) await svc.from("pessoas").delete().in("id", ids);
  await svc.from("recrutamento").delete().like("handle", "%zzteste%");
}

await limpar();

async function criarLideranca(nome, handle) {
  const { data, error } = await svc
    .from("pessoas")
    .insert({
      nome,
      telefone: tel(),
      nivel: "lideranca",
      slug: `${MARCA}-${seq}`,
      instagram_handle: handle,
      origem: "admin",
      ativo: true,
    })
    .select("id, nome")
    .single();
  if (error) throw new Error(`${nome}: ${error.message}`);
  return data;
}

async function criarPost(diasNoPassado) {
  const { data, error } = await svc
    .from("posts")
    .insert({
      url: `https://instagram.com/p/${MARCA}-${seq++}`,
      publicado_em: diasAtras(diasNoPassado),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function comentar(postId, pessoaId, handleCru) {
  const { error } = await svc.from("engajamentos").insert({
    post_id: postId,
    handle_cru: handleCru,
    pessoa_id: pessoaId,
    tipo: "comentario",
  });
  if (error) throw new Error(error.message);
}

// ── roster congelado ───────────────────────────────────────────────────────
console.log("\nRoster congelado (RF-36)\n");

const antiga = await criarLideranca("Liderança Antiga", "zzteste.antiga");
const post1 = await criarPost(30);

const { count: rosterInicial } = await svc
  .from("post_roster")
  .select("pessoa_id", { count: "exact", head: true })
  .eq("post_id", post1.id);

rosterInicial > 0
  ? ok(`o roster congelou sozinho no cadastro do post (${rosterInicial} lideranças)`)
  : falha("o roster ficou vazio");

const { data: estaNoRoster } = await svc
  .from("post_roster")
  .select("pessoa_id")
  .eq("post_id", post1.id)
  .eq("pessoa_id", antiga.id)
  .maybeSingle();

estaNoRoster ? ok("quem já era liderança entrou no roster") : falha("liderança ativa ficou de fora");

// Nova liderança, cadastrada DEPOIS do post.
const nova = await criarLideranca("Liderança Nova", "zzteste.nova");

const { data: novaNoRoster } = await svc
  .from("post_roster")
  .select("pessoa_id")
  .eq("post_id", post1.id)
  .eq("pessoa_id", nova.id)
  .maybeSingle();

novaNoRoster === null
  ? ok("quem entrou depois NÃO aparece em post anterior — nada é recalculado")
  : falha("o roster foi recalculado e incluiu quem entrou depois");

// ── handle_cru intocável ───────────────────────────────────────────────────
console.log("\nhandle_cru nunca é sobrescrito (invariante 3)\n");

await comentar(post1.id, antiga.id, "@ZzTeste.Antiga");

const { data: engajamento } = await svc
  .from("engajamentos")
  .select("id, handle_cru, pessoa_id")
  .eq("post_id", post1.id)
  .single();

engajamento.handle_cru === "@ZzTeste.Antiga"
  ? ok("o handle foi gravado exatamente como veio, com maiúsculas e arroba")
  : falha(`gravou "${engajamento.handle_cru}"`);

const { error: erroSobrescrita } = await svc
  .from("engajamentos")
  .update({ handle_cru: "@outro" })
  .eq("id", engajamento.id);

erroSobrescrita
  ? ok(`o banco RECUSA a troca do handle_cru (${erroSobrescrita.message.slice(0, 48)}…)`)
  : falha("o handle_cru foi sobrescrito");

const { error: erroVinculo } = await svc
  .from("engajamentos")
  .update({ pessoa_id: nova.id })
  .eq("id", engajamento.id);

erroVinculo
  ? falha(`corrigir o vínculo deveria funcionar: ${erroVinculo.message}`)
  : ok("mas o vínculo com a pessoa se corrige à vontade");

await svc.from("engajamentos").update({ pessoa_id: antiga.id }).eq("id", engajamento.id);

// ── temperatura digital ────────────────────────────────────────────────────
console.log("\nTemperatura digital (RF-16)\n");

const posts = [post1];
for (let i = 0; i < 6; i += 1) posts.push(await criarPost(25 - i * 3));

// A liderança "antiga" comenta em 5 dos 6 últimos.
const ultimos6 = posts.slice(-6);
for (const p of ultimos6.slice(0, 5)) {
  await comentar(p.id, antiga.id, "@ZzTeste.Antiga");
}

const { data: digitalAtiva } = await svc
  .from("v_lideranca_digital")
  .select("janela, presencas, faltas, estado_digital")
  .eq("pessoa_id", antiga.id)
  .single();

digitalAtiva.estado_digital === "ativo"
  ? ok(`${digitalAtiva.presencas} de ${digitalAtiva.janela} → ativo`)
  : falha(`veio ${digitalAtiva.estado_digital} com ${digitalAtiva.presencas}/${digitalAtiva.janela}`);

// Uma terceira liderança que comenta em 2.
const irregular = await criarLideranca("Liderança Irregular", "zzteste.irregular");
const postsDela = [await criarPost(5), await criarPost(4), await criarPost(3)];
for (const p of postsDela.slice(0, 2)) {
  await comentar(p.id, irregular.id, "@zzteste.irregular");
}

const { data: digitalIrregular } = await svc
  .from("v_lideranca_digital")
  .select("janela, presencas, estado_digital")
  .eq("pessoa_id", irregular.id)
  .single();

digitalIrregular.estado_digital === "irregular"
  ? ok(`${digitalIrregular.presencas} de ${digitalIrregular.janela} → irregular`)
  : falha(`veio ${digitalIrregular.estado_digital} com ${digitalIrregular.presencas}/${digitalIrregular.janela}`);

// Quem nunca esteve em roster nenhum.
const recemChegada = await criarLideranca("Recém Chegada", "zzteste.recem");
const { data: semJanela } = await svc
  .from("v_lideranca_digital")
  .select("janela, estado_digital")
  .eq("pessoa_id", recemChegada.id)
  .single();

semJanela.janela === 0 && semJanela.estado_digital === null
  ? ok("quem entrou depois de todos os posts fica SEM JANELA, não ausente")
  : falha(`recém-chegada veio como ${semJanela.estado_digital} com janela ${semJanela.janela}`);

// Ausente de verdade: estava no roster e não comentou.
const { data: digitalNova } = await svc
  .from("v_lideranca_digital")
  .select("janela, presencas, faltas, estado_digital")
  .eq("pessoa_id", nova.id)
  .single();

digitalNova.estado_digital === "ausente" && digitalNova.faltas >= 5
  ? ok(`quem estava no roster e não comentou: ausente, ${digitalNova.faltas} faltas`)
  : falha(`veio ${digitalNova.estado_digital} com ${digitalNova.faltas} faltas`);

console.log("\nCurtida não conta como presença\n");

const soCurte = await criarLideranca("Só Curte", "zzteste.socurte");
const postsCurtida = [await criarPost(2), await criarPost(1)];
for (const p of postsCurtida) {
  await svc.from("engajamentos").insert({
    post_id: p.id, handle_cru: "@zzteste.socurte", pessoa_id: soCurte.id, tipo: "curtida",
  });
}

const { data: digitalCurtida } = await svc
  .from("v_lideranca_digital")
  .select("presencas, estado_digital")
  .eq("pessoa_id", soCurte.id)
  .single();

digitalCurtida.presencas === 0
  ? ok("duas curtidas e zero comentários contam como zero presenças")
  : falha(`curtida entrou no cálculo: ${digitalCurtida.presencas} presenças`);

// ── fila de recrutamento ───────────────────────────────────────────────────
console.log("\nFila de recrutamento (RF-38)\n");

await svc.from("engajamentos").insert([
  { post_id: post1.id, handle_cru: "@zzteste.desconhecido", tipo: "comentario" },
  { post_id: posts[1].id, handle_cru: "@zzteste.desconhecido", tipo: "comentario" },
  { post_id: posts[2].id, handle_cru: "@zzteste.raro", tipo: "comentario" },
]);

const { data: semVinculo } = await svc
  .from("v_handles_sem_vinculo")
  .select("handle_cru, engajamentos, posts")
  .in("handle_cru", ["@zzteste.desconhecido", "@zzteste.raro"]);

const desconhecido = semVinculo.find((h) => h.handle_cru === "@zzteste.desconhecido");
desconhecido?.engajamentos === 2 && desconhecido?.posts === 2
  ? ok("@ não casado entra na fila com a frequência de engajamento")
  : falha(`fila trouxe ${JSON.stringify(desconhecido)}`);

semVinculo[0].engajamentos >= semVinculo[semVinculo.length - 1].engajamentos
  ? ok("ordenado por frequência, do mais engajado para o menos")
  : falha("a ordenação não é por frequência");

console.log("\nDuplicidade na reimportação\n");

const { error: erroDuplicado } = await svc.from("engajamentos").insert({
  post_id: post1.id, handle_cru: "@zzteste.desconhecido", tipo: "comentario",
});

erroDuplicado
  ? ok("o mesmo @ não conta duas vezes a mesma ação no mesmo post")
  : falha("reimportar duplicou o engajamento");

await limpar();
const { count: sobrouPost } = await svc.from("posts").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${sobrouPost} post(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
