import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { Bairro, LocalVotacao } from "@/types/database";

/**
 * Leitura e escrita da superfície pública.
 *
 * Tudo aqui roda com service role, no servidor. Nenhuma chave do Supabase chega
 * ao navegador e o role `anon` não tem policy nenhuma — a URL de captação
 * circula em milhares de conversas de WhatsApp e não pode ser um vetor de
 * leitura da base.
 */

/**
 * Cookie de curta duração que leva o primeiro nome até a tela de obrigado.
 *
 * Vive aqui, e não no arquivo de Server Action, porque um módulo "use server"
 * só pode exportar função assíncrona — exportar uma constante dali derruba o
 * módulo inteiro.
 */
export const COOKIE_OBRIGADO = "rede_obrigado";

export type LiderancaPublica = {
  id: string;
  nome: string;
  slug: string;
};

/** Só o necessário para montar a página. Nada de telefone, meta ou linha pessoal. */
export async function getLiderancaPorSlug(
  slug: string,
): Promise<LiderancaPublica | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("pessoas")
    .select("id, nome, slug")
    .eq("slug", slug)
    .eq("nivel", "lideranca")
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data || !data.slug) return null;

  return { id: data.id, nome: data.nome, slug: data.slug };
}

export type TerritorioPublico = {
  bairros: Pick<Bairro, "id" | "nome">[];
  locais: Pick<LocalVotacao, "id" | "nome" | "bairro_id" | "eleitores">[];
};

export async function getTerritorioPublico(): Promise<TerritorioPublico> {
  const supabase = createServerClient();

  const [bairros, locais] = await Promise.all([
    supabase.from("bairros").select("id, nome").order("nome"),
    supabase.from("locais_votacao").select("id, nome, bairro_id, eleitores"),
  ]);

  if (bairros.error) throw new Error(bairros.error.message);
  if (locais.error) throw new Error(locais.error.message);

  return { bairros: bairros.data, locais: locais.data };
}

/** Primeiro nome, para o agradecimento. "MARIA DAS DORES" vira "Maria". */
export function primeiroNome(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  if (!primeiro) return "";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}
