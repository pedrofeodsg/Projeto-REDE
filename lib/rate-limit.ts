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
 */

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

/**
 * Conta, decide e registra numa transação só, no banco — porque em serverless
 * cada requisição pode cair numa instância diferente, e contador em memória
 * não limita nada.
 */
export async function permitirCadastro(): Promise<boolean> {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc("registrar_tentativa_cadastro", {
    p_ip_hash: await ipHash(),
  });

  // Falha de infraestrutura não pode derrubar captação: o custo de deixar
  // passar é um cadastro a mais, o de barrar é um apoiador perdido.
  if (error) return true;

  return data !== false;
}
