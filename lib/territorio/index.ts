import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Bairro,
  CheckSeed,
  Database,
  LocalVotacao,
  MacroRegiao,
} from "@/types/database";

type Cliente = SupabaseClient<Database>;

/**
 * Rótulo das macro-regiões. É nome, não dado: o eleitorado de cada uma vem
 * sempre do banco.
 */
export const REGIAO_LABEL: Record<MacroRegiao, string> = {
  R1: "Central (Sede)",
  R2: "Leste",
  R3: "Balneários/Noroeste",
};

export const ELEITORADO_MUNICIPIO = 75_083;
export const SECOES_MUNICIPIO = 252;

export type Regiao = {
  codigo: MacroRegiao;
  nome: string;
  eleitores: number;
  percentual: number;
  bairros: number;
  locais: number;
  secoes: number;
};

export async function getBairros(supabase: Cliente): Promise<Bairro[]> {
  const { data, error } = await supabase
    .from("bairros")
    .select("*")
    .order("eleitores", { ascending: false });

  if (error) throw new Error(`Falha ao ler bairros: ${error.message}`);
  return data;
}

export async function getLocais(supabase: Cliente): Promise<LocalVotacao[]> {
  const { data, error } = await supabase
    .from("locais_votacao")
    .select("*")
    .order("eleitores", { ascending: false });

  if (error) throw new Error(`Falha ao ler locais: ${error.message}`);
  return data;
}

/**
 * Todos os locais, com os do bairro escolhido em primeiro.
 *
 * É o que o select em cascata da página pública precisa: o apoiador vê o
 * colégio do próprio bairro no topo e resolve com um toque, mas quem vota em
 * outro bairro continua encontrando o dele sem digitar nada.
 */
export async function getLocaisPorBairro(
  supabase: Cliente,
  bairroId: string,
): Promise<{ doBairro: LocalVotacao[]; demais: LocalVotacao[] }> {
  const locais = await getLocais(supabase);

  return {
    doBairro: locais.filter((l) => l.bairro_id === bairroId),
    demais: locais
      .filter((l) => l.bairro_id !== bairroId)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  };
}

export async function getRegioes(supabase: Cliente): Promise<Regiao[]> {
  const [bairros, locais] = await Promise.all([
    getBairros(supabase),
    getLocais(supabase),
  ]);

  const total = bairros.reduce((soma, b) => soma + b.eleitores, 0);

  return (["R1", "R2", "R3"] as const).map((codigo) => {
    const doRegiao = bairros.filter((b) => b.regiao === codigo);
    const locaisRegiao = locais.filter((l) => l.regiao === codigo);
    const eleitores = doRegiao.reduce((soma, b) => soma + b.eleitores, 0);

    return {
      codigo,
      nome: REGIAO_LABEL[codigo],
      eleitores,
      percentual: total > 0 ? (100 * eleitores) / total : 0,
      bairros: doRegiao.length,
      locais: locaisRegiao.length,
      secoes: locaisRegiao.reduce((soma, l) => soma + l.secoes, 0),
    };
  });
}

/** Os 4 checks de integridade. A regra mora em SQL, aqui só se lê o resultado. */
export async function getChecksSeed(supabase: Cliente): Promise<CheckSeed[]> {
  const { data, error } = await supabase.rpc("validar_seed");
  if (error) throw new Error(`Falha ao validar o seed: ${error.message}`);
  return data;
}
