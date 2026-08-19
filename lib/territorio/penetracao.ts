import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CoberturaRegiao,
  Database,
  PenetracaoBairro,
  PenetracaoLocal,
  RankingSemanal,
} from "@/types/database";

type Cliente = SupabaseClient<Database>;

/**
 * Penetração por bairro, ordenada CRESCENTE.
 *
 * A ordem não é preferência: a tela existe para mostrar onde falta, não onde
 * já está bom. Um bairro com 1 cadastro em 136 eleitores (0,7%) precisa
 * aparecer acima de um com 50 em 8.384 (0,6%) — volume absoluto mente.
 */
export async function getPenetracaoBairro(
  supabase: Cliente,
): Promise<PenetracaoBairro[]> {
  const { data, error } = await supabase
    .from("v_penetracao_bairro")
    .select("*")
    .order("penetracao_pct", { ascending: true, nullsFirst: true })
    .order("eleitores", { ascending: false });

  if (error) throw new Error(`Falha ao ler penetração por bairro: ${error.message}`);
  return data;
}

/** Colégios do maior para o menor: é a ordem da silhueta. */
export async function getPenetracaoLocal(
  supabase: Cliente,
): Promise<PenetracaoLocal[]> {
  const { data, error } = await supabase
    .from("v_penetracao_local")
    .select("*")
    .order("eleitores", { ascending: false });

  if (error) throw new Error(`Falha ao ler penetração por local: ${error.message}`);
  return data;
}

export async function getCoberturaRegiao(
  supabase: Cliente,
): Promise<CoberturaRegiao[]> {
  const { data, error } = await supabase.from("v_cobertura_regiao").select("*");
  if (error) throw new Error(`Falha ao ler cobertura: ${error.message}`);
  return data;
}

export async function getRankingSemanal(
  supabase: Cliente,
  limite = 10,
): Promise<RankingSemanal[]> {
  const { data, error } = await supabase
    .from("v_ranking_semanal")
    .select("*")
    .gt("novos_na_semana", 0)
    .limit(limite);

  if (error) throw new Error(`Falha ao ler o ranking: ${error.message}`);
  return data;
}

/** Desequilíbrio regional: desvio acima de 10 pontos percentuais (PRD 9.4). */
export const LIMITE_DESVIO_PP = 10;
