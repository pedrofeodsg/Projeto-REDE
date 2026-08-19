import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  DemandaNaFila,
  LiderancaNaLista,
  Pessoa,
  StatusDemanda,
  TemperaturaCadastro,
  TipoInteracao,
} from "@/types/database";

type Cliente = SupabaseClient<Database>;

export const TIPO_INTERACAO: Record<TipoInteracao, string> = {
  ligacao: "Ligação",
  visita: "Visita",
  conversa: "Conversa",
  mensagem: "Mensagem",
};

export const STATUS_DEMANDA: Record<
  StatusDemanda,
  { rotulo: string; aberta: boolean }
> = {
  aberta: { rotulo: "Aberta", aberta: true },
  em_andamento: { rotulo: "Em andamento", aberta: true },
  resolvida: { rotulo: "Resolvida", aberta: false },
  sem_solucao: { rotulo: "Sem solução", aberta: false },
};

/** Sugestões, não taxonomia fechada: demanda de morador não cabe em lista. */
export const CATEGORIAS_SUGERIDAS = [
  "Saúde",
  "Iluminação",
  "Calçamento e buraco",
  "Água e esgoto",
  "Educação",
  "Assistência social",
  "Transporte",
  "Limpeza urbana",
  "Segurança",
  "Documentação",
  "Emprego",
];

export type PessoaCompleta = Pessoa & {
  bairro: { id: string; nome: string } | null;
  local: { id: string; nome: string; regiao: string; bairro_id: string } | null;
  quem_indicou: { id: string; nome: string; nivel: string } | null;
};

export async function getPessoa(
  supabase: Cliente,
  id: string,
): Promise<PessoaCompleta | null> {
  const { data, error } = await supabase
    .from("pessoas")
    .select(
      `*,
       bairro:bairros ( id, nome ),
       local:locais_votacao ( id, nome, regiao, bairro_id ),
       quem_indicou:pessoas!pessoas_indicado_por_fkey ( id, nome, nivel )`,
    )
    .eq("id", id)
    .maybeSingle<PessoaCompleta>();

  if (error) throw new Error(`Falha ao ler a pessoa: ${error.message}`);
  return data;
}

export type ItemDaLinhaDoTempo =
  | {
      especie: "interacao";
      id: string;
      em: string;
      tipo: TipoInteracao;
      canal: string | null;
      descricao: string;
      autor_nome: string | null;
    }
  | {
      especie: "demanda";
      id: string;
      em: string;
      titulo: string;
      descricao: string | null;
      categoria: string | null;
      status: StatusDemanda;
      resolvida_em: string | null;
      responsavel_nome: string | null;
    };

/**
 * Interações e demandas na mesma linha do tempo, cronológica reversa.
 *
 * Separadas em duas tabelas porque têm ciclos de vida diferentes — demanda tem
 * status, interação não —, mas quem lê o prontuário quer uma história só.
 */
export async function getLinhaDoTempo(
  supabase: Cliente,
  pessoaId: string,
): Promise<ItemDaLinhaDoTempo[]> {
  const [interacoes, demandas] = await Promise.all([
    supabase
      .from("interacoes")
      .select("id, criado_em, tipo, canal, descricao, autor:operadores ( nome )")
      .eq("pessoa_id", pessoaId)
      .returns<
        {
          id: string;
          criado_em: string;
          tipo: TipoInteracao;
          canal: string | null;
          descricao: string;
          autor: { nome: string } | null;
        }[]
      >(),
    supabase
      .from("demandas")
      .select(
        "id, aberta_em, titulo, descricao, categoria, status, resolvida_em, responsavel:operadores ( nome )",
      )
      .eq("pessoa_id", pessoaId)
      .returns<
        {
          id: string;
          aberta_em: string;
          titulo: string;
          descricao: string | null;
          categoria: string | null;
          status: StatusDemanda;
          resolvida_em: string | null;
          responsavel: { nome: string } | null;
        }[]
      >(),
  ]);

  if (interacoes.error) throw new Error(interacoes.error.message);
  if (demandas.error) throw new Error(demandas.error.message);

  const itens: ItemDaLinhaDoTempo[] = [
    ...(interacoes.data ?? []).map((i) => ({
      especie: "interacao" as const,
      id: i.id,
      em: i.criado_em,
      tipo: i.tipo,
      canal: i.canal,
      descricao: i.descricao,
      autor_nome: i.autor?.nome ?? null,
    })),
    ...(demandas.data ?? []).map((d) => ({
      especie: "demanda" as const,
      id: d.id,
      em: d.aberta_em,
      titulo: d.titulo,
      descricao: d.descricao,
      categoria: d.categoria,
      status: d.status,
      resolvida_em: d.resolvida_em,
      responsavel_nome: d.responsavel?.nome ?? null,
    })),
  ];

  return itens.sort((a, b) => b.em.localeCompare(a.em));
}

/** A árvore de indicados de uma liderança. */
export async function getIndicados(
  supabase: Cliente,
  pessoaId: string,
): Promise<
  { id: string; nome: string; criado_em: string; nivel: string; local_nome: string | null }[]
> {
  const { data, error } = await supabase
    .from("pessoas")
    .select("id, nome, criado_em, nivel, local:locais_votacao ( nome )")
    .eq("indicado_por", pessoaId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .returns<
      {
        id: string;
        nome: string;
        criado_em: string;
        nivel: string;
        local: { nome: string } | null;
      }[]
    >();

  if (error) throw new Error(`Falha ao ler os indicados: ${error.message}`);
  return (data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    criado_em: p.criado_em,
    nivel: p.nivel,
    local_nome: p.local?.nome ?? null,
  }));
}

export async function getEstadoDaLideranca(
  supabase: Cliente,
  pessoaId: string,
): Promise<LiderancaNaLista | null> {
  const { data } = await supabase
    .from("v_liderancas")
    .select("*")
    .eq("id", pessoaId)
    .maybeSingle();
  return data;
}

export async function getHistoricoTemperatura(
  supabase: Cliente,
  pessoaId: string,
): Promise<{ estado: TemperaturaCadastro; cadastros: number; calculado_em: string }[]> {
  const { data, error } = await supabase
    .from("temperatura_historico")
    .select("estado, cadastros, calculado_em")
    .eq("pessoa_id", pessoaId)
    .order("calculado_em", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getHistoricoEnvios(
  supabase: Cliente,
  pessoaId: string,
): Promise<
  { id: string; enviado_em: string; confirmado: boolean; template_nome: string | null }[]
> {
  const { data, error } = await supabase
    .from("envios")
    .select("id, enviado_em, confirmado, template:templates_mensagem ( nome )")
    .eq("pessoa_id", pessoaId)
    .order("enviado_em", { ascending: false })
    .returns<
      {
        id: string;
        enviado_em: string;
        confirmado: boolean;
        template: { nome: string } | null;
      }[]
    >();

  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    id: e.id,
    enviado_em: e.enviado_em,
    confirmado: e.confirmado,
    template_nome: e.template?.nome ?? null,
  }));
}

export type FiltrosDemanda = {
  status?: StatusDemanda;
  categoria?: string;
  responsavel?: string;
  apenasAbertas?: boolean;
};

export async function listarDemandas(
  supabase: Cliente,
  filtros: FiltrosDemanda = {},
): Promise<DemandaNaFila[]> {
  let query = supabase
    .from("v_demandas")
    .select("*")
    .order("aberta_em", { ascending: false });

  if (filtros.status) query = query.eq("status", filtros.status);
  else if (filtros.apenasAbertas)
    query = query.in("status", ["aberta", "em_andamento"]);

  if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros.responsavel) query = query.eq("responsavel", filtros.responsavel);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar demandas: ${error.message}`);
  return data;
}

export async function listarOperadores(
  supabase: Cliente,
): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase.from("operadores").select("id, nome").order("nome");
  if (error) return [];
  return data;
}

export type ConflitoNaFila = {
  id: string;
  telefone: string;
  nome_tentado: string;
  resolvido: boolean;
  criado_em: string;
  tentou: { id: string; nome: string } | null;
  existente: { id: string; nome: string; indicado_por: string | null } | null;
};

export async function listarConflitos(
  supabase: Cliente,
  incluirResolvidos = false,
): Promise<ConflitoNaFila[]> {
  let query = supabase
    .from("conflitos_cadastro")
    .select(
      `id, telefone, nome_tentado, resolvido, criado_em,
       tentou:pessoas!conflitos_cadastro_lideranca_tentou_id_fkey ( id, nome ),
       existente:pessoas!conflitos_cadastro_pessoa_existente_id_fkey ( id, nome, indicado_por )`,
    )
    .order("criado_em", { ascending: false });

  if (!incluirResolvidos) query = query.eq("resolvido", false);

  const { data, error } = await query.returns<ConflitoNaFila[]>();
  if (error) throw new Error(`Falha ao listar conflitos: ${error.message}`);
  return data ?? [];
}
