/**
 * Lê as variáveis de ambiente para os scripts de linha de comando.
 *
 * Na Vercel elas chegam por process.env. Em máquina local vêm do .env.local,
 * que não é comitado.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

function doArquivo() {
  try {
    return Object.fromEntries(
      readFileSync(join(RAIZ, ".env.local"), "utf8")
        .split("\n")
        .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const arquivo = doArquivo();

export function env(nome, obrigatoria = true) {
  const valor = process.env[nome] ?? arquivo[nome];
  if (!valor && obrigatoria) {
    throw new Error(`Falta a variável de ambiente ${nome}.`);
  }
  return valor;
}

export function ehErroDeRede(erro) {
  const msg = String(erro?.message ?? erro ?? "").toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("socket hang up")
  );
}

/**
 * Repete uma chamada ao Supabase que falhou por motivo transitório.
 *
 * O cliente do Supabase não lança em falha de rede: devolve no campo `error`.
 * Por isso a retentativa olha o resultado, e não a exceção. Erro de dado ou de
 * permissão passa direto, sem repetição — repetir não conserta seed errado.
 */
export async function comRetentativa(tarefa, tentativas = 3) {
  let ultimo;

  for (let i = 1; i <= tentativas; i += 1) {
    let resultado;
    try {
      resultado = await tarefa();
    } catch (erro) {
      resultado = { error: erro };
    }

    if (!resultado?.error || !ehErroDeRede(resultado.error)) return resultado;

    ultimo = resultado;
    if (i < tentativas) {
      const espera = 400 * 2 ** (i - 1);
      console.log(`  rede instável (tentativa ${i}/${tentativas}), repetindo em ${espera}ms…`);
      await new Promise((r) => setTimeout(r, espera));
    }
  }

  return ultimo;
}
