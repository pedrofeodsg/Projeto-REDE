import "server-only";

import { createServerClient } from "../supabase/server.ts";
import type { Bairro, LocalVotacao } from "../../types/database.ts";

/**
 * Leitura e escrita da superfície pública.
 *
 * Tudo aqui roda com service role, no servidor. Nenhuma chave do Supabase chega
 * ao navegador e o role `anon` não tem policy nenhuma — a URL de captação
 * circula em milhares de conversas de WhatsApp e não pode ser um vetor de
 * leitura da base.
 */

/**
 * Cookie de curta duração que leva o primeiro nome até a tela de obrigado.
 *
 * Vive aqui, e não no arquivo de Server Action, porque um módulo "use server"
 * só pode exportar função assíncrona — exportar uma constante dali derruba o
 * módulo inteiro.
 */
export const COOKIE_OBRIGADO = "rede_obrigado";

export type LiderancaPublica = {
  id: string;
  nome: string;
  slug: string;
};

/** Só o necessário para montar a página. Nada de telefone, meta ou linha pessoal. */
export async function getLiderancaPorSlug(
  slug: string,
): Promise<LiderancaPublica | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("pessoas")
    .select("id, nome, slug")
    .eq("slug", slug)
    .eq("nivel", "lideranca")
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data || !data.slug) return null;

  return { id: data.id, nome: data.nome, slug: data.slug };
}

export type TerritorioPublico = {
  bairros: Pick<Bairro, "id" | "nome">[];
  locais: Pick<LocalVotacao, "id" | "nome" | "bairro_id" | "eleitores">[];
};

export async function getTerritorioPublico(): Promise<TerritorioPublico> {
  const supabase = createServerClient();

  const [bairros, locais] = await Promise.all([
    supabase.from("bairros").select("id, nome").order("nome"),
    supabase.from("locais_votacao").select("id, nome, bairro_id, eleitores"),
  ]);

  if (bairros.error) throw new Error(bairros.error.message);
  if (locais.error) throw new Error(locais.error.message);

  return { bairros: bairros.data, locais: locais.data };
}

export type ResultadoCadastro =
  | { situacao: "criado"; pessoaId: string }
  | { situacao: "ja_estava" }
  | { situacao: "erro"; mensagem: string };

/**
 * Grava o apoiador e resolve a duplicidade.
 *
 * Mora aqui, e não dentro da Server Action, porque é a regra mais importante
 * da superfície pública e precisa ser testável sem simular um navegador. A
 * ação virou só validação de formulário, cookie e redirecionamento.
 *
 * Regra: telefone é chave única global. O segundo cadastro do mesmo número
 * NÃO cria registro e NÃO altera a atribuição existente — o primeiro cadastro
 * prevalece, sempre. A tentativa vira fila de arbitragem privada.
 */
export async function registrarApoiador(dados: {
  liderancaId: string;
  nome: string;
  /** Já normalizado por normalizarTelefone(). */
  telefone: string;
  bairroId: string | null;
  localId: string | null;
  foraDoMunicipio: boolean;
}): Promise<ResultadoCadastro> {
  const supabase = createServerClient();

  const { data: existente } = await supabase
    .from("pessoas")
    .select("id")
    .eq("telefone", dados.telefone)
    .maybeSingle();

  if (existente) {
    await supabase.from("conflitos_cadastro").insert({
      telefone: dados.telefone,
      nome_tentado: dados.nome,
      lideranca_tentou_id: dados.liderancaId,
      pessoa_existente_id: existente.id,
    });

    return { situacao: "ja_estava" };
  }

  const { data: criada, error } = await supabase
    .from("pessoas")
    .insert({
      nome: dados.nome,
      telefone: dados.telefone,
      nivel: "apoiador",
      origem: "link",
      indicado_por: dados.liderancaId,
      bairro_moradia_id: dados.bairroId,
      local_votacao_id: dados.localId,
      fora_do_municipio: dados.foraDoMunicipio,
    })
    .select("id")
    .single();

  if (error) {
    // Corrida entre dois envios do mesmo número: o banco recusou pela unique.
    // Para quem preencheu, o resultado é o mesmo.
    if (error.message.includes("pessoas_telefone_key")) {
      return { situacao: "ja_estava" };
    }
    return { situacao: "erro", mensagem: error.message };
  }

  return { situacao: "criado", pessoaId: criada.id };
}

export type ResultadoLideranca =
  | { situacao: "criada"; pessoaId: string }
  | { situacao: "atualizada"; pessoaId: string }
  | { situacao: "erro"; mensagem: string };

/**
 * Cadastro da própria liderança, feito por ela.
 *
 * A RF-03 diz que não existe autocadastro de liderança, e a razão é impedir
 * que qualquer um se declare liderança. Aqui o link não é divulgado: a
 * coordenação já escolheu quem convidar e manda um a um. O que a pessoa faz é
 * corrigir os próprios dados, porque a planilha de origem não distingue quem é
 * quem.
 *
 * Por isso quem entra por aqui nasce INATIVA. A coordenação continua sendo
 * quem decide que aquilo é uma liderança de verdade — só parou de digitar os
 * dados de outra pessoa.
 *
 * Telefone continua sendo a chave única global:
 *   não existe        → cria como liderança pendente
 *   existe apoiador   → vira liderança pendente, mantendo quem a trouxe
 *   existe liderança  → atualiza os dados, que é o objetivo do formulário
 */
export async function registrarLideranca(dados: {
  nome: string;
  apelido: string | null;
  /** Já normalizado por normalizarTelefone(). */
  telefone: string;
  instagramHandle: string | null;
  bairroId: string | null;
  localId: string | null;
  foraDoMunicipio: boolean;
  slugSugerido: string;
}): Promise<ResultadoLideranca> {
  const supabase = createServerClient();

  const { data: existente } = await supabase
    .from("pessoas")
    .select("id, nivel, slug, ativo")
    .eq("telefone", dados.telefone)
    .maybeSingle();

  const campos = {
    nome: dados.nome,
    apelido: dados.apelido,
    instagram_handle: dados.instagramHandle,
    bairro_moradia_id: dados.bairroId,
    local_votacao_id: dados.localId,
    fora_do_municipio: dados.foraDoMunicipio,
  };

  if (existente) {
    const { error } = await supabase
      .from("pessoas")
      .update({
        ...campos,
        nivel: "lideranca",
        // Já era liderança ativa? Continua ativa. Chegou agora? Espera aval.
        ativo: existente.nivel === "lideranca" ? existente.ativo : false,
        slug: existente.slug ?? dados.slugSugerido,
      })
      .eq("id", existente.id);

    if (error) return { situacao: "erro", mensagem: error.message };
    return { situacao: "atualizada", pessoaId: existente.id };
  }

  const { data: criada, error } = await supabase
    .from("pessoas")
    .insert({
      ...campos,
      telefone: dados.telefone,
      nivel: "lideranca",
      origem: "link",
      ativo: false,
      slug: dados.slugSugerido,
    })
    .select("id")
    .single();

  if (error) {
    // Corrida entre dois envios do mesmo número.
    if (error.message.includes("pessoas_telefone_key")) {
      return { situacao: "atualizada", pessoaId: "" };
    }
    return { situacao: "erro", mensagem: error.message };
  }

  return { situacao: "criada", pessoaId: criada.id };
}

/** Slugs já ocupados, para a página de autocadastro gerar um livre. */
export async function slugsEmUso(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("pessoas")
    .select("slug")
    .not("slug", "is", null);

  return (data ?? []).map((p) => p.slug).filter((s): s is string => Boolean(s));
}

/** Primeiro nome, para o agradecimento. "MARIA DAS DORES" vira "Maria". */
export function primeiroNome(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  if (!primeiro) return "";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}
