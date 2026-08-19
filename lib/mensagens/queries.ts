import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  LiderancaNaLista,
  MacroRegiao,
  TemplateMensagem,
  TemperaturaCadastro,
} from "@/types/database";

type Cliente = SupabaseClient<Database>;

export async function listarTemplates(
  supabase: Cliente,
  apenasAtivos = false,
): Promise<TemplateMensagem[]> {
  let query = supabase.from("templates_mensagem").select("*").order("ordem");
  if (apenasAtivos) query = query.eq("ativo", true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar templates: ${error.message}`);
  return data;
}

export type FiltrosLista = {
  busca?: string;
  bairroId?: string;
  regiao?: MacroRegiao;
  tagId?: string;
  estado?: TemperaturaCadastro;
};

/**
 * A lista de trabalho, direto da view.
 *
 * Nenhuma tela recalcula temperatura por conta própria: se um dia dois lugares
 * discordarem sobre quem está afastado, a coordenação perde a confiança no
 * número na frente de uma liderança — e aí o painel morre.
 */
export async function listarLiderancasComEstado(
  supabase: Cliente,
  filtros: FiltrosLista = {},
): Promise<LiderancaNaLista[]> {
  let query = supabase.from("v_liderancas").select("*").order("nome");

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.bairroId) query = query.eq("bairro_id", filtros.bairroId);
  if (filtros.regiao) query = query.eq("regiao", filtros.regiao);

  if (filtros.busca?.trim()) {
    const termo = filtros.busca.trim();
    const digitos = termo.replace(/\D/g, "");
    query =
      digitos.length >= 4
        ? query.or(`nome.ilike.%${termo}%,apelido.ilike.%${termo}%,telefone.ilike.%${digitos}%`)
        : query.or(`nome.ilike.%${termo}%,apelido.ilike.%${termo}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar lideranças: ${error.message}`);
  return data;
}

export type ResumoDaRede = {
  totalCadastrados: number;
  cadastrados24h: number;
  liderancasAtivas: number;
  liderancasTotal: number;
  semLinkEnviado: number;
  metaAgregada: number;
  porEstado: Record<TemperaturaCadastro, number>;
};

/**
 * Os quatro indicadores do topo e a distribuição do termômetro.
 *
 * "Ativa" é o mesmo conceito do motor de temperatura: recebeu cadastro nos
 * últimos 10 dias. Sai da view, não de uma segunda conta.
 */
export async function getResumoDaRede(
  supabase: Cliente,
  liderancas: LiderancaNaLista[],
): Promise<ResumoDaRede> {
  const ontem = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [total, ultimas24h] = await Promise.all([
    supabase
      .from("pessoas")
      .select("id", { count: "exact", head: true })
      .eq("nivel", "apoiador")
      .eq("ativo", true),
    supabase
      .from("pessoas")
      .select("id", { count: "exact", head: true })
      .eq("nivel", "apoiador")
      .eq("ativo", true)
      .gt("criado_em", ontem),
  ]);

  const porEstado = {
    aguardando: 0,
    afastado: 0,
    frio: 0,
    quente: 0,
    muito_quente: 0,
    engajado: 0,
  } satisfies Record<TemperaturaCadastro, number>;

  for (const l of liderancas) porEstado[l.estado] += 1;

  const ativas = liderancas.filter(
    (l) => l.dias_parada !== null && l.dias_parada <= 10 && l.cadastros > 0,
  ).length;

  return {
    totalCadastrados: total.count ?? 0,
    cadastrados24h: ultimas24h.count ?? 0,
    liderancasAtivas: ativas,
    liderancasTotal: liderancas.length,
    semLinkEnviado: liderancas.filter((l) => l.enviado_em === null).length,
    metaAgregada: liderancas.reduce((soma, l) => soma + l.meta, 0),
    porEstado,
  };
}

/** Tags de todas as pessoas, para juntar à lista sem uma consulta por linha. */
export async function tagsPorPessoa(
  supabase: Cliente,
): Promise<Map<string, { id: string; nome: string }[]>> {
  const { data, error } = await supabase
    .from("pessoa_tags")
    .select("pessoa_id, tag:tags ( id, nome )")
    .returns<{ pessoa_id: string; tag: { id: string; nome: string } | null }[]>();

  if (error) throw new Error(`Falha ao listar tags: ${error.message}`);

  const mapa = new Map<string, { id: string; nome: string }[]>();
  for (const linha of data ?? []) {
    if (!linha.tag) continue;
    const atual = mapa.get(linha.pessoa_id) ?? [];
    atual.push(linha.tag);
    mapa.set(linha.pessoa_id, atual);
  }
  return mapa;
}
