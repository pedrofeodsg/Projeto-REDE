import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { COOKIE_OBRIGADO, getLiderancaPorSlug } from "@/lib/pessoas/publico";
import { linkDaLideranca } from "@/lib/url";

import { BotaoCompartilhar } from "./compartilhar";

export const metadata: Metadata = {
  title: "Obrigado",
  robots: { index: false, follow: false },
};

export default async function ObrigadoPage(props: PageProps<"/[slug]/obrigado">) {
  const { slug } = await props.params;

  const lideranca = await getLiderancaPorSlug(slug);
  if (!lideranca) notFound();

  const bruto = (await cookies()).get(COOKIE_OBRIGADO)?.value;
  if (!bruto) redirect(`/${slug}`);

  let nome = "";
  let jaEstava = false;
  try {
    const dados = JSON.parse(bruto) as { n?: string; d?: boolean };
    nome = dados.n ?? "";
    jaEstava = dados.d === true;
  } catch {
    redirect(`/${slug}`);
  }

  const link = linkDaLideranca(slug);
  const textoCompartilhar = `Estou apoiando e queria te chamar junto. É rápido, são quatro campos:\n${link}`;

  return (
    <>
      <div className="h-1.5 w-full bg-[var(--campanha)]" />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-16 pt-12">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-[var(--campanha)] text-[26px] text-[var(--campanha-ink)]"
        >
          ✓
        </span>

        <h1 className="mt-6 text-[28px] font-medium leading-[1.15] text-paper-ink">
          {nome ? `Valeu, ${nome}!` : "Valeu!"}
        </h1>

        {/*
          Duplicidade nunca vira erro na tela nem revela a qual liderança a
          pessoa pertence: quem preencheu é o apoiador, e ele não tem culpa
          nenhuma de o número já estar na base.
        */}
        <p className="mt-3 text-[16px] leading-relaxed text-paper-ink-2">
          {jaEstava
            ? "Esse contato já faz parte da rede. Obrigado por confirmar!"
            : `Seu apoio está registrado como indicação de ${lideranca.nome}.`}
        </p>

        <div className="mt-9 flex flex-col gap-3">
          <BotaoCompartilhar
            link={link}
            texto={textoCompartilhar}
            titulo={`Convite de ${lideranca.nome}`}
          />

          <Link
            href={`/${slug}`}
            className="font-display flex h-14 w-full items-center justify-center rounded-full border border-paper-line bg-paper-2 text-[15px] tracking-[0.1em] text-paper-ink"
          >
            Cadastrar mais um
          </Link>
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-paper-ink-2">
          Chamar mais gente é o que faz a diferença. Cada pessoa que entrar pelo
          seu compartilhamento continua sendo creditada a{" "}
          {lideranca.nome.split(/\s+/)[0]}.
        </p>
      </main>
    </>
  );
}
