import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { permitirCadastroPara } from "./rate-limit-core.ts";

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

export async function permitirCadastro(): Promise<boolean> {
  return permitirCadastroPara(await ipHash());
}
