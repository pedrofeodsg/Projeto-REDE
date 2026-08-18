import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lê tokens de cor do próprio arquivo de design.
 *
 * A imagem de preview do WhatsApp é gerada no servidor, fora do CSS, e mesmo
 * assim precisa da cor da campanha. Copiar o hexadecimal para dentro do código
 * criaria um segundo lugar para trocar a cor — e o segundo lugar é sempre o que
 * ninguém lembra de atualizar.
 *
 * `next.config.ts` garante que docs/design-tokens.css vá junto no deploy.
 */

let cache: Record<string, string> | null = null;

function tokens(): Record<string, string> {
  if (cache) return cache;

  const encontrados: Record<string, string> = {};

  try {
    const css = readFileSync(
      join(process.cwd(), "docs", "design-tokens.css"),
      "utf8",
    );

    for (const [, nome, valor] of css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
      encontrados[nome] = valor.trim();
    }
  } catch {
    // Sem o arquivo, os padrões abaixo seguram a barra.
  }

  cache = encontrados;
  return encontrados;
}

export function token(nome: string, padrao: string): string {
  const valor = tokens()[nome];
  return valor && valor.startsWith("#") ? valor : padrao;
}

export const CAMPANHA = () => token("campanha", "#1B4D3E");
export const CAMPANHA_INK = () => token("campanha-ink", "#FFFFFF");
export const PAPER = () => token("paper", "#F5F6F6");
export const PAPER_INK = () => token("paper-ink", "#101010");
export const PAPER_INK_2 = () => token("paper-ink-2", "#5C5C5C");
