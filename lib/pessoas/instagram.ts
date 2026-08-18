/**
 * Normalização canônica do @ do Instagram.
 *
 * O handle é a chave de ligação do módulo digital (Bloco 6). Nome de exibição
 * muda e se repete; handle é único. Guardado em minúsculo, sem @, sem espaço e
 * sem URL, para que o casamento com o que vier da importação seja comparação de
 * texto e não adivinhação.
 *
 * Invariante 3: isto normaliza o handle do CADASTRO. O `handle_cru` que vem da
 * importação de engajamento nunca é sobrescrito — mora em coluna separada.
 */

export type HandleNormalizado =
  | { ok: true; handle: string | null }
  | { ok: false; erro: string };

const VALIDO = /^[a-z0-9._]{1,30}$/;

export function normalizarHandle(entrada: string | null | undefined): HandleNormalizado {
  const bruto = (entrada ?? "").trim();

  // Campo opcional: vazio é ausência, não erro.
  if (bruto === "") return { ok: true, handle: null };

  const handle = bruto
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .split(/[?#]/)[0]
    .replace(/\/+$/, "")
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .toLowerCase();

  if (handle === "") {
    return { ok: false, erro: "@ do Instagram inválido." };
  }

  if (!VALIDO.test(handle)) {
    return {
      ok: false,
      erro: "@ do Instagram inválido. Use só letras, números, ponto e sublinhado.",
    };
  }

  return { ok: true, handle };
}
