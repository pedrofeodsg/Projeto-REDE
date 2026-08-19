import { redirect } from "next/navigation";

import { Sidebar, type Contagens } from "@/components/admin/sidebar";
import { chaveDoEmail } from "@/lib/auth/acesso";
import { sessaoAdmin } from "@/lib/auth/operador";
import { createAuthClient } from "@/lib/supabase/auth";

// Toda tela do admin depende da sessão do operador. Nenhuma é estática.
export const dynamic = "force-dynamic";

/**
 * Conta o que está esperando alguém.
 *
 * Vira número ao lado do item no menu: a navegação também é fila de trabalho.
 * Falha aqui não pode derrubar o painel inteiro — na dúvida, mostra zero.
 */
async function contarPendencias(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
): Promise<Contagens> {
  const [demandas, conflitos] = await Promise.all([
    supabase
      .from("demandas")
      .select("id", { count: "exact", head: true })
      .in("status", ["aberta", "em_andamento"]),
    supabase
      .from("conflitos_cadastro")
      .select("id", { count: "exact", head: true })
      .eq("resolvido", false),
  ]);

  return {
    demandas: demandas.count ?? 0,
    conflitos: conflitos.count ?? 0,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await sessaoAdmin();
  if (!sessao) redirect("/login");

  const supabase = await createAuthClient();
  const contagens = sessao.operador
    ? await contarPendencias(supabase)
    : { demandas: 0, conflitos: 0 };

  return (
    <div className="admin min-h-dvh bg-background">
      <Sidebar
        nome={sessao.operador?.nome ?? chaveDoEmail(sessao.email) ?? "—"}
        papel={sessao.operador?.papel ?? null}
        contagens={contagens}
      />

      <div className="lg:pl-[240px]">
        <main className="px-5 py-8 sm:px-8 lg:py-10">
          {sessao.operador ? (
            children
          ) : (
            <ContaSemOperador chave={chaveDoEmail(sessao.email)} />
          )}
        </main>
      </div>
    </div>
  );
}

function ContaSemOperador({ chave }: { chave: string | null }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display tracking-display text-section text-ink">
        Conta sem vínculo
      </h1>
      <p className="mt-4 text-body text-ink-2">
        A chave {chave ? <strong className="text-ink">{chave}</strong> : "atual"}{" "}
        existe no Supabase Auth, mas não tem linha correspondente na tabela{" "}
        <code className="font-data text-small text-ink">operadores</code>. Sem
        ela o sistema não sabe qual é o papel dessa pessoa, e por segurança não
        assume nenhum.
      </p>
      <p className="mt-4 text-body text-ink-2">
        Rode o INSERT de criação do operador no SQL Editor do Supabase e recarregue.
      </p>
    </div>
  );
}
