import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { REGIAO_LABEL } from "../territorio/index.ts";
import type { Database } from "../../types/database.ts";

import {
  scanearVazamento,
  type LinhaColegio,
  type LinhaRegiao,
  type NumerosSintese,
  type PerfilExportacao,
  type PontoDaCurva,
  type Relatorio,
  type RelatorioCandidato,
  type RelatorioInterno,
  type RelatorioPublico,
} from "./perfis.ts";

type Cliente = SupabaseClient<Database>;

export const ESTRUTURA = "Núcleo de Inteligência e Dados · Gabinete do Vereador Pedro Abreu";
export const MUNICIPIO = "São Pedro da Aldeia · RJ";
export const FONTE_TERRITORIAL = "TSE · Estatísticas do Eleitorado · 59ª ZE · extração de 03/08/2026";
export const DIA_DA_ELEICAO = "2026-10-04";

/** Colégio é considerado coberto quando tem ao menos uma liderança âncora. */
function cobertos(colegios: LinhaColegio[]): number {
  return colegios.filter((c) => c.temAncora).length;
}

/**
 * Projeção linear a partir do ritmo das últimas semanas.
 *
 * Deliberadamente simples e deliberadamente conservadora: ela existe para dar
 * ordem de grandeza, e o PRD é explícito em que projeção inflada faz uma
 * campanha bem-sucedida parecer fracasso.
 */
function projetar(curva: PontoDaCurva[]): { ate: string; estimado: number } | null {
  if (curva.length === 0) return null;

  const recentes = curva.slice(-3);
  const mediaSemanal =
    recentes.reduce((soma, p) => soma + p.novos, 0) / recentes.length;

  const acumulado = curva[curva.length - 1].acumulado;
  const semanasRestantes = Math.max(
    0,
    Math.ceil(
      (new Date(DIA_DA_ELEICAO).getTime() - Date.now()) / (7 * 86_400_000),
    ),
  );

  return {
    ate: DIA_DA_ELEICAO,
    estimado: Math.round(acumulado + mediaSemanal * semanasRestantes),
  };
}

async function coletar(supabase: Cliente) {
  const [regioesRaw, colegiosRaw, curvaRaw, liderancasRaw, bairros] =
    await Promise.all([
      supabase.from("v_cobertura_regiao").select("*"),
      supabase.from("v_penetracao_local").select("*").order("eleitores", { ascending: false }),
      supabase.from("v_curva_semanal").select("*"),
      supabase.from("v_liderancas").select("*").eq("ativo", true).order("cadastros", { ascending: false }),
      supabase.from("bairros").select("eleitores"),
    ]);

  const eleitorado = (bairros.data ?? []).reduce((s, b) => s + b.eleitores, 0);

  const regioes: LinhaRegiao[] = (regioesRaw.data ?? []).map((r) => ({
    regiao: r.regiao,
    nome: REGIAO_LABEL[r.regiao],
    eleitores: r.eleitores,
    eleitoradoPct: Number(r.eleitorado_pct ?? 0),
    cadastros: r.cadastros,
    cadastrosPct: Number(r.cadastros_pct ?? 0),
    desvioPp: Number(r.desvio_pp ?? 0),
  }));

  const colegios: LinhaColegio[] = (colegiosRaw.data ?? []).map((c) => ({
    nome: c.nome,
    bairro: c.bairro_nome,
    regiao: c.regiao,
    eleitores: c.eleitores,
    cadastros: c.cadastros,
    penetracaoPct: Number(c.penetracao_pct ?? 0),
    temAncora: c.liderancas_ancora > 0,
  }));

  const curva: PontoDaCurva[] = (curvaRaw.data ?? []).map((p) => ({
    semana: p.semana,
    novos: Number(p.novos),
    acumulado: Number(p.acumulado),
  }));

  const liderancas = liderancasRaw.data ?? [];
  const cadastrados = colegios.reduce((s, c) => s + c.cadastros, 0);

  const numeros: NumerosSintese = {
    cadastrados: curva.at(-1)?.acumulado ?? cadastrados,
    eleitorado,
    penetracaoPct: eleitorado > 0 ? (100 * cadastrados) / eleitorado : 0,
    liderancasAtivas: liderancas.filter(
      (l) => l.dias_parada !== null && l.dias_parada <= 10 && l.cadastros > 0,
    ).length,
    liderancasTotal: liderancas.length,
    colegiosCobertos: cobertos(colegios),
    colegiosTotal: colegios.length,
  };

  return { numeros, regioes, colegios, curva, liderancas };
}

/**
 * Monta o relatório de um perfil.
 *
 * O `candidato` e o `publico` passam pelo scanner antes de sair. Se um dia
 * alguém acrescentar um campo por conveniência, isto quebra antes de o link
 * existir — e não depois, na caixa de entrada de outra campanha.
 */
export async function montarRelatorio(
  supabase: Cliente,
  perfil: PerfilExportacao,
): Promise<Relatorio> {
  const { numeros, regioes, colegios, curva, liderancas } = await coletar(supabase);
  const extraidoEm = new Date().toISOString();

  const base = { estrutura: ESTRUTURA, municipio: MUNICIPIO, extraidoEm };

  if (perfil === "interno") {
    const relatorio: RelatorioInterno = {
      perfil: "interno",
      ...base,
      numeros,
      regioes,
      colegios,
      curva,
      liderancas: liderancas.map((l) => ({
        nome: l.nome,
        bairro: l.bairro_nome ?? "—",
        regiao: l.regiao ?? "—",
        cadastros: l.cadastros,
        telefone: l.telefone,
        meta: l.meta,
      })),
    };
    // O interno não passa pelo scanner: ele é justamente o que tem contato, e
    // por isso nunca é compartilhável por link.
    return relatorio;
  }

  if (perfil === "publico") {
    const relatorio: RelatorioPublico = {
      perfil: "publico",
      ...base,
      numeros,
      // Sem o nome da região: só o código e os números.
      regioes: regioes.map(({ nome: _nome, ...resto }) => resto),
    };
    garantirQueNaoVaza(relatorio);
    return relatorio;
  }

  const relatorio: RelatorioCandidato = {
    perfil: "candidato",
    ...base,
    fonteTerritorial: FONTE_TERRITORIAL,
    numeros,
    regioes,
    // Os 15 maiores concentram 59,6% do eleitorado. É onde a decisão importa.
    colegios: colegios.slice(0, 15),
    curva,
    projecao: projetar(curva),
    liderancas: liderancas.map((l) => ({
      nome: l.nome,
      bairro: l.bairro_nome ?? "—",
      regiao: l.regiao ?? "—",
      cadastros: l.cadastros,
    })),
  };

  garantirQueNaoVaza(relatorio);
  return relatorio;
}

function garantirQueNaoVaza(relatorio: unknown) {
  const achados = scanearVazamento(relatorio);
  if (achados.length > 0) {
    throw new Error(
      `Exportação bloqueada: ${achados.length} campo(s) de contato no payload — ${achados
        .map((a) => a.caminho)
        .join(", ")}`,
    );
  }
}
