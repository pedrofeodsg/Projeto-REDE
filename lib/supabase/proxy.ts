import { createServerClient as criarClienteSSR } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ehRotaAdmin } from "@/lib/auth/rotas";
import type { Database } from "@/types/database";

/**
 * Renova a sessão a cada request e protege o grupo (admin).
 *
 * Roda no `proxy.ts` da raiz — em Next 16 o middleware passou a se chamar
 * proxy e roda em runtime nodejs.
 */
export async function atualizarSessao(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const precisaDeSessao = ehRotaAdmin(pathname) || pathname === "/login";

  // A página pública é o componente crítico do sistema: precisa carregar em
  // menos de 2s em 4G. Validar sessão nela custaria uma ida ao Supabase em
  // toda visita, para descobrir que não há sessão nenhuma — quem abre o
  // convite nunca está logado.
  if (!precisaDeSessao) {
    return NextResponse.next({ request });
  }

  let resposta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_ANON_KEY no ambiente.",
    );
  }

  const supabase = criarClienteSSR<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar) {
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() valida o token no servidor do Supabase. getSession() só lê o
  // cookie e é falsificável — não usar aqui.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && ehRotaAdmin(pathname)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  if (user && pathname === "/login") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}
