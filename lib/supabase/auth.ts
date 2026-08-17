import "server-only";

import { createServerClient as criarClienteSSR } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente de sessão da coordenação. É o cliente do admin inteiro.
 *
 * Ele carrega a chave `anon` como `apikey` e o JWT do operador como
 * `Authorization`, então o Postgres resolve a role como `authenticated` e a
 * RLS decide linha a linha o que aquele operador vê. É isso que mantém a
 * diferença entre `coordenacao` e `operador` no banco, e não na tela.
 *
 * A chave `anon` é lida de `SUPABASE_ANON_KEY`, deliberadamente SEM o prefixo
 * `NEXT_PUBLIC_`: nenhuma chave do Supabase chega ao navegador, porque todo o
 * fluxo de auth acontece em Server Action. O role `anon` continua sem policy
 * nenhuma, então a chave não abre porta para leitura.
 */
export async function createAuthClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_ANON_KEY no ambiente.",
    );
  }

  const cookieStore = await cookies();

  return criarClienteSSR<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não pode gravar cookie. Quem renova a sessão é o
          // proxy, então ignorar aqui é seguro.
        }
      },
    },
  });
}
