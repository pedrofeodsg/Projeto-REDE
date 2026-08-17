import "server-only";

import { redirect } from "next/navigation";

import { createAuthClient } from "@/lib/supabase/auth";
import type { Operador } from "@/types/database";

export type SessaoAdmin = {
  userId: string;
  email: string | null;
  /**
   * Nulo quando a conta existe no Supabase Auth mas ninguém inseriu a linha
   * correspondente em `operadores`. O layout do admin trata esse caso na tela,
   * em vez de redirecionar — redirecionar aqui criaria laço com o proxy.
   */
  operador: Operador | null;
};

export async function sessaoAdmin(): Promise<SessaoAdmin | null> {
  const supabase = await createAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: operador } = await supabase
    .from("operadores")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    operador: operador ?? null,
  };
}

export async function exigirOperador(): Promise<Operador> {
  const sessao = await sessaoAdmin();

  if (!sessao) redirect("/login");

  if (!sessao.operador) {
    throw new Error(
      `A conta ${sessao.email ?? sessao.userId} está autenticada mas não tem registro em operadores.`,
    );
  }

  return sessao.operador;
}
