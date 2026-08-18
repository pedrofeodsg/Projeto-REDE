"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  COOKIE_OBRIGADO,
  getLiderancaPorSlug,
  primeiroNome,
} from "@/lib/pessoas/publico";
import { normalizarTelefone } from "@/lib/pessoas/telefone";
import { permitirCadastro } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/supabase/server";

export type EstadoCadastro = {
  erro: string | null;
  campo?: "nome" | "telefone" | "bairro" | "local";
};

export async function confirmarApoio(
  slug: string,
  _anterior: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const lideranca = await getLiderancaPorSlug(slug);
  if (!lideranca) {
    return { erro: "Este convite não está mais disponível." };
  }

  const nome = String(formData.get("nome") ?? "").trim().replace(/\s+/g, " ");
  if (nome.length < 3 || !nome.includes(" ")) {
    return { erro: "Escreva seu nome completo.", campo: "nome" };
  }

  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  if (!telefone.ok) return { erro: telefone.erro, campo: "telefone" };

  const foraDoMunicipio = formData.get("bairro") === "fora";
  const bairroId = foraDoMunicipio ? null : String(formData.get("bairro") ?? "");
  const localId = foraDoMunicipio ? null : String(formData.get("local") ?? "");

  if (!foraDoMunicipio && !bairroId) {
    return { erro: "Escolha o bairro onde você mora.", campo: "bairro" };
  }
  if (!foraDoMunicipio && !localId) {
    return { erro: "Escolha onde você vota.", campo: "local" };
  }

  if (!(await permitirCadastro())) {
    return {
      erro: "Muitos cadastros seguidos deste aparelho. Espere alguns minutos e tente de novo.",
    };
  }

  const supabase = createServerClient();

  // Telefone é chave única global. Duplicidade é resolvida AQUI, no servidor —
  // nunca no formulário, e nunca revelando de quem a pessoa é.
  const { data: existente } = await supabase
    .from("pessoas")
    .select("id")
    .eq("telefone", telefone.telefone)
    .maybeSingle();

  if (existente) {
    // Não cria registro. Não altera a atribuição existente. O primeiro
    // cadastro prevalece, e a tentativa vira fila de arbitragem privada.
    await supabase.from("conflitos_cadastro").insert({
      telefone: telefone.telefone,
      nome_tentado: nome,
      lideranca_tentou_id: lideranca.id,
      pessoa_existente_id: existente.id,
    });

    await gravarCookieDeObrigado(nome, true);
    redirect(`/${slug}/obrigado`);
  }

  const { error } = await supabase.from("pessoas").insert({
    nome,
    telefone: telefone.telefone,
    nivel: "apoiador",
    origem: "link",
    indicado_por: lideranca.id,
    bairro_moradia_id: bairroId || null,
    local_votacao_id: localId || null,
    fora_do_municipio: foraDoMunicipio,
  });

  if (error) {
    // Corrida entre dois envios do mesmo número: o banco recusou pela unique.
    // Do ponto de vista de quem preencheu, o resultado é o mesmo.
    if (error.message.includes("pessoas_telefone_key")) {
      await gravarCookieDeObrigado(nome, true);
      redirect(`/${slug}/obrigado`);
    }

    return { erro: "Não conseguimos registrar agora. Tente de novo em instantes." };
  }

  await gravarCookieDeObrigado(nome, false);
  redirect(`/${slug}/obrigado`);
}

/**
 * O nome vai por cookie de curta duração, não por query string: assim ele não
 * fica no histórico do navegador nem vaza no cabeçalho de referência.
 */
async function gravarCookieDeObrigado(nome: string, jaEstava: boolean) {
  const jar = await cookies();

  jar.set(COOKIE_OBRIGADO, JSON.stringify({ n: primeiroNome(nome), d: jaEstava }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
}
