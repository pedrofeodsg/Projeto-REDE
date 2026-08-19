"use server";

import { revalidatePath } from "next/cache";

import { exigirOperador } from "@/lib/auth/operador";
import { createAuthClient } from "@/lib/supabase/auth";

/**
 * Registra a abertura do WhatsApp.
 *
 * Limitação conhecida e assumida: o clique registra a ABERTURA da conversa,
 * não a confirmação de envio. Por isso existe o botão de "marcar como não
 * enviado" — sem ele, um clique errado empurraria a liderança para "afastado"
 * em cinco dias sem ela nunca ter recebido nada.
 *
 * Isto alimenta três coisas: o contador de quem ainda não recebeu o link, a
 * trava contra envio duplicado, e o cálculo de dias parados, que conta desde o
 * envio e não desde o cadastro no admin.
 */
export async function registrarEnvio(pessoaId: string, templateId: string) {
  const operador = await exigirOperador();
  const supabase = await createAuthClient();

  const { error } = await supabase.from("envios").insert({
    pessoa_id: pessoaId,
    template_id: templateId,
    operador: operador.id,
  });

  if (error) return { erro: error.message };

  revalidatePath("/liderancas");
  revalidatePath("/painel");
  return { erro: null };
}

/** Inverte `confirmado`. Correção manual de clique que não virou mensagem. */
export async function alternarConfirmacao(envioId: string, confirmado: boolean) {
  await exigirOperador();

  const supabase = await createAuthClient();
  await supabase.from("envios").update({ confirmado }).eq("id", envioId);

  revalidatePath("/liderancas");
  revalidatePath("/painel");
}

/**
 * Desfaz o último envio registrado de uma liderança.
 *
 * É o "marcar como não enviado" da linha da lista, onde o operador não tem o
 * id do envio na mão.
 */
export async function marcarUltimoComoNaoEnviado(pessoaId: string) {
  await exigirOperador();

  const supabase = await createAuthClient();

  const { data: ultimo } = await supabase
    .from("envios")
    .select("id")
    .eq("pessoa_id", pessoaId)
    .eq("confirmado", true)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ultimo) return;

  await supabase.from("envios").update({ confirmado: false }).eq("id", ultimo.id);

  revalidatePath("/liderancas");
  revalidatePath("/painel");
}
