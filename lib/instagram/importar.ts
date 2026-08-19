import { normalizarHandle } from "../pessoas/instagram.ts";

/**
 * Leitura do que o extrator externo entrega.
 *
 * O sistema não conversa com o Instagram: recebe uma lista. Ela pode chegar
 * como colagem de texto (um @ por linha) ou como CSV exportado de qualquer
 * ferramenta. Este módulo transforma as duas coisas na mesma estrutura.
 *
 * Invariante 3: o `cru` sai daqui EXATAMENTE como entrou. A normalização
 * existe só para tentar o casamento; ela nunca substitui o original.
 */

export type HandleImportado = {
  /** Como veio. Vai para `handle_cru` e nunca é sobrescrito. */
  cru: string;
  /** Minúsculo, sem @ e sem URL. Só serve para casar. */
  normalizado: string | null;
  /** Texto do comentário, quando o CSV traz. */
  texto: string | null;
};

/** Aspas de CSV, separador por vírgula ou ponto e vírgula. */
function celulasDaLinha(linha: string): string[] {
  const celulas: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i];

    if (c === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }

    if ((c === "," || c === ";" || c === "\t") && !dentroDeAspas) {
      celulas.push(atual);
      atual = "";
      continue;
    }

    atual += c;
  }

  celulas.push(atual);
  return celulas.map((c) => c.trim());
}

const CABECALHOS = new Set([
  "handle",
  "usuario",
  "username",
  "user",
  "perfil",
  "arroba",
  "@",
]);

/**
 * Aceita colagem simples e CSV, com ou sem cabeçalho.
 *
 * Na colagem, a linha inteira é o @. No CSV, a primeira célula é o @ e a
 * segunda, quando existe, é o texto do comentário.
 */
export function extrairHandles(entrada: string): HandleImportado[] {
  const linhas = (entrada ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const vistos = new Set<string>();
  const resultado: HandleImportado[] = [];

  for (const [indice, linha] of linhas.entries()) {
    const celulas = celulasDaLinha(linha);
    const primeira = celulas[0] ?? "";
    if (primeira === "") continue;

    // Descarta a linha de cabeçalho, se houver.
    if (indice === 0 && CABECALHOS.has(primeira.toLowerCase().replace(/^@/, ""))) {
      continue;
    }

    const normalizado = normalizarHandle(primeira);
    const chave = normalizado.ok && normalizado.handle ? normalizado.handle : primeira;

    // O mesmo @ repetido na mesma importação entra uma vez só.
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    resultado.push({
      cru: primeira,
      normalizado: normalizado.ok ? normalizado.handle : null,
      texto: celulas[1] ? celulas[1] : null,
    });
  }

  return resultado;
}

/**
 * Casa a lista importada com quem já está na base.
 *
 * Comparação por handle normalizado, dos dois lados. O que não casa não é erro
 * de importação: é gente engajada que a campanha ainda não tem cadastrada.
 */
export function casarComABase(
  importados: HandleImportado[],
  handlesDaBase: Map<string, string>,
): { importado: HandleImportado; pessoaId: string | null }[] {
  return importados.map((importado) => ({
    importado,
    pessoaId: importado.normalizado
      ? (handlesDaBase.get(importado.normalizado) ?? null)
      : null,
  }));
}
