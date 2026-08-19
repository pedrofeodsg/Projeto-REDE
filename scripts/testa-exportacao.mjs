/**
 * Prova a invariante 8 contra o banco real.
 *
 *   node --conditions=react-server scripts/testa-exportacao.mjs
 *
 * Monta os relatórios com dados de verdade — inclusive apoiadores com telefone
 * na base — e varre o payload atrás de qualquer coisa que pareça contato. É o
 * teste que o guia pede: falhar se algum campo de contato vazar no perfil
 * candidato.
 *
 * Cria dados de teste e apaga tudo no fim.
 */
import { createClient } from "@supabase/supabase-js";

import { env } from "./env.mjs";
import { montarRelatorio } from "../lib/exportacao/montar.ts";
import { scanearVazamento } from "../lib/exportacao/perfis.ts";

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

const PREFIXO = "55229500";
const TEL_APOIADOR = `${PREFIXO}00099`;
let seq = 0;
const tel = () => `${PREFIXO}${String(seq++).padStart(5, "0")}`;

async function limpar() {
  const { data } = await svc.from("pessoas").select("id").like("telefone", `${PREFIXO}%`);
  const ids = (data ?? []).map((p) => p.id);
  if (ids.length > 0) {
    await svc.from("pessoas").delete().in("indicado_por", ids);
    await svc.from("pessoas").delete().in("id", ids);
  }
  await svc.from("exportacoes").delete().like("rotulo", "zz-teste%");
}

await limpar();

// ── cenário com dados reais ────────────────────────────────────────────────
const { data: local } = await svc
  .from("locais_votacao")
  .select("id, bairro_id")
  .order("eleitores", { ascending: false })
  .limit(1)
  .single();

const { data: lider } = await svc
  .from("pessoas")
  .insert({
    nome: "Liderança Exportação",
    telefone: tel(),
    nivel: "lideranca",
    slug: `zz-exp-${seq}`,
    local_votacao_id: local.id,
    bairro_moradia_id: local.bairro_id,
    origem: "admin",
    ativo: true,
  })
  .select("id, nome, telefone")
  .single();

// Apoiador com nome e telefone reconhecíveis: se qualquer um dos dois aparecer
// no relatório do candidato, o teste tem que quebrar.
const NOME_APOIADOR = "Apoiador Secreto Da Silva";
await svc.from("pessoas").insert({
  nome: NOME_APOIADOR,
  telefone: TEL_APOIADOR,
  nivel: "apoiador",
  origem: "link",
  indicado_por: lider.id,
  local_votacao_id: local.id,
});

console.log("\nPerfil candidato · o que sai da organização\n");

const candidato = await montarRelatorio(svc, "candidato");
const bruto = JSON.stringify(candidato);

const achados = scanearVazamento(candidato);
achados.length === 0
  ? ok("o scanner não achou nenhum campo de contato")
  : falha(`vazou: ${achados.map((a) => `${a.caminho} (${a.motivo})`).join(", ")}`);

!bruto.includes(TEL_APOIADOR)
  ? ok("o telefone do apoiador não está no payload")
  : falha("O TELEFONE DO APOIADOR VAZOU");

!bruto.includes(lider.telefone)
  ? ok("o telefone da liderança não está no payload")
  : falha("O TELEFONE DA LIDERANÇA VAZOU");

!bruto.includes(NOME_APOIADOR)
  ? ok("o nome do apoiador não está no payload")
  : falha("O NOME DO APOIADOR VAZOU");

bruto.includes(lider.nome)
  ? ok("mas a liderança aparece nominalmente, como o perfil manda")
  : falha("a liderança sumiu do relatório");

const camposDaLideranca = Object.keys(candidato.liderancas[0] ?? {}).sort();
camposDaLideranca.length > 0 &&
JSON.stringify(camposDaLideranca) === JSON.stringify(["bairro", "cadastros", "nome", "regiao"])
  ? ok("cada liderança traz exatamente quatro campos")
  : falha(`campos inesperados: ${camposDaLideranca.join(", ")}`);

candidato.colegios.length <= 15
  ? ok(`${candidato.colegios.length} colégios, os maiores primeiro`)
  : falha(`vieram ${candidato.colegios.length} colégios`);

candidato.numeros.eleitorado === 75083
  ? ok("o denominador é o eleitorado real do município")
  : falha(`eleitorado veio ${candidato.numeros.eleitorado}`);

candidato.extraidoEm
  ? ok("carrega a data e hora de extração")
  : falha("sem carimbo de extração");

console.log("\nPerfil público · nem nome tem\n");

const publico = await montarRelatorio(svc, "publico");
const brutoPublico = JSON.stringify(publico);

scanearVazamento(publico).length === 0
  ? ok("sem campo de contato")
  : falha("vazou contato no perfil público");

!brutoPublico.includes(lider.nome) && !brutoPublico.includes(NOME_APOIADOR)
  ? ok("nenhum nome próprio no payload")
  : falha("nome próprio no perfil público");

!("liderancas" in publico)
  ? ok("não existe lista de lideranças")
  : falha("o público trouxe lista de lideranças");

console.log("\nPerfil interno · é o único que carrega contato\n");

const interno = await montarRelatorio(svc, "interno");
JSON.stringify(interno).includes(lider.telefone)
  ? ok("tem o telefone da liderança, como deve ter")
  : falha("o interno perdeu o contato");

scanearVazamento(interno).length > 0
  ? ok("e o scanner o reprovaria se alguém tentasse compartilhá-lo")
  : falha("o scanner não vê o contato do interno");

console.log("\nLink revogável\n");

const token = "zz" + Buffer.from(crypto.randomUUID()).toString("base64url");
const { data: linkGerado, error: erroLink } = await svc
  .from("exportacoes")
  .insert({ perfil: "candidato", token, rotulo: "zz-teste link" })
  .select("id, revogado, visitas")
  .single();

erroLink ? falha(`não deu para gerar: ${erroLink.message}`) : ok("link gerado");
linkGerado.revogado === false ? ok("nasce ativo") : falha("nasceu revogado");
linkGerado.visitas === 0 ? ok("com zero aberturas") : falha("nasceu com visita");

const { data: encontrado } = await svc
  .from("exportacoes")
  .select("perfil, revogado")
  .eq("token", token)
  .maybeSingle();
encontrado?.perfil === "candidato"
  ? ok("o token resolve para o perfil certo")
  : falha("o token não resolveu");

await svc.from("exportacoes").update({ revogado: true }).eq("id", linkGerado.id);
const { data: depoisDeRevogar } = await svc
  .from("exportacoes")
  .select("revogado")
  .eq("token", token)
  .single();

depoisDeRevogar.revogado === true
  ? ok("revogar desliga o link — a rota devolve 404 a partir daí")
  : falha("a revogação não pegou");

const { data: inexistente } = await svc
  .from("exportacoes")
  .select("id")
  .eq("token", "token-que-nunca-existiu")
  .maybeSingle();
inexistente === null ? ok("token inventado não resolve para nada") : falha("token inventado resolveu");

await limpar();
const { count } = await svc.from("pessoas").select("id", { count: "exact", head: true });
console.log(`\n  limpeza feita, ${count} pessoa(s) na base`);

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exitCode = falhas === 0 ? 0 : 1;
