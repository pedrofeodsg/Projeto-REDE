"use server";

import { revalidatePath } from "next/cache";

import { exigirOperador } from "@/lib/auth/operador";
import { slugsOcupados } from "@/lib/pessoas/queries";
import { gerarSlugUnico } from "@/lib/pessoas/slug";
import { createAuthClient } from "@/lib/supabase/auth";
import type { StatusDemanda, TipoInteracao } from "@/types/database";

export type EstadoAcao = { erro: string | null; ok?: boolean };

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

// ── interações ─────────────────────────────────────────────────────────────

export async function registrarInteracao(
  pessoaId: string,
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const operador = await exigirOperador();

  const descricao = texto(formData, "descricao");
  if (descricao.length < 2) {
    return { erro: "Escreva o que aconteceu no contato." };
  }

  const tipo = texto(formData, "tipo") as TipoInteracao;
  const supabase = await createAuthClient();

  const { error } = await supabase.from("interacoes").insert({
    pessoa_id: pessoaId,
    tipo,
    canal: texto(formData, "canal") || null,
    descricao,
    autor: operador.id,
  });

  if (error) return { erro: error.message };

  revalidatePath(`/pessoas/${pessoaId}`);
  return { erro: null, ok: true };
}

export async function excluirInteracao(id: string, pessoaId: string) {
  await exigirOperador();
  const supabase = await createAuthClient();
  await supabase.from("interacoes").delete().eq("id", id);
  revalidatePath(`/pessoas/${pessoaId}`);
}

// ── demandas ───────────────────────────────────────────────────────────────

export async function registrarDemanda(
  pessoaId: string,
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const operador = await exigirOperador();

  const titulo = texto(formData, "titulo");
  if (titulo.length < 3) return { erro: "Dê um título à demanda." };

  const supabase = await createAuthClient();

  const { error } = await supabase.from("demandas").insert({
    pessoa_id: pessoaId,
    titulo,
    descricao: texto(formData, "descricao") || null,
    categoria: texto(formData, "categoria") || null,
    responsavel: operador.id,
  });

  if (error) return { erro: error.message };

  revalidatePath(`/pessoas/${pessoaId}`);
  revalidatePath("/demandas");
  return { erro: null, ok: true };
}

export async function mudarStatusDemanda(
  id: string,
  status: StatusDemanda,
  pessoaId?: string,
) {
  await exigirOperador();

  const supabase = await createAuthClient();
  await supabase.from("demandas").update({ status }).eq("id", id);

  if (pessoaId) revalidatePath(`/pessoas/${pessoaId}`);
  revalidatePath("/demandas");
}

export async function atribuirDemanda(id: string, responsavel: string | null) {
  await exigirOperador();
  const supabase = await createAuthClient();
  await supabase.from("demandas").update({ responsavel }).eq("id", id);
  revalidatePath("/demandas");
}

// ── promoção (RF-06) ───────────────────────────────────────────────────────

/**
 * Promove um apoiador a liderança.
 *
 * Altera `nivel` na mesma linha e gera o slug. Não migra registro entre
 * tabelas — é por isso que `pessoas` é única e autorreferente — então o
 * `indicado_por` original permanece, e quem trouxe essa pessoa continua
 * levando o crédito por ela.
 */
export async function promoverALideranca(
  pessoaId: string,
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirOperador();

  const supabase = await createAuthClient();

  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("id, nome, nivel, slug, indicado_por")
    .eq("id", pessoaId)
    .maybeSingle();

  if (!pessoa) return { erro: "Pessoa não encontrada." };
  if (pessoa.nivel === "lideranca") return { erro: "Já é liderança." };

  const localId = texto(formData, "local_votacao_id");
  if (!localId) {
    return { erro: "Escolha o colégio âncora — é ele que define a macro-região." };
  }

  const metaBruta = texto(formData, "meta");
  const meta = metaBruta === "" ? 10 : Number(metaBruta);
  if (!Number.isInteger(meta) || meta < 0) {
    return { erro: "A meta precisa ser um número inteiro." };
  }

  const slug = pessoa.slug ?? gerarSlugUnico(pessoa.nome, await slugsOcupados(supabase));
  if (!slug) return { erro: "Não foi possível gerar o endereço a partir desse nome." };

  const { error } = await supabase
    .from("pessoas")
    .update({
      nivel: "lideranca",
      slug,
      local_votacao_id: localId,
      meta,
      linha_pessoal: texto(formData, "linha_pessoal") || null,
      instagram_handle: texto(formData, "instagram_handle") || null,
    })
    .eq("id", pessoaId);

  if (error) return { erro: error.message };

  revalidatePath(`/pessoas/${pessoaId}`);
  revalidatePath("/liderancas");
  revalidatePath("/painel");
  return { erro: null, ok: true };
}

// ── reatribuição (RF-07) ───────────────────────────────────────────────────

/**
 * Muda a quem um cadastro é creditado, individualmente ou em lote.
 *
 * Toda mudança vira linha em `reatribuicoes`, que é append-only. Reatribuir é
 * mexer no que a liderança considera "seu": a pergunta "quem mudou isso, e
 * quando" precisa ter resposta antes de alguém fazer a pergunta.
 */
export async function reatribuir(
  pessoaIds: string[],
  paraPessoaId: string | null,
  motivo?: string,
): Promise<EstadoAcao> {
  const operador = await exigirOperador();
  if (pessoaIds.length === 0) return { erro: "Ninguém selecionado." };

  const supabase = await createAuthClient();

  const { data: antes, error: erroLeitura } = await supabase
    .from("pessoas")
    .select("id, indicado_por")
    .in("id", pessoaIds);

  if (erroLeitura) return { erro: erroLeitura.message };

  // Ninguém pode ser indicado por si mesma, e reatribuir para quem não mudou
  // nada só sujaria a auditoria.
  const alvos = (antes ?? []).filter(
    (p) => p.id !== paraPessoaId && p.indicado_por !== paraPessoaId,
  );
  if (alvos.length === 0) return { erro: null, ok: true };

  const { error } = await supabase
    .from("pessoas")
    .update({ indicado_por: paraPessoaId })
    .in(
      "id",
      alvos.map((p) => p.id),
    );

  if (error) return { erro: error.message };

  await supabase.from("reatribuicoes").insert(
    alvos.map((p) => ({
      pessoa_id: p.id,
      de_pessoa_id: p.indicado_por,
      para_pessoa_id: paraPessoaId,
      operador: operador.id,
      motivo: motivo?.trim() || null,
    })),
  );

  revalidatePath("/liderancas");
  revalidatePath("/pessoas");
  revalidatePath("/painel");
  revalidatePath("/conflitos");
  return { erro: null, ok: true };
}

// ── conflitos ──────────────────────────────────────────────────────────────

export async function arbitrarConflito(
  conflitoId: string,
  acao: "manter" | "transferir",
) {
  await exigirOperador();
  const supabase = await createAuthClient();

  if (acao === "transferir") {
    const { data: conflito } = await supabase
      .from("conflitos_cadastro")
      .select("pessoa_existente_id, lideranca_tentou_id")
      .eq("id", conflitoId)
      .maybeSingle();

    if (conflito?.pessoa_existente_id && conflito.lideranca_tentou_id) {
      await reatribuir(
        [conflito.pessoa_existente_id],
        conflito.lideranca_tentou_id,
        "arbitragem de conflito de cadastro",
      );
    }
  }

  await supabase
    .from("conflitos_cadastro")
    .update({ resolvido: true })
    .eq("id", conflitoId);

  revalidatePath("/conflitos");
}
