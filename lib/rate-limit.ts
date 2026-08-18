import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { createServerClient } from "@/lib/supabase/server";

/**
 * Rate limit do cadastro público (RNF-17).
 *
 * O IP nunca é gravado em claro. Vai para o banco como HMAC-SHA256, porque
 * endereço de IP é dado pessoal e esta base inteira é de dado sensível — se um
 * dia alguém puxar a tabela, não há de onde reconstruir quem acessou.
 *
 * A chave do HMAC é RATE_LIMIT_SALT quando existir; na falta dela, a service
 * role, que já é server-only e está sempre presente. Nos dois casos o segredo
 * nunca sai do servidor.
 *
 * A contagem é feita aqui, e não numa função SQL: duas requisições simultâneas
 * do mesmo IP poderiam passar juntas, e isso não muda nada — o objetivo é
 * conter flood, não contar com exatidão transacional.
 */

/**
 * Limite generoso de propósito. Quem precisa passar é a liderança cadastrando
 * dez pessoas seguidas no próprio celular, numa caminhada — o comportamento
 * que o sistema mais quer. Quem precisa parar é script, e script não preenche
 * quatro campos em vinte segundos.
 */
const LIMITE = 30;
const JANELA_MINUTOS = 15;
const RETENCAO_HORAS = 2;

function chaveHmac(): string {
  return (
    process.env.RATE_LIMIT_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "projeto-rede-sem-salt"
  );
}

export async function ipHash(): Promise<string> {
  const cabecalhos = await headers();

  // Na Vercel o IP real chega em x-forwarded-for; o primeiro da lista é o
  // cliente, os demais são proxies.
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip")?.trim() ||
    "desconhecido";

  return createHmac("sha256", chaveHmac()).update(ip).digest("hex");
}

export async function permitirCadastro(): Promise<boolean> {
  const supabase = createServerClient();
  const hash = await ipHash();
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60_000).toISOString();

  const { count, error } = await supabase
    .from("tentativas_cadastro")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gt("criado_em", desde);

  // Falha de infraestrutura não pode derrubar captação: o custo de deixar
  // passar é um cadastro a mais, o de barrar é um apoiador perdido.
  if (error) return true;

  if ((count ?? 0) >= LIMITE) return false;

  await supabase.from("tentativas_cadastro").insert({ ip_hash: hash });

  // Faxina oportunista, para a tabela nunca crescer sem limite. Uma vez a cada
  // vinte cadastros é suficiente e não pesa no caminho crítico.
  if (Math.random() < 0.05) {
    const limite = new Date(Date.now() - RETENCAO_HORAS * 3_600_000).toISOString();
    await supabase.from("tentativas_cadastro").delete().lt("criado_em", limite);
  }

  return true;
}
