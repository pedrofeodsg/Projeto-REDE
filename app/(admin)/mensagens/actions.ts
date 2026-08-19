"use server";

import { revalidatePath } from "next/cache";

import { exigirOperador } from "@/lib/auth/operador";
import { createAuthClient } from "@/lib/supabase/auth";

export type EstadoTemplate = { erro: string | null; salvo?: boolean };

const VARIAVEIS_CONHECIDAS = [
  "nome",
  "link_cadastro",
  "cadastrados",
  "meta",
  "faltam",
  "linha_pessoal",
];

function validarCorpo(corpo: string): string | null {
  if (corpo.trim().length < 10) return "O corpo da mensagem está muito curto.";

  const usadas = [...corpo.matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]);
  const desconhecidas = [...new Set(usadas)].filter(
    (v) => !VARIAVEIS_CONHECIDAS.includes(v),
  );

  if (desconhecidas.length > 0) {
    return `Variável que o sistema não conhece: {${desconhecidas.join("}, {")}}. Disponíveis: {${VARIAVEIS_CONHECIDAS.join("} {")}}`;
  }

  return null;
}

export async function salvarTemplate(
  id: string | null,
  _anterior: EstadoTemplate,
  formData: FormData,
): Promise<EstadoTemplate> {
  await exigirOperador();

  const nome = String(formData.get("nome") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  const ativo = formData.get("ativo") !== null;

  if (nome.length < 2) return { erro: "Dê um nome ao template." };

  const problema = validarCorpo(corpo);
  if (problema) return { erro: problema };

  const supabase = await createAuthClient();

  const { error } = id
    ? await supabase.from("templates_mensagem").update({ nome, corpo, ativo }).eq("id", id)
    : await supabase.from("templates_mensagem").insert({ nome, corpo, ativo });

  if (error) return { erro: error.message };

  revalidatePath("/mensagens");
  revalidatePath("/liderancas");
  revalidatePath("/painel");
  return { erro: null, salvo: true };
}

export async function excluirTemplate(id: string) {
  await exigirOperador();

  const supabase = await createAuthClient();
  await supabase.from("templates_mensagem").delete().eq("id", id);

  revalidatePath("/mensagens");
}
