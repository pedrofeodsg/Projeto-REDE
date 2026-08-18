/**
 * Normalização canônica de telefone.
 *
 * Invariante 2: `telefone` é a chave única global da base, gravada só com
 * dígitos e prefixo 55. TODA escrita de telefone no sistema passa por aqui,
 * sem exceção — é isso que faz "(22) 99999-9999" e "5522999999999" serem a
 * mesma pessoa na hora de detectar duplicidade, e é isso que faz o link do
 * wa.me abrir em vez de quebrar.
 *
 * O banco ainda tem um CHECK exigindo 12 ou 13 dígitos começando com 55, para
 * o caso de alguém um dia escrever direto na tabela.
 */

export type TelefoneNormalizado =
  | { ok: true; telefone: string }
  | { ok: false; erro: string };

const APENAS_DIGITOS = /\D/g;

export function normalizarTelefone(entrada: string): TelefoneNormalizado {
  const digitos = (entrada ?? "").replace(APENAS_DIGITOS, "");

  if (digitos.length === 0) {
    return { ok: false, erro: "Informe o WhatsApp." };
  }

  // DDD + número, sem código do país.
  if (digitos.length === 10 || digitos.length === 11) {
    return { ok: true, telefone: `55${digitos}` };
  }

  // Já veio com o código do país.
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    return { ok: true, telefone: digitos };
  }

  return {
    ok: false,
    erro: "WhatsApp inválido. Use DDD e número, como (22) 99999-9999.",
  };
}

/** Formata para leitura humana: +55 (22) 99999-9999. Nunca para gravação. */
export function formatarTelefone(telefone: string): string {
  const d = telefone.replace(APENAS_DIGITOS, "");
  if (d.length < 12 || !d.startsWith("55")) return telefone;

  const ddd = d.slice(2, 4);
  const numero = d.slice(4);
  const meio = numero.length === 9 ? 5 : 4;

  return `+55 (${ddd}) ${numero.slice(0, meio)}-${numero.slice(meio)}`;
}
