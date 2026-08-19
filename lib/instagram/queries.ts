import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  HandleSemVinculo,
  LiderancaDigital,
  TemperaturaDigital,
} from "@/types/database";

type Cliente = SupabaseClient<Database>;

export const DIGITAL: Record<
  TemperaturaDigital,
  { rotulo: string; cor: string }
> = {
  ativo: { rotulo: "Ativo", cor: "var(--d-ativo)" },
  irregular: { rotulo: "Irregular", cor: "var(--d-irregular)" },
  ausente: { rotulo: "Ausente", cor: "var(--d-ausente)" },
};

/** Faltar em 5 dos últimos 6 é diagnóstico. Faltar em um não significa nada. */
export const FALTAS_PARA_ALERTA = 5;

export type PostComResumo = {
  id: string;
  url: string;
  publicado_em: string;
  legenda: string | null;
  curtidas_total: number | null;
  comentarios_total: number | null;
  no_roster: number;
  comentaram: number;
};

export async function listarPosts(supabase: Cliente): Promise<PostComResumo[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, url, publicado_em, legenda, curtidas_total, comentarios_total")
    .order("publicado_em", { ascending: false });

  if (error) throw new Error(`Falha ao listar posts: ${error.message}`);
  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id);

  const [roster, engajou] = await Promise.all([
    supabase.from("post_roster").select("post_id").in("post_id", ids),
    supabase
      .from("engajamentos")
      .select("post_id, pessoa_id")
      .in("post_id", ids)
      .eq("tipo", "comentario")
      .not("pessoa_id", "is", null),
  ]);

  const noRoster = new Map<string, number>();
  for (const r of roster.data ?? []) {
    noRoster.set(r.post_id, (noRoster.get(r.post_id) ?? 0) + 1);
  }

  // Uma pessoa conta uma vez por post, mesmo que tenha comentado duas.
  const comentaram = new Map<string, Set<string>>();
  for (const e of engajou.data ?? []) {
    if (!e.pessoa_id) continue;
    const atual = comentaram.get(e.post_id) ?? new Set<string>();
    atual.add(e.pessoa_id);
    comentaram.set(e.post_id, atual);
  }

  return posts.map((p) => ({
    ...p,
    no_roster: noRoster.get(p.id) ?? 0,
    comentaram: comentaram.get(p.id)?.size ?? 0,
  }));
}

export async function getDigitalDasLiderancas(
  supabase: Cliente,
): Promise<LiderancaDigital[]> {
  const { data, error } = await supabase
    .from("v_lideranca_digital")
    .select("*")
    .order("presencas", { ascending: true })
    .order("nome");

  if (error) throw new Error(`Falha ao ler a temperatura digital: ${error.message}`);
  return data;
}

/**
 * Quem faltou em 5 ou mais dos últimos 6 posts em que estava no roster.
 *
 * Sempre acumulado, nunca post a post: alerta por evento gera ruído e treina a
 * coordenação a ignorar o alerta.
 */
export async function getAusencias(
  supabase: Cliente,
): Promise<LiderancaDigital[]> {
  const todas = await getDigitalDasLiderancas(supabase);
  return todas
    .filter((l) => l.janela > 0 && l.faltas >= FALTAS_PARA_ALERTA)
    .sort((a, b) => b.faltas - a.faltas);
}

export async function getHandlesSemVinculo(
  supabase: Cliente,
): Promise<HandleSemVinculo[]> {
  const { data, error } = await supabase
    .from("v_handles_sem_vinculo")
    .select("*")
    .limit(300);

  if (error) throw new Error(`Falha ao ler a fila de recrutamento: ${error.message}`);
  return data;
}

/** Handle normalizado → id da pessoa. É o dicionário do casamento. */
export async function getHandlesDaBase(
  supabase: Cliente,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("pessoas")
    .select("id, instagram_handle")
    .not("instagram_handle", "is", null);

  if (error) throw new Error(error.message);

  const mapa = new Map<string, string>();
  for (const p of data ?? []) {
    if (p.instagram_handle) mapa.set(p.instagram_handle, p.id);
  }
  return mapa;
}

export async function listarLiderancasParaVinculo(
  supabase: Cliente,
): Promise<{ id: string; nome: string; instagram_handle: string | null }[]> {
  const { data, error } = await supabase
    .from("pessoas")
    .select("id, nome, instagram_handle")
    .eq("ativo", true)
    .order("nome");

  if (error) throw new Error(error.message);
  return data;
}
