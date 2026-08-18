import type { Metadata } from "next";
import Link from "next/link";

import { listarLiderancas, listarTags } from "@/lib/pessoas/queries";
import { formatarTelefone } from "@/lib/pessoas/telefone";
import { createAuthClient } from "@/lib/supabase/auth";
import { REGIAO_LABEL, getBairros } from "@/lib/territorio";
import { hostPublico } from "@/lib/url";
import type { MacroRegiao } from "@/types/database";

import { Filtros } from "./filtros";

export const metadata: Metadata = {
  title: "Lideranças",
};

const REGIOES: MacroRegiao[] = ["R1", "R2", "R3"];

function ehRegiao(v: string | undefined): v is MacroRegiao {
  return v === "R1" || v === "R2" || v === "R3";
}

export default async function LiderancasPage(props: PageProps<"/liderancas">) {
  const params = await props.searchParams;
  const primeiro = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const busca = primeiro(params.busca) ?? "";
  const bairroId = primeiro(params.bairro) ?? "";
  const regiaoParam = primeiro(params.regiao);
  const tagId = primeiro(params.tag) ?? "";

  const supabase = await createAuthClient();

  const [bairros, tags, liderancas] = await Promise.all([
    getBairros(supabase),
    listarTags(supabase),
    listarLiderancas(supabase, {
      busca,
      bairroId: bairroId || undefined,
      regiao: ehRegiao(regiaoParam) ? regiaoParam : undefined,
      tagId: tagId || undefined,
    }),
  ]);

  const host = hostPublico();
  const filtrando = Boolean(busca || bairroId || regiaoParam || tagId);

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            Rede · {liderancas.length}{" "}
            {liderancas.length === 1 ? "liderança" : "lideranças"}
            {filtrando ? " no filtro" : ""}
          </p>
          <h1 className="font-display tracking-display mt-2 text-section text-ink">
            Lideranças
          </h1>
        </div>

        <Link
          href="/liderancas/nova"
          className="font-display tracking-card inline-flex h-11 items-center rounded-full bg-primary px-5 text-card text-primary-foreground transition-opacity duration-[var(--dur-micro)] hover:opacity-90"
        >
          Nova liderança
        </Link>
      </header>

      <Filtros
        bairros={bairros}
        tags={tags}
        regioes={REGIOES.map((r) => ({ codigo: r, nome: REGIAO_LABEL[r] }))}
        valores={{ busca, bairroId, regiao: regiaoParam ?? "", tagId }}
      />

      {liderancas.length === 0 ? (
        <div
          className="mt-4 rounded-lg border border-line px-6 py-12 text-center"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="text-body text-ink">
            {filtrando
              ? "Nenhuma liderança nesse recorte."
              : "A rede começa aqui."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
            {filtrando
              ? "Tire um filtro para ver mais."
              : "Cadastre a primeira liderança e o link de captação dela sai pronto para o WhatsApp."}
          </p>
          {!filtrando && (
            <Link
              href="/liderancas/nova"
              className="font-display tracking-card mt-6 inline-flex h-11 items-center rounded-full bg-primary px-5 text-card text-primary-foreground"
            >
              Cadastrar a primeira
            </Link>
          )}
        </div>
      ) : (
        <div
          className="mt-4 overflow-hidden rounded-lg border border-line"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Liderança</Th>
                  <Th>Colégio âncora</Th>
                  <Th>R</Th>
                  <Th>Tags</Th>
                  <Th className="text-right">Meta</Th>
                  <Th>Link</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {liderancas.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="px-5 py-3">
                      <Link
                        href={`/liderancas/${l.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {l.nome}
                      </Link>
                      <p className="font-data text-tiny text-ink-3">
                        {formatarTelefone(l.telefone)}
                        {l.instagram_handle ? ` · @${l.instagram_handle}` : ""}
                      </p>
                      {!l.ativo && (
                        <p className="font-display tracking-eyebrow mt-1 text-eyebrow text-ink-3">
                          Inativa
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-3 text-ink-2">
                      {l.local?.nome ?? (
                        <span className="text-t-afastado">sem colégio âncora</span>
                      )}
                    </td>
                    <td className="font-data px-2 py-3 text-tiny text-ink-3">
                      {l.local?.regiao ?? "—"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {l.tags.map(
                          (t) =>
                            t.tag && (
                              <span
                                key={t.tag.id}
                                className="font-display tracking-card rounded-full border border-line px-2 py-0.5 text-eyebrow text-ink-3"
                              >
                                {t.tag.nome}
                              </span>
                            ),
                        )}
                      </div>
                    </td>
                    <td className="font-data px-2 py-3 text-right text-ink-2">
                      {l.meta}
                    </td>
                    <td className="px-5 py-3">
                      {l.slug ? (
                        <span className="font-data text-tiny text-ink-2">
                          {host}/{l.slug}
                        </span>
                      ) : (
                        <span className="text-tiny text-t-afastado">sem link</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3 first:px-5 [&:not(:first-child):not(:last-child)]:px-2 ${className}`}
    >
      {children}
    </th>
  );
}
