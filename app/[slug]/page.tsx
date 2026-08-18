import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLiderancaPorSlug, getTerritorioPublico } from "@/lib/pessoas/publico";
import { linkDaLideranca } from "@/lib/url";

import { confirmarApoio } from "./actions";
import { FormularioApoio } from "./formulario";

export async function generateMetadata(
  props: PageProps<"/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const lideranca = await getLiderancaPorSlug(slug);

  if (!lideranca) {
    return { title: "Convite não encontrado" };
  }

  const titulo = `Convite de ${lideranca.nome}`;
  const descricao =
    "São menos de 50 dias até 4 de outubro. Confirme seu apoio em 30 segundos.";

  // RF-12: link sem preview no WhatsApp parece golpe e derruba o clique.
  return {
    title: titulo,
    description: descricao,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: linkDaLideranca(slug),
      siteName: "Projeto REDE",
      title: titulo,
      description: descricao,
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao },
  };
}

export default async function ConvitePage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;

  const lideranca = await getLiderancaPorSlug(slug);
  if (!lideranca) notFound();

  const territorio = await getTerritorioPublico();
  const acao = confirmarApoio.bind(null, slug);

  const iniciais = lideranca.nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  return (
    <>
      {/* Cor da campanha, lugar 1 de 4: a barra do topo. */}
      <div className="h-1.5 w-full bg-[var(--campanha)]" />

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-16 pt-8">
        <header className="flex items-center gap-3">
          {/* Cor da campanha, lugar 2 de 4: o avatar do convite. */}
          <span
            aria-hidden
            className="font-display flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--campanha)] text-[15px] tracking-[0.06em] text-[var(--campanha-ink)]"
          >
            {iniciais}
          </span>
          <div>
            <p className="font-display text-eyebrow tracking-eyebrow text-paper-ink-2">
              Convite de
            </p>
            <p className="text-[17px] font-medium leading-tight text-paper-ink">
              {lideranca.nome}
            </p>
          </div>
        </header>

        <h1 className="mt-7 text-[26px] font-medium leading-[1.2] text-paper-ink">
          Some com a gente.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-paper-ink-2">
          São quatro campos e menos de um minuto. Seu cadastro fica registrado
          como indicação de {lideranca.nome.split(/\s+/)[0]}.
        </p>

        <FormularioApoio
          acao={acao}
          bairros={territorio.bairros}
          locais={territorio.locais}
        />

        <p className="mt-8 text-[12px] leading-relaxed text-paper-ink-2">
          Usamos seus dados apenas para o contato da campanha. Não repassamos a
          terceiros e não enviamos mensagem em massa.
        </p>
      </main>
    </>
  );
}
