import { PREFIXOS_ADMIN } from "../auth/rotas.ts";

/**
 * Geração do slug da liderança — o endereço público dela, em `/[slug]`.
 *
 * Como a rota pública mora na raiz, o slug disputa espaço com toda rota do
 * sistema. Uma liderança chamada "Painel" geraria `/painel` e sequestraria o
 * dashboard; "Login" geraria `/login`. Por isso a lista de reservados, que é
 * derivada das rotas do admin e não escrita à mão duas vezes.
 */

const RESERVADOS = new Set([
  ...PREFIXOS_ADMIN.map((p) => p.slice(1)),
  "login",
  "logout",
  "api",
  "r",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "obrigado",
  "admin",
  "sou-lideranca",
  "static",
  "public",
]);

const TAMANHO_MAXIMO = 60;

export function gerarSlug(nome: string): string {
  return (nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira o acento, mantém a letra
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TAMANHO_MAXIMO)
    .replace(/-+$/g, "");
}

export function slugEhValido(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= TAMANHO_MAXIMO;
}

export function slugEhReservado(slug: string): boolean {
  return RESERVADOS.has(slug);
}

/**
 * Resolve colisão com sufixo numérico. Recebe os slugs que já existem em vez
 * de consultar o banco, para continuar sendo função pura e testável.
 */
export function gerarSlugUnico(nome: string, ocupados: Iterable<string>): string {
  const base = gerarSlug(nome);
  if (!base) return "";

  const tomados = new Set(ocupados);
  const indisponivel = (s: string) => tomados.has(s) || slugEhReservado(s);

  if (!indisponivel(base)) return base;

  for (let n = 2; n < 1000; n += 1) {
    const candidato = `${base}-${n}`;
    if (!indisponivel(candidato)) return candidato;
  }

  return `${base}-${Date.now()}`;
}
