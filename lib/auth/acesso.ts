/**
 * A coordenação entra por chave de acesso, não por e-mail.
 *
 * O Supabase Auth só autentica por e-mail, então a chave é convertida num
 * endereço interno que nunca aparece na tela, nunca recebe mensagem e não
 * existe fora do banco. `painelsistema` vira `painelsistema@rede.local`.
 *
 * Manter o Supabase Auth em vez de inventar sessão própria é o que permite a
 * RLS continuar sendo regra de banco: o JWT do login é o que faz o Postgres
 * resolver a role como `authenticated`.
 */
export const DOMINIO_INTERNO = "rede.local";

export function emailDaChave(chave: string): string {
  const limpa = chave.trim().toLowerCase();
  return limpa.includes("@") ? limpa : `${limpa}@${DOMINIO_INTERNO}`;
}

export function chaveDoEmail(email: string | null): string | null {
  if (!email) return null;
  const sufixo = `@${DOMINIO_INTERNO}`;
  return email.endsWith(sufixo) ? email.slice(0, -sufixo.length) : email;
}
