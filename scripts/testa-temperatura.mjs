/**
 * Prova o motor de temperatura contra o banco real.
 *
 *   npm run testa:temperatura
 *
 * Monta cenários com datas no passado e confere o estado que a view devolve.
 * É o teste mais importante do Bloco 3C: o estado decide quem aparece na fila
 * de cobrança de manhã, e um erro aqui só apareceria em outubro.
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

const PREFIXO_TEL = "55229100";
const diasAtras = (d) => new Date(Date.now() - d * 86_400_000).toISOString();

let sequencia = 0;
const proximoTelefone = () =>
  `${PREFIXO_TEL}${String(sequencia++).padStart(5, "0")}`;

async function limpar() {
  const { data } = await svc
    .from("pessoas")
    .select("id")
    .like("telefone", `${PREFIXO_TEL}%`);

  const ids = (data ?? []).map((p) => p.id);
  if (ids.length > 0) {
    await svc.from("envios").delete().in("pessoa_id", ids);
    await svc.from("pessoas").delete().in("indicado_por", ids);
    await svc.from("pessoas").delete().in("id", ids);
  }
}

await limpar();

const { data: local } = await svc
  .from("locais_votacao")
  .select("id, bairro_id")
  .limit(1)
  .single();

/**
 * Monta uma liderança com o histórico pedido.
 *
 * `envioDiasAtras` nulo significa liderança cadastrada e link nunca enviado.
 * `cadastros` é uma lista de "há quantos dias" cada apoiador entrou.
 */
async function cenario(nome, { envioDiasAtras, cadastros = [] }) {
  const { data: lider, error } = await svc
    .from("pessoas")
    .insert({
      nome,
      telefone: proximoTelefone(),
      nivel: "lideranca",
      slug: `zz-temp-${sequencia}`,
      local_votacao_id: local.id,
      bairro_moradia_id: local.bairro_id,
      meta: 10,
      origem: "admin",
      ativo: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`${nome}: ${error.message}`);

  if (envioDiasAtras !== null) {
    await svc.from("envios").insert({
      pessoa_id: lider.id,
      enviado_em: diasAtras(envioDiasAtras),
      confirmado: true,
    });
  }

  for (const dias of cadastros) {
    await svc.from("pessoas").insert({
      nome: `Apoiador ${proximoTelefone()}`,
      telefone: proximoTelefone(),
      nivel: "apoiador",
      origem: "link",
      indicado_por: lider.id,
      local_votacao_id: local.id,
      criado_em: diasAtras(dias),
    });
  }

  return lider.id;
}

async function estadoDe(id) {
  const { data, error } = await svc
    .from("v_liderancas")
    .select("estado, cadastros, dias_parada, faltam, enviado_em")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function conferir(rotulo, config, esperado) {
  const id = await cenario(rotulo, config);
  const v = await estadoDe(id);
  v.estado === esperado
    ? ok(`${rotulo} → ${esperado}`)
    : falha(`${rotulo} → veio "${v.estado}", esperava "${esperado}" (cadastros ${v.cadastros}, parada ${v.dias_parada})`);
  return { id, ...v };
}

console.log("\nOs seis estados\n");

await conferir("Link nunca enviado", { envioDiasAtras: null }, "aguardando");

await conferir(
  "Link há 2 dias, ninguém ainda",
  { envioDiasAtras: 2 },
  "aguardando",
);

await conferir(
  "Link há 9 dias, ninguém ainda",
  { envioDiasAtras: 9 },
  "afastado",
);

await conferir(
  "3 cadastros recentes",
  { envioDiasAtras: 20, cadastros: [1, 3, 5] },
  "frio",
);

await conferir(
  "6 cadastros recentes",
  { envioDiasAtras: 20, cadastros: [1, 2, 3, 4, 5, 6] },
  "quente",
);

await conferir(
  "12 cadastros recentes",
  { envioDiasAtras: 30, cadastros: Array.from({ length: 12 }, (_, i) => i % 9) },
  "muito_quente",
);

await conferir(
  "22 cadastros em 4 semanas distintas",
  {
    envioDiasAtras: 40,
    cadastros: [
      ...Array.from({ length: 6 }, () => 2),
      ...Array.from({ length: 6 }, () => 9),
      ...Array.from({ length: 5 }, () => 16),
      ...Array.from({ length: 5 }, () => 23),
    ],
  },
  "engajado",
);

console.log("\nA regra que é fácil de errar: recência antes de volume\n");

await conferir(
  "12 cadastros, todos há 25 dias",
  { envioDiasAtras: 40, cadastros: Array.from({ length: 12 }, () => 25) },
  "frio",
);

await conferir(
  "25 cadastros num sábado só, há 20 dias",
  { envioDiasAtras: 40, cadastros: Array.from({ length: 25 }, () => 20) },
  "frio",
);

await conferir(
  "25 cadastros no mesmo dia, ontem",
  { envioDiasAtras: 40, cadastros: Array.from({ length: 25 }, () => 1) },
  "muito_quente",
);

console.log("\nO envio é o marco zero, não o cadastro no admin\n");

const recemAtivada = await conferir(
  "Cadastrada há semanas, link enviado ontem",
  { envioDiasAtras: 1 },
  "aguardando",
);
recemAtivada.dias_parada <= 1
  ? ok("dias parada conta desde o envio, não desde o cadastro")
  : falha(`dias parada veio ${recemAtivada.dias_parada}`);

console.log("\nEnvio desmarcado volta a contar como nunca enviado\n");

const idDesmarcar = await cenario("Envio que não virou mensagem", {
  envioDiasAtras: 9,
});
const antes = await estadoDe(idDesmarcar);
antes.estado === "afastado" ? ok("antes de desmarcar: afastado") : falha(`veio ${antes.estado}`);

await svc.from("envios").update({ confirmado: false }).eq("pessoa_id", idDesmarcar);
const depois = await estadoDe(idDesmarcar);
depois.estado === "aguardando" && depois.enviado_em === null
  ? ok('"marcar como não enviado" tira a liderança da fila de cobrança')
  : falha(`depois de desmarcar veio ${depois.estado}`);

console.log("\nProgresso contra a meta\n");

const comMeta = await conferir(
  "Meta 10, trouxe 6",
  { envioDiasAtras: 10, cadastros: [1, 2, 3, 4, 5, 6] },
  "quente",
);
comMeta.faltam === 4 ? ok("faltam 4 para a meta") : falha(`faltam veio ${comMeta.faltam}`);

await limpar();
const { count } = await svc.from("pessoas").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${count} pessoa(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
