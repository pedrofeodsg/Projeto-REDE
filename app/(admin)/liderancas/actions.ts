"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirOperador } from "@/lib/auth/operador";
import type { Database } from "@/types/database";
import { normalizarHandle } from "@/lib/pessoas/instagram";
import { contarIndicados, slugsOcupados } from "@/lib/pessoas/queries";
import { gerarSlugUnico, slugEhReservado, slugEhValido } from "@/lib/pessoas/slug";
import { normalizarTelefone } from "@/lib/pessoas/telefone";
import { createAuthClient } from "@/lib/supabase/auth";

export type EstadoFormulario = {
  erro: string | null;
  campo?: string;
};

type Campos = {
  nome: string;
  telefone: string;
  bairroId: string | null;
  localId: string;
  handle: string | null;
  meta: number;
  linhaPessoal: string | null;
  slug: string | null;
  tags: string[];
  ativo: boolean;
};

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

function lerCampos(formData: FormData): Campos | EstadoFormulario {
  const nome = texto(formData, "nome");
  if (nome.length < 2) {
    return { erro: "Informe o nome da liderança.", campo: "nome" };
  }

  const telefone = normalizarTelefone(texto(formData, "telefone"));
  if (!telefone.ok) return { erro: telefone.erro, campo: "telefone" };

  const handle = normalizarHandle(texto(formData, "instagram_handle"));
  if (!handle.ok) return { erro: handle.erro, campo: "instagram_handle" };

  const metaBruta = texto(formData, "meta");
  const meta = metaBruta === "" ? 10 : Number(metaBruta);
  if (!Number.isInteger(meta) || meta < 0) {
    return { erro: "A meta precisa ser um número inteiro.", campo: "meta" };
  }

  const localId = texto(formData, "local_votacao_id") || null;
  if (!localId) {
    return {
      erro: "Escolha o local de votação âncora — é ele que define a macro-região.",
      campo: "local_votacao_id",
    };
  }

  const slugPedido = texto(formData, "slug").toLowerCase() || null;
  if (slugPedido) {
    if (!slugEhValido(slugPedido)) {
      return {
        erro: "Endereço inválido. Use só letras minúsculas, números e hífen.",
        campo: "slug",
      };
    }
    if (slugEhReservado(slugPedido)) {
      return {
        erro: `"${slugPedido}" é uma rota do próprio sistema. Escolha outro endereço.`,
        campo: "slug",
      };
    }
  }

  return {
    nome,
    telefone: telefone.telefone,
    bairroId: texto(formData, "bairro_moradia_id") || null,
    localId,
    handle: handle.handle,
    meta,
    linhaPessoal: texto(formData, "linha_pessoal") || null,
    slug: slugPedido,
    tags: formData.getAll("tags").map(String).filter(Boolean),
    ativo: formData.get("ativo") !== null,
  };
}

function ehErro(v: Campos | EstadoFormulario): v is EstadoFormulario {
  return "erro" in v;
}

function traduzirErroDoBanco(mensagem: string): string {
  if (mensagem.includes("pessoas_telefone_key")) {
    return "Esse WhatsApp já está na base. O primeiro cadastro prevalece.";
  }
  if (mensagem.includes("pessoas_slug_key")) {
    return "Esse endereço já pertence a outra liderança.";
  }
  if (mensagem.includes("meta de uma liderança")) {
    return "Apenas a coordenação altera a meta.";
  }
  if (mensagem.includes("já circulou")) {
    return "O link desta liderança já trouxe cadastro. O endereço não muda mais.";
  }
  return mensagem;
}

async function gravarTags(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  pessoaId: string,
  tags: string[],
) {
  await supabase.from("pessoa_tags").delete().eq("pessoa_id", pessoaId);
  if (tags.length === 0) return;

  await supabase
    .from("pessoa_tags")
    .insert(tags.map((tagId) => ({ pessoa_id: pessoaId, tag_id: tagId })));
}

export async function criarLideranca(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirOperador();

  const campos = lerCampos(formData);
  if (ehErro(campos)) return campos;

  const supabase = await createAuthClient();

  // A macro-região não é escolhida: é derivada do local âncora (RF-03).
  const { data: local, error: erroLocal } = await supabase
    .from("locais_votacao")
    .select("id, regiao")
    .eq("id", campos.localId)
    .maybeSingle();

  if (erroLocal || !local) {
    return { erro: "Local de votação não encontrado.", campo: "local_votacao_id" };
  }

  const slug = campos.slug ?? gerarSlugUnico(campos.nome, await slugsOcupados(supabase));
  if (!slug) {
    return { erro: "Não foi possível gerar o endereço a partir desse nome.", campo: "nome" };
  }

  const { data: criada, error } = await supabase
    .from("pessoas")
    .insert({
      nome: campos.nome,
      telefone: campos.telefone,
      nivel: "lideranca",
      bairro_moradia_id: campos.bairroId,
      local_votacao_id: campos.localId,
      instagram_handle: campos.handle,
      slug,
      meta: campos.meta,
      linha_pessoal: campos.linhaPessoal,
      origem: "admin",
      ativo: true,
    })
    .select("id")
    .single();

  if (error) return { erro: traduzirErroDoBanco(error.message) };

  await gravarTags(supabase, criada.id, campos.tags);

  revalidatePath("/liderancas");
  redirect(`/liderancas/${criada.id}?criada=1`);
}

export async function atualizarLideranca(
  id: string,
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirOperador();

  const campos = lerCampos(formData);
  if (ehErro(campos)) return campos;

  const supabase = await createAuthClient();

  const { data: local } = await supabase
    .from("locais_votacao")
    .select("id")
    .eq("id", campos.localId)
    .maybeSingle();

  if (!local) {
    return { erro: "Local de votação não encontrado.", campo: "local_votacao_id" };
  }

  // O slug só muda enquanto o link ainda não trouxe ninguém. Depois disso ele
  // está no WhatsApp de terceiros e trocar quebraria o que já circulou.
  const indicados = await contarIndicados(supabase, id);
  const alteracao: Database["public"]["Tables"]["pessoas"]["Update"] = {
    nome: campos.nome,
    telefone: campos.telefone,
    bairro_moradia_id: campos.bairroId,
    local_votacao_id: campos.localId,
    instagram_handle: campos.handle,
    meta: campos.meta,
    linha_pessoal: campos.linhaPessoal,
    ativo: campos.ativo,
  };

  if (indicados === 0 && campos.slug) {
    alteracao.slug = campos.slug;
  }

  const { error } = await supabase.from("pessoas").update(alteracao).eq("id", id);
  if (error) return { erro: traduzirErroDoBanco(error.message) };

  await gravarTags(supabase, id, campos.tags);

  revalidatePath("/liderancas");
  revalidatePath(`/liderancas/${id}`);
  return { erro: null };
}
