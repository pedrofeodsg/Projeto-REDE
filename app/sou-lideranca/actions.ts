"use server";

import { normalizarHandle } from "@/lib/pessoas/instagram";
import { registrarLideranca, slugsEmUso } from "@/lib/pessoas/publico";
import { gerarSlugUnico } from "@/lib/pessoas/slug";
import { normalizarTelefone } from "@/lib/pessoas/telefone";
import { permitirCadastro } from "@/lib/rate-limit";

export type EstadoCadastroLideranca = {
  erro: string | null;
  campo?: "nome" | "telefone" | "instagram" | "bairro" | "local";
  pronto?: boolean;
  primeiroNome?: string;
};

export async function cadastrarLideranca(
  _anterior: EstadoCadastroLideranca,
  formData: FormData,
): Promise<EstadoCadastroLideranca> {
  const nome = String(formData.get("nome") ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (nome.length < 3 || !nome.includes(" ")) {
    return { erro: "Escreva seu nome completo.", campo: "nome" };
  }

  const telefone = normalizarTelefone(String(formData.get("whatsapp") ?? ""));
  if (!telefone.ok) return { erro: telefone.erro, campo: "telefone" };

  const handle = normalizarHandle(String(formData.get("instagram") ?? ""));
  if (!handle.ok) return { erro: handle.erro, campo: "instagram" };

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

  const resultado = await registrarLideranca({
    nome,
    apelido: String(formData.get("apelido") ?? "").trim() || null,
    telefone: telefone.telefone,
    instagramHandle: handle.handle,
    bairroId: bairroId || null,
    localId: localId || null,
    foraDoMunicipio,
    slugSugerido: gerarSlugUnico(nome, await slugsEmUso()),
  });

  if (resultado.situacao === "erro") {
    return { erro: "Não conseguimos registrar agora. Tente de novo em instantes." };
  }

  // Criada ou atualizada, a resposta é a mesma: quem preencheu não precisa
  // saber que já estava na base.
  return {
    erro: null,
    pronto: true,
    primeiroNome: nome.split(/\s+/)[0] ?? "",
  };
}
