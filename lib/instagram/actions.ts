"use server";

import { revalidatePath } from "next/cache";

import { exigirOperador } from "@/lib/auth/operador";
import { casarComABase, extrairHandles } from "@/lib/instagram/importar";
import { getHandlesDaBase } from "@/lib/instagram/queries";
import { createAuthClient } from "@/lib/supabase/auth";
import type { TipoEngajamento } from "@/types/database";

export type EstadoPost = { erro: string | null; ok?: boolean };

export type EstadoImportacao = {
  erro: string | null;
  resumo?: {
    lidos: number;
    gravados: number;
    casados: number;
    semVinculo: number;
    repetidos: number;
  };
};

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

/**
 * Cadastra o post. O roster congela no trigger, no mesmo instante.
 */
export async function cadastrarPost(
  _anterior: EstadoPost,
  formData: FormData,
): Promise<EstadoPost> {
  await exigirOperador();

  const url = texto(formData, "url");
  if (!/^https?:\/\/.+/i.test(url)) {
    return { erro: "Cole a URL do post." };
  }

  const publicado = texto(formData, "publicado_em");
  const numero = (campo: string) => {
    const v = texto(formData, campo);
    return v === "" ? null : Number(v);
  };

  const supabase = await createAuthClient();

  const { error } = await supabase.from("posts").insert({
    url,
    publicado_em: publicado ? new Date(publicado).toISOString() : new Date().toISOString(),
    legenda: texto(formData, "legenda") || null,
    curtidas_total: numero("curtidas_total"),
    comentarios_total: numero("comentarios_total"),
  });

  if (error) return { erro: error.message };

  revalidatePath("/instagram/posts");
  revalidatePath("/instagram/ausencias");
  return { erro: null, ok: true };
}

export async function excluirPost(id: string) {
  await exigirOperador();
  const supabase = await createAuthClient();
  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/instagram/posts");
  revalidatePath("/instagram/ausencias");
}

/**
 * Importa o engajamento de um post.
 *
 * Grava o `handle_cru` exatamente como veio e tenta casar pelo normalizado. O
 * que não casa entra na fila de recrutamento — não é erro de importação, é
 * gente engajada que a campanha ainda não tem cadastrada.
 */
export async function importarEngajamento(
  _anterior: EstadoImportacao,
  formData: FormData,
): Promise<EstadoImportacao> {
  await exigirOperador();

  const postId = texto(formData, "post_id");
  if (!postId) return { erro: "Escolha o post." };

  const tipo = texto(formData, "tipo") as TipoEngajamento;
  const arquivo = formData.get("arquivo");
  const colado = texto(formData, "lista");

  let entrada = colado;
  if (arquivo instanceof File && arquivo.size > 0) {
    entrada = `${await arquivo.text()}\n${colado}`;
  }

  const importados = extrairHandles(entrada);
  if (importados.length === 0) {
    return { erro: "Nenhum @ encontrado. Cole a lista ou suba o arquivo." };
  }

  const supabase = await createAuthClient();
  const daBase = await getHandlesDaBase(supabase);
  const casados = casarComABase(importados, daBase);

  const linhas = casados.map(({ importado, pessoaId }) => ({
    post_id: postId,
    handle_cru: importado.cru,
    pessoa_id: pessoaId,
    tipo,
    texto: importado.texto,
    origem: "importacao_manual" as const,
  }));

  // ignoreDuplicates: reimportar a mesma lista não duplica nem sobrescreve o
  // handle_cru que já está gravado.
  const { data, error } = await supabase
    .from("engajamentos")
    .upsert(linhas, {
      onConflict: "post_id,handle_cru,tipo",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) return { erro: error.message };

  const gravados = data?.length ?? 0;

  revalidatePath("/instagram/posts");
  revalidatePath("/instagram/importar");
  revalidatePath("/instagram/ausencias");
  revalidatePath("/instagram/vincular");

  return {
    erro: null,
    resumo: {
      lidos: importados.length,
      gravados,
      casados: casados.filter((c) => c.pessoaId).length,
      semVinculo: casados.filter((c) => !c.pessoaId).length,
      repetidos: importados.length - gravados,
    },
  };
}

/**
 * Correção manual de vínculo.
 *
 * Altera `pessoa_id` em todos os registros daquele handle. Jamais toca no
 * `handle_cru` — o trigger do banco recusaria, e a intenção é essa mesmo:
 * quando a liderança troca de @ no meio da campanha, o histórico continua
 * inteiro e só o vínculo se corrige.
 */
export async function vincularHandle(handleCru: string, pessoaId: string | null) {
  await exigirOperador();

  const supabase = await createAuthClient();
  await supabase
    .from("engajamentos")
    .update({ pessoa_id: pessoaId })
    .eq("handle_cru", handleCru);

  if (pessoaId) {
    await supabase.from("recrutamento").delete().eq("handle", handleCru);
  }

  revalidatePath("/instagram/vincular");
  revalidatePath("/instagram/ausencias");
  revalidatePath("/liderancas");
}

export async function marcarParaConvidar(handle: string, marcar: boolean) {
  const operador = await exigirOperador();
  const supabase = await createAuthClient();

  if (marcar) {
    await supabase
      .from("recrutamento")
      .upsert({ handle, operador: operador.id }, { onConflict: "handle" });
  } else {
    await supabase.from("recrutamento").delete().eq("handle", handle);
  }

  revalidatePath("/instagram/vincular");
}
