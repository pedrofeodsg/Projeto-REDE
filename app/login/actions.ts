"use server";

import { redirect } from "next/navigation";

import { createAuthClient } from "@/lib/supabase/auth";

export type EstadoLogin = {
  erro: string | null;
};

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  // Mensagem única de propósito: dizer qual dos dois está errado entrega
  // quais e-mails existem na base.
  if (error) {
    return { erro: "E-mail ou senha não conferem." };
  }

  redirect("/painel");
}

export async function sair() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
