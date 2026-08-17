import { redirect } from "next/navigation";

import { sair } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { chaveDoEmail } from "@/lib/auth/acesso";
import { sessaoAdmin } from "@/lib/auth/operador";

// Toda tela do admin depende da sessão do operador. Nenhuma é estática.
export const dynamic = "force-dynamic";

const PAPEL_LABEL = {
  coordenacao: "Coordenação",
  operador: "Operador",
} as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await sessaoAdmin();

  if (!sessao) redirect("/login");

  return (
    <div className="admin flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
        <div>
          <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            Núcleo de Inteligência e Dados
          </p>
          <p className="font-display tracking-card text-card text-ink">
            Projeto REDE
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-small font-medium text-ink">
              {sessao.operador?.nome ?? chaveDoEmail(sessao.email)}
            </p>
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              {sessao.operador
                ? PAPEL_LABEL[sessao.operador.papel]
                : "Sem vínculo"}
            </p>
          </div>

          <form action={sair}>
            <Button
              type="submit"
              variant="outline"
              className="font-display tracking-card h-9 border-line-2 bg-transparent text-tiny text-ink-2 hover:text-ink"
            >
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 sm:px-8">
        {sessao.operador ? (
          children
        ) : (
          <ContaSemOperador chave={chaveDoEmail(sessao.email)} />
        )}
      </main>
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
