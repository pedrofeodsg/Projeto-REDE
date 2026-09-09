import type { Metadata } from "next";
import Link from "next/link";

import {
  FAMILIAS_DE_LINK,
  LINKS_FIXOS,
  enderecoCompleto,
  enderecoParaExibir,
} from "@/lib/links/publicos";
import { createAuthClient } from "@/lib/supabase/auth";
import { hostPublico, urlPublicaBase } from "@/lib/url";

import { CartaoDeLink } from "./cartao";

export const metadata: Metadata = { title: "Links" };

export default async function LinksPage() {
  const supabase = await createAuthClient();

  // Quantos endereços de cada família estão de pé agora. Liderança sem slug ou
  // inativa não tem página que abra; exportação revogada devolve 404.
  const [{ count: paginas }, { count: relatorios }] = await Promise.all([
    supabase
      .from("pessoas")
      .select("id", { count: "exact", head: true })
      .eq("nivel", "lideranca")
      .eq("ativo", true)
      .not("slug", "is", null),
    supabase
      .from("exportacoes")
      .select("id", { count: "exact", head: true })
      .eq("revogado", false)
      .neq("perfil", "interno"),
  ]);

  const contagens = { liderancas: paginas ?? 0, relatorios: relatorios ?? 0 };

  const base = urlPublicaBase();
  const host = hostPublico();

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Superfície pública · {LINKS_FIXOS.length} endereços fixos
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Links
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          Tudo o que abre sem login. Cada endereço aqui é uma porta para fora —
          e porta que a coordenação esquece que existe é porta que ninguém
          confere. O resto do sistema, incluindo este painel, exige chave de
          acesso.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Para divulgar
        </h2>
        <div className="mt-3 grid gap-4">
          {LINKS_FIXOS.map((link) => (
            <CartaoDeLink
              key={link.id}
              link={link}
              endereco={enderecoCompleto(base, link.caminho)}
              exibicao={enderecoParaExibir(host, link.caminho)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Um por pessoa
        </h2>
        <p className="mt-2 max-w-prose text-small text-ink-2">
          Estes não cabem numa lista porque não são um endereço, e sim um para
          cada. Ficam onde se criam.
        </p>

        <div className="mt-3 grid gap-3">
          {FAMILIAS_DE_LINK.map((f) => {
            const quantos = contagens[f.contagem];
            return (
              <article
                key={f.id}
                className="rounded-lg border border-line p-5"
                style={{ background: "var(--card-bg)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-display tracking-card text-card text-ink">
                    {f.rotulo}
                  </h3>
                  <span className="font-data shrink-0 text-small text-ink-2">
                    {quantos} {quantos === 1 ? f.unidade[0] : f.unidade[1]}
                  </span>
                </div>

                <p className="mt-2 max-w-prose text-small leading-relaxed text-ink-2">
                  {f.resumo}
                </p>

                <p className="font-data mt-3 text-tiny text-ink-3">
                  {enderecoParaExibir(host, f.padrao)}
                </p>

                <Link
                  href={f.ondeHref}
                  className="font-display tracking-card mt-3 inline-block text-tiny text-ink-2 underline underline-offset-2 hover:text-ink"
                >
                  Abrir {f.onde} →
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-8 max-w-prose border-t border-line pt-4 text-tiny leading-relaxed text-ink-3">
        Só a página de molduras convida buscador. Todas as outras saem com
        instrução de não indexar, porque circulam por WhatsApp e não por
        pesquisa — e uma delas leva a dado de pessoa.
      </p>
    </div>
  );
}
