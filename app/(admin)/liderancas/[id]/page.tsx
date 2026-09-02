import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { atualizarLideranca } from "@/app/(admin)/liderancas/actions";
import { LiderancaForm } from "@/app/(admin)/liderancas/lideranca-form";
import { BotaoEnvio } from "@/components/admin/botao-envio";
import { listarTemplates } from "@/lib/mensagens/queries";
import { getEstadoDaLideranca } from "@/lib/relacionamento/queries";
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

  const [bairros, locais, tags, indicados, estado, templates] = await Promise.all([
    getBairros(supabase),
    getLocais(supabase),
    listarTags(supabase),
    contarIndicados(supabase, id),
    getEstadoDaLideranca(supabase, id),
    listarTemplates(supabase, true),
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

      {/*
        O momento de mandar a mensagem é AGORA, logo depois de cadastrar. Este
        bloco existe porque o botão estava em quatro telas e faltava justamente
        na única onde a mão do operador já está.
      */}
      {lideranca.ativo && lideranca.slug && estado && (
        <section
          className="mt-5 rounded-lg border border-line p-5"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display tracking-card text-card text-ink">
                {acabouDeCriar ? "Mande o link agora" : "Mensagem"}
              </h2>
              <p className="mt-1.5 max-w-prose text-small text-ink-2">
                {estado.enviado_em === null
                  ? "Esta liderança ainda não recebeu o link. O WhatsApp abre com a mensagem pronta; você revisa e envia."
                  : `Link enviado em ${new Date(estado.enviado_em).toLocaleDateString("pt-BR")}. Os dias de inatividade contam a partir daí.`}
              </p>
              <p className="font-data mt-2 text-tiny text-ink-3">
                {hostPublico()}/{lideranca.slug}
              </p>
            </div>

            <BotaoEnvio
              destino={estado}
              templates={templates}
              urlBase={hostPublico()}
              templatePadrao={estado.enviado_em === null ? "boas_vindas" : "cutucada"}
            />
          </div>
        </section>
      )}

      {acabouDeCriar && !lideranca.ativo && (
        <p className="mt-4 border-l-2 border-t-afastado pl-3 text-small text-ink-2">
          Esta liderança está inativa, então o link dela ainda não abre. Ative-a
          para poder enviar.
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
