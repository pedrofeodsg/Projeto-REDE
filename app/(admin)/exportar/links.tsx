"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  alternarRevogacao,
  gerarLink,
  type EstadoExportacao,
} from "@/lib/exportacao/actions";
import { PERFIL, type PerfilExportacao } from "@/lib/exportacao/perfis";

const INICIAL: EstadoExportacao = { erro: null };

const PERFIS: PerfilExportacao[] = ["candidato", "publico", "interno"];

export function GerarLink({ perfilAtual }: { perfilAtual: PerfilExportacao }) {
  const [estado, enviar, pendente] = useActionState(gerarLink, INICIAL);
  const [perfil, setPerfil] = useState<PerfilExportacao>(perfilAtual);

  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <h2 className="font-display tracking-card text-card text-ink">
        Gerar link
      </h2>

      <div className="mt-4 flex flex-col gap-2">
        {PERFIS.map((p) => (
          <label
            key={p}
            className="flex cursor-pointer flex-col rounded-md border border-line px-3 py-2.5 transition-colors has-[:checked]:border-line-3 has-[:checked]:bg-surface-3"
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="perfil-visual"
                value={p}
                checked={perfil === p}
                onChange={() => setPerfil(p)}
                className="size-3.5 accent-[var(--ink)]"
              />
              <span className="text-small text-ink">{PERFIL[p].rotulo}</span>
              {!PERFIL[p].compartilhavel && (
                <span className="font-display tracking-card ml-auto text-eyebrow text-ink-3">
                  não vira link
                </span>
              )}
            </span>
            <span className="mt-1 pl-5 text-tiny leading-relaxed text-ink-3">
              {PERFIL[p].descricao}
            </span>
          </label>
        ))}
      </div>

      <Link
        href={`/exportar?perfil=${perfil}`}
        className="font-display tracking-card mt-3 inline-block text-tiny text-ink-3 underline underline-offset-2 hover:text-ink"
      >
        Ver a prévia deste perfil →
      </Link>

      {PERFIL[perfil].compartilhavel ? (
        <form action={enviar} className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
          <input type="hidden" name="perfil" value={perfil} />

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Para quem
            </span>
            <Input
              name="rotulo"
              placeholder="ex.: candidato a federal"
              className="h-10 bg-surface-3"
            />
          </label>

          {estado.erro && (
            <p role="alert" className="text-small text-t-afastado">
              {estado.erro}
            </p>
          )}

          <Button
            type="submit"
            disabled={pendente}
            className="font-display tracking-card h-10 self-start px-5 text-tiny"
          >
            {pendente ? "Gerando…" : "Gerar link"}
          </Button>
        </form>
      ) : (
        <p className="mt-5 border-t border-line pt-4 text-tiny leading-relaxed text-ink-3">
          O perfil interno é o único que carrega telefone, e por isso não vira
          link. O que carrega contato não sai da organização.
        </p>
      )}
    </section>
  );
}

type LinkGerado = {
  id: string;
  perfil: PerfilExportacao;
  token: string;
  revogado: boolean;
  rotulo: string | null;
  gerado_em: string;
  visitas: number;
  visto_em: string | null;
};

export function ListaDeLinks({
  links,
  urlBase,
}: {
  links: LinkGerado[];
  urlBase: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-line"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          Links gerados
        </h2>
        <p className="font-data text-tiny text-ink-3">{links.length}</p>
      </div>

      {links.length === 0 ? (
        <p className="px-5 py-8 text-center text-small text-ink-2">
          Nenhum link ainda. Gere um acima quando o candidato pedir números.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {links.map((l) => (
            <LinhaLink key={l.id} link={l} urlBase={urlBase} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LinhaLink({ link, urlBase }: { link: LinkGerado; urlBase: string }) {
  const [pendente, iniciar] = useTransition();
  const [copiado, setCopiado] = useState(false);
  const endereco = `${urlBase}/r/${link.token}`;

  return (
    <li className={`px-5 py-3 transition-opacity ${pendente ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-small text-ink">
            {link.rotulo ?? PERFIL[link.perfil].rotulo}
            {link.revogado && (
              <span className="font-display tracking-card ml-2 text-eyebrow text-t-afastado">
                revogado
              </span>
            )}
          </p>
          <p className="font-data mt-0.5 truncate text-tiny text-ink-3">
            {endereco.replace(/^https?:\/\//, "")}
          </p>
          <p className="text-tiny text-ink-3">
            {new Date(link.gerado_em).toLocaleDateString("pt-BR")} ·{" "}
            {link.visitas === 0
              ? "nunca aberto"
              : `${link.visitas} ${link.visitas === 1 ? "abertura" : "aberturas"}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!link.revogado && (
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(endereco);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="font-display tracking-card h-8 rounded-full border border-line px-3 text-tiny text-ink-2 hover:text-ink"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          )}

          <button
            type="button"
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                await alternarRevogacao(link.id, !link.revogado);
              })
            }
            className="font-display tracking-card h-8 rounded-full border border-line px-3 text-tiny text-ink-3 hover:text-ink"
          >
            {link.revogado ? "Reativar" : "Revogar"}
          </button>
        </div>
      </div>
    </li>
  );
}
