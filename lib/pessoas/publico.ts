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

/** Primeiro nome, para o agradecimento. "MARIA DAS DORES" vira "Maria". */
export function primeiroNome(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  if (!primeiro) return "";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}
