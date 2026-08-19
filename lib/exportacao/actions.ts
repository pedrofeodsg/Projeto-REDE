"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { exigirOperador } from "@/lib/auth/operador";
import { createAuthClient } from "@/lib/supabase/auth";

import { PERFIL, type PerfilExportacao } from "./perfis";

export type EstadoExportacao = { erro: string | null; token?: string };

function ehPerfil(v: string): v is PerfilExportacao {
  return v === "interno" || v === "candidato" || v === "publico";
}

/**
 * Gera um link de prestação de contas.
 *
 * Token de 32 bytes aleatórios em base64url: não se adivinha, e não se deriva
 * de nada da base. O perfil interno não gera link — ele é o único que carrega
 * telefone, e o que carrega telefone não sai da organização.
 */
export async function gerarLink(
  _anterior: EstadoExportacao,
  formData: FormData,
): Promise<EstadoExportacao> {
  const operador = await exigirOperador();

  if (operador.papel !== "coordenacao") {
    return { erro: "Apenas a coordenação exporta." };
  }

  const perfil = String(formData.get("perfil") ?? "");
  if (!ehPerfil(perfil)) return { erro: "Perfil inválido." };

  if (!PERFIL[perfil].compartilhavel) {
    return {
      erro: "O perfil interno não vira link: ele é o único que carrega telefone.",
    };
  }

  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("exportacoes")
    .insert({
      perfil,
      operador: operador.id,
      token: randomBytes(32).toString("base64url"),
      rotulo: String(formData.get("rotulo") ?? "").trim() || null,
    })
    .select("token")
    .single();

  if (error) return { erro: error.message };

  revalidatePath("/exportar");
  return { erro: null, token: data.token };
}

/** Revogar é o interruptor. O link para de responder na hora seguinte ao clique. */
export async function alternarRevogacao(id: string, revogado: boolean) {
  const operador = await exigirOperador();
  if (operador.papel !== "coordenacao") return;

  const supabase = await createAuthClient();
  await supabase.from("exportacoes").update({ revogado }).eq("id", id);

  revalidatePath("/exportar");
}
