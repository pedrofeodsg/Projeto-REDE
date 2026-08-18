import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, MacroRegiao, Tag } from "@/types/database";

type Cliente = SupabaseClient<Database>;

export type LiderancaListada = {
  id: string;
  nome: string;
  telefone: string;
  slug: string | null;
  meta: number;
  linha_pessoal: string | null;
  instagram_handle: string | null;
  ativo: boolean;
  criado_em: string;
  bairro_moradia_id: string | null;
  local_votacao_id: string | null;
  local: { id: string; nome: string; regiao: MacroRegiao; bairro_id: string } | null;
  bairro: { id: string; nome: string; regiao: MacroRegiao } | null;
  tags: { tag: { id: string; nome: string } | null }[];
};

const SELECT_LIDERANCA = `
  id, nome, telefone, slug, meta, linha_pessoal, instagram_handle, ativo, criado_em,
  bairro_moradia_id, local_votacao_id,
  local:locais_votacao ( id, nome, regiao, bairro_id ),
  bairro:bairros ( id, nome, regiao ),
  tags:pessoa_tags ( tag:tags ( id, nome ) )
`;

export type FiltrosLideranca = {
  busca?: string;
  bairroId?: string;
  regiao?: MacroRegiao;
  tagId?: string;
};

export async function listarLiderancas(
  supabase: Cliente,
  filtros: FiltrosLideranca = {},
): Promise<LiderancaListada[]> {
  let query = supabase
    .from("pessoas")
    .select(SELECT_LIDERANCA)
    .eq("nivel", "lideranca")
    .order("nome", { ascending: true });

  if (filtros.busca?.trim()) {
    const termo = filtros.busca.trim();
    const digitos = termo.replace(/\D/g, "");
    // Busca por nome ou por telefone. O telefone é comparado em dígitos,
    // porque é assim que ele está gravado.
    query = digitos.length >= 4
      ? query.or(`nome.ilike.%${termo}%,telefone.ilike.%${digitos}%`)
      : query.ilike("nome", `%${termo}%`);
  }

  const { data, error } = await query.returns<LiderancaListada[]>();
  if (error) throw new Error(`Falha ao listar lideranças: ${error.message}`);

  // Bairro, região e tag filtram em memória: são derivados de embed, e filtrar
  // por coluna de tabela embutida exigiria inner join explícito no PostgREST.
  // A lista é de 70 lideranças, então o custo é irrelevante e a leitura é óbvia.
  let lista = data ?? [];

  if (filtros.bairroId) {
    lista = lista.filter((l) => l.local?.bairro_id === filtros.bairroId);
  }
  if (filtros.regiao) {
    lista = lista.filter((l) => l.local?.regiao === filtros.regiao);
  }
  if (filtros.tagId) {
    lista = lista.filter((l) => l.tags.some((t) => t.tag?.id === filtros.tagId));
  }

  return lista;
}

export async function getLideranca(
  supabase: Cliente,
  id: string,
): Promise<LiderancaListada | null> {
  const { data, error } = await supabase
    .from("pessoas")
    .select(SELECT_LIDERANCA)
    .eq("id", id)
    .eq("nivel", "lideranca")
    .maybeSingle<LiderancaListada>();

  if (error) throw new Error(`Falha ao ler a liderança: ${error.message}`);
  return data;
}

/**
 * Quantas pessoas essa liderança já trouxe.
 *
 * É o que decide se o slug ainda pode mudar: passou do primeiro cadastro, o
 * link já circulou e o endereço trava (RF-04).
 */
export async function contarIndicados(supabase: Cliente, id: string): Promise<number> {
  const { count, error } = await supabase
    .from("pessoas")
    .select("id", { count: "exact", head: true })
    .eq("indicado_por", id);

  if (error) throw new Error(`Falha ao contar indicados: ${error.message}`);
  return count ?? 0;
}

export async function listarTags(supabase: Cliente): Promise<Tag[]> {
  const { data, error } = await supabase.from("tags").select("*").order("nome");
  if (error) throw new Error(`Falha ao listar tags: ${error.message}`);
  return data;
}

export async function slugsOcupados(supabase: Cliente): Promise<string[]> {
  const { data, error } = await supabase
    .from("pessoas")
    .select("slug")
    .not("slug", "is", null);

  if (error) throw new Error(`Falha ao ler slugs: ${error.message}`);
  return (data ?? []).map((p) => p.slug).filter((s): s is string => Boolean(s));
}
