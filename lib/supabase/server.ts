import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente de service role. Ignora RLS por completo.
 *
 * Uso permitido: a superfície pública (`/[slug]`), que lê a liderança e as
 * listas territoriais e grava o cadastro sem que nenhuma chave chegue ao
 * navegador. O role `anon` não tem policy nenhuma, então a leitura da página
 * pública só é possível por aqui.
 *
 * Uso proibido: qualquer tela do admin. Lá vale `createAuthClient()`, com a
 * sessão do operador e a RLS decidindo o que ele enxerga.
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
