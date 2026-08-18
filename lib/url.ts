/**
 * Base da URL pública, sem barra no fim.
 *
 * É o prefixo do link de captação de cada liderança. Vem de
 * NEXT_PUBLIC_SITE_URL para que o link montado em desenvolvimento não vaze
 * localhost para dentro de uma mensagem de WhatsApp.
 */
export function urlPublicaBase(): string {
  const bruta = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return bruta.replace(/\/+$/, "");
}

/** Só o host, para exibir em tela. Protocolo não é informação para o operador. */
export function hostPublico(): string {
  return urlPublicaBase().replace(/^https?:\/\//, "");
}

/** Link de captação completo de uma liderança. */
export function linkDaLideranca(slug: string): string {
  return `${urlPublicaBase()}/${slug}`;
}

/** O que aparece na tela: sem protocolo, porque protocolo não é informação. */
export function linkParaExibir(slug: string): string {
  return linkDaLideranca(slug).replace(/^https?:\/\//, "");
}
