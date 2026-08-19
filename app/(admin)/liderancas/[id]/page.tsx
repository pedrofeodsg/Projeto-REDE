import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { atualizarLideranca } from "@/app/(admin)/liderancas/actions";
import { LiderancaForm } from "@/app/(admin)/liderancas/lideranca-form";
import {
  contarIndicados,
  getLideranca,
  listarTags,
} from "@/lib/pessoas/queries";
import { nomeCompleto } from "@/lib/pessoas/nome";
import { createAuthClient } from "@/lib/supabase/auth";
import { getBairros, getLocais } from "@/lib/territorio";
import { hostPublico } from "@/lib/url";

export const metadata: Metadata = {
  title: "Liderança",
};

export default async function LiderancaPage(props: PageProps<"/liderancas/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const acabouDeCriar = params.criada === "1";

  const supabase = await createAuthClient();
  const lideranca = await getLideranca(supabase, id);
  if (!lideranca) notFound();

  const [bairros, locais, tags, indicados] = await Promise.all([
    getBairros(supabase),
    getLocais(supabase),
    listarTags(supabase),
    contarIndicados(supabase, id),
  ]);

  const atualizar = atualizarLideranca.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/liderancas"
        className="font-display tracking-eyebrow text-eyebrow text-ink-3 hover:text-ink-2"
      >
        ← Lideranças
      </Link>

      <h1 className="font-display tracking-display mt-3 text-section text-ink">
        {nomeCompleto(lideranca.nome, lideranca.apelido)}
      </h1>

      {acabouDeCriar && (
        <p className="mt-3 border-l-2 border-line-3 pl-3 text-small text-ink-2">
          Liderança cadastrada. O link de captação já existe — o envio pelo
          WhatsApp entra no Bloco 3C, junto com o registro de quem já recebeu.
        </p>
      )}

      <LiderancaForm
        acao={atualizar}
        modo="editar"
        bairros={bairros}
        locais={locais}
        tags={tags}
        slugTravado={indicados > 0}
        cadastrosRecebidos={indicados}
        urlBase={hostPublico()}
        iniciais={{
          nome: lideranca.nome,
          apelido: lideranca.apelido ?? "",
          telefone: lideranca.telefone,
          bairroId: lideranca.bairro_moradia_id ?? "",
          localId: lideranca.local_votacao_id ?? "",
          handle: lideranca.instagram_handle ?? "",
          meta: lideranca.meta,
          linhaPessoal: lideranca.linha_pessoal ?? "",
          slug: lideranca.slug ?? "",
          tags: lideranca.tags.map((t) => t.tag?.id).filter((t): t is string => Boolean(t)),
          ativo: lideranca.ativo,
        }}
      />
    </div>
  );
}
