import "server-only";

import { createServerClient } from "./supabase/server.ts";

/**
 * O miolo do rate limit, separado de quem lê o cabeçalho da requisição.
 *
 * Fica sem `next/headers` de propósito: assim a regra roda em teste, contra o
 * banco real, sem precisar simular uma requisição.
 *
 * Limite generoso de propósito. Quem precisa passar é a liderança cadastrando
 * dez pessoas seguidas no próprio celular, numa caminhada — o comportamento
 * que o sistema mais quer. Quem precisa parar é script, e script não preenche
 * quatro campos em vinte segundos.
 *
 * A contagem não é transacional: duas requisições simultâneas do mesmo IP
 * podem passar juntas, e isso não muda nada. O objetivo é conter flood, não
 * contar com exatidão.
 */
export const LIMITE = 30;
export const JANELA_MINUTOS = 15;
const RETENCAO_HORAS = 2;

export async function permitirCadastroPara(ipHash: string): Promise<boolean> {
  const supabase = createServerClient();
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60_000).toISOString();

  const { count, error } = await supabase
    .from("tentativas_cadastro")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gt("criado_em", desde);

  // Falha de infraestrutura não pode derrubar captação: o custo de deixar
  // passar é um cadastro a mais, o de barrar é um apoiador perdido.
  if (error) return true;

  if ((count ?? 0) >= LIMITE) return false;

  await supabase.from("tentativas_cadastro").insert({ ip_hash: ipHash });

  // Faxina oportunista, para a tabela nunca crescer sem limite.
  if (Math.random() < 0.05) {
    const limite = new Date(Date.now() - RETENCAO_HORAS * 3_600_000).toISOString();
    await supabase.from("tentativas_cadastro").delete().lt("criado_em", limite);
  }

  return true;
}
