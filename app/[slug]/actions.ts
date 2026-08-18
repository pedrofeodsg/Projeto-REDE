"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  COOKIE_OBRIGADO,
  getLiderancaPorSlug,
  primeiroNome,
  registrarApoiador,
} from "@/lib/pessoas/publico";
import { normalizarTelefone } from "@/lib/pessoas/telefone";
import { permitirCadastro } from "@/lib/rate-limit";

export type EstadoCadastro = {
  erro: string | null;
  campo?: "nome" | "telefone" | "bairro" | "local";
};

/**
 * Cola de entrada e saída: valida o formulário, chama a regra e decide para
 * onde a pessoa vai. A regra de duplicidade mora em registrarApoiador().
 */
export async function confirmarApoio(
  slug: string,
  _anterior: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const lideranca = await getLiderancaPorSlug(slug);
  if (!lideranca) {
    return { erro: "Este convite não está mais disponível." };
  }

  const nome = String(formData.get("nome") ?? "")
    .trim()
    .replace(/\s+/g, " ");
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

  const resultado = await registrarApoiador({
    liderancaId: lideranca.id,
    nome,
    telefone: telefone.telefone,
    bairroId: bairroId || null,
    localId: localId || null,
    foraDoMunicipio,
  });

  if (resultado.situacao === "erro") {
    return { erro: "Não conseguimos registrar agora. Tente de novo em instantes." };
  }

  await gravarCookieDeObrigado(nome, resultado.situacao === "ja_estava");
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
