"use client";

import Link from "next/link";
import { useTransition } from "react";

import { ativarLideranca, recusarLideranca } from "./actions";

export type Pendente = {
  id: string;
  nome: string;
  apelido: string | null;
  telefone: string;
  slug: string | null;
  bairro_nome: string | null;
  local_nome: string | null;
};

/**
 * Fila de quem se cadastrou sozinho e espera aval.
 *
 * Fica no topo da lista, e não escondida atrás de um filtro, porque enquanto
 * a pessoa estiver aqui o link dela devolve 404 — e ela já pode estar
 * esperando do outro lado.
 */
export function Pendentes({
  pendentes,
  host,
}: {
  pendentes: Pendente[];
  host: string;
}) {
  if (pendentes.length === 0) return null;

  return (
    <section
      className="mt-6 overflow-hidden rounded-lg border border-acento/30"
      style={{ background: "var(--acento-suave)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
        <h2 className="font-display tracking-card text-card text-acento">
          {pendentes.length === 1
            ? "1 pessoa se cadastrou e espera seu aval"
            : `${pendentes.length} pessoas se cadastraram e esperam seu aval`}
        </h2>
        <p className="text-tiny text-ink-2">
          O link exclusivo delas só abre depois que você ativa
        </p>
      </div>

      <ul className="divide-y divide-[var(--line)] border-t border-line bg-surface">
        {pendentes.map((p) => (
          <LinhaPendente key={p.id} pendente={p} host={host} />
        ))}
      </ul>
    </section>
  );
}

function LinhaPendente({ pendente, host }: { pendente: Pendente; host: string }) {
  const [pendendo, iniciar] = useTransition();

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-opacity ${
        pendendo ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <Link
          href={`/pessoas/${pendente.id}`}
          className="font-medium text-ink hover:underline"
        >
          {pendente.nome}
          {pendente.apelido ? (
            <span className="text-ink-2"> · {pendente.apelido}</span>
          ) : null}
        </Link>
        <p className="text-tiny text-ink-3">
          {pendente.bairro_nome ? `mora em ${pendente.bairro_nome}` : "sem bairro"}
          {pendente.local_nome ? ` · vota em ${pendente.local_nome}` : ""}
        </p>
        {pendente.slug && (
          <p className="font-data text-tiny text-ink-3">
            {host}/{pendente.slug}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={pendendo}
          onClick={() => iniciar(async () => { await ativarLideranca(pendente.id); })}
          className="font-display tracking-card h-9 rounded-full bg-primary px-4 text-tiny text-primary-foreground disabled:opacity-50"
        >
          Ativar
        </button>
        <button
          type="button"
          disabled={pendendo}
          onClick={() => {
            if (!confirm(`${pendente.nome} deixa de ser liderança e vira apoiador. O link dela é descartado. Confirma?`)) return;
            iniciar(async () => { await recusarLideranca(pendente.id); });
          }}
          className="font-display tracking-card h-9 rounded-full border border-line px-3 text-tiny text-ink-2 hover:text-ink disabled:opacity-50"
        >
          Não é liderança
        </button>
      </div>
    </li>
  );
}
