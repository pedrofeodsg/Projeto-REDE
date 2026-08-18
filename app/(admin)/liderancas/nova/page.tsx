import type { Metadata } from "next";
import Link from "next/link";

import { criarLideranca } from "@/app/(admin)/liderancas/actions";
import { LiderancaForm } from "@/app/(admin)/liderancas/lideranca-form";
import { listarTags } from "@/lib/pessoas/queries";
import { createAuthClient } from "@/lib/supabase/auth";
import { getBairros, getLocais } from "@/lib/territorio";
import { hostPublico } from "@/lib/url";

export const metadata: Metadata = {
  title: "Nova liderança",
};

export default async function NovaLiderancaPage() {
  const supabase = await createAuthClient();

  const [bairros, locais, tags] = await Promise.all([
    getBairros(supabase),
    getLocais(supabase),
    listarTags(supabase),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/liderancas"
        className="font-display tracking-eyebrow text-eyebrow text-ink-3 hover:text-ink-2"
      >
        ← Lideranças
      </Link>

      <h1 className="font-display tracking-display mt-3 text-section text-ink">
        Nova liderança
      </h1>
      <p className="mt-3 max-w-prose text-small text-ink-2">
        Não existe autocadastro de liderança. A coordenação cadastra uma a uma,
        e cada uma sai daqui com um link exclusivo — todo apoiador que entrar por
        ele fica registrado como dela.
      </p>

      <LiderancaForm
        acao={criarLideranca}
        modo="criar"
        bairros={bairros}
        locais={locais}
        tags={tags}
        urlBase={hostPublico()}
      />
    </div>
  );
}
