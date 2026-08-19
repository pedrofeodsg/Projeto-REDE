/**
 * Como o nome de alguém aparece na tela.
 *
 * Cidade pequena: muita gente é conhecida só pelo apelido, e o nome de
 * registro não abre porta nenhuma. Mas o apelido sozinho apaga quem a pessoa
 * é no papel — então os dois andam juntos.
 */

export function nomeCompleto(
  nome: string,
  apelido?: string | null,
): string {
  const alcunha = (apelido ?? "").trim();
  if (!alcunha) return nome;

  // Apelido que já é parte do nome não vira repetição.
  if (nome.toLowerCase().includes(alcunha.toLowerCase())) return nome;

  return `${nome} (${alcunha})`;
}

/** Primeiro nome para tratamento direto: o apelido ganha, quando existe. */
export function comoChamar(nome: string, apelido?: string | null): string {
  const alcunha = (apelido ?? "").trim();
  if (alcunha) return alcunha;

  return nome.trim().split(/\s+/)[0] ?? nome;
}
