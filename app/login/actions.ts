"use server";

import { redirect } from "next/navigation";

import { emailDaChave } from "@/lib/auth/acesso";
import { createAuthClient } from "@/lib/supabase/auth";

export type EstadoLogin = {
  erro: string | null;
};

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const chave = String(formData.get("chave") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!chave || !senha) {
    return { erro: "Preencha a chave de acesso e a senha." };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailDaChave(chave),
    password: senha,
  });

  // Mensagem única de propósito: dizer qual dos dois está errado entrega
  // quais chaves existem.
  if (error) {
    return { erro: "Chave de acesso ou senha não conferem." };
  }

  redirect("/painel");
}

export async function sair() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
