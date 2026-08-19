import type { Metadata } from "next";
import Link from "next/link";

import { formatarTelefone } from "@/lib/pessoas/telefone";
import { listarConflitos } from "@/lib/relacionamento/queries";
import { createAuthClient } from "@/lib/supabase/auth";

import { Arbitragem } from "./arbitragem";

export const metadata: Metadata = { title: "Conflitos" };

export default async function ConflitosPage(props: PageProps<"/conflitos">) {
  const params = await props.searchParams;
  const verTodos = params.todos === "1";

  const supabase = await createAuthClient();
  const conflitos = await listarConflitos(supabase, verTodos);

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Arbitragem privada · {conflitos.length}{" "}
          {conflitos.length === 1 ? "caso" : "casos"}
          {verTodos ? "" : " em aberto"}
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Conflitos de cadastro
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          Quando alguém tenta cadastrar um telefone que já está na base, o
          sistema não cria registro novo e não muda a atribuição existente: o
          primeiro cadastro prevalece e a tentativa cai aqui. A pessoa que
          preencheu viu apenas um agradecimento — ela não sabe que houve
          conflito, e as duas lideranças nunca descobrem que disputaram o mesmo
          contato.
        </p>
      </header>

      <div className="mt-6 flex gap-2">
        <Aba href="/conflitos" ativa={!verTodos}>
          Em aberto
        </Aba>
        <Aba href="/conflitos?todos=1" ativa={verTodos}>
          Todos
        </Aba>
      </div>

      {conflitos.length === 0 ? (
        <div
          className="mt-4 rounded-lg border border-line px-6 py-12 text-center"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="text-body text-ink">Nada para arbitrar.</p>
          <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
            Nenhuma liderança tentou cadastrar um contato que já pertencia a
            outra.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {conflitos.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-line p-5"
              style={{ background: "var(--card-bg)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-data text-small text-ink">
                  {formatarTelefone(c.telefone)}
                </p>
                <p className="font-data text-tiny text-ink-3">
                  {new Date(c.criado_em).toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
                    Já estava na base como
                  </p>
                  {c.existente ? (
                    <Link
                      href={`/pessoas/${c.existente.id}`}
                      className="mt-1 block text-small text-ink hover:underline"
                    >
                      {c.existente.nome}
                    </Link>
                  ) : (
                    <p className="mt-1 text-small text-ink-3">registro removido</p>
                  )}
                </div>

                <div>
                  <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
                    Tentou cadastrar como
                  </p>
                  <p className="mt-1 text-small text-ink">{c.nome_tentado}</p>
                  {c.tentou && (
                    <p className="text-tiny text-ink-3">
                      pelo link de{" "}
                      <Link
                        href={`/pessoas/${c.tentou.id}`}
                        className="hover:underline"
                      >
                        {c.tentou.nome}
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {c.resolvido ? (
                <p className="mt-4 font-display text-eyebrow tracking-eyebrow text-ink-3">
                  Arbitrado
                </p>
              ) : (
                <Arbitragem
                  conflitoId={c.id}
                  nomeTentou={c.tentou?.nome ?? null}
                  podeTransferir={Boolean(c.existente && c.tentou)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Aba({
  href,
  ativa,
  children,
}: {
  href: string;
  ativa: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`font-display tracking-card rounded-full px-3 py-1.5 text-tiny transition-colors duration-[var(--dur-micro)] ${
        ativa ? "bg-surface-3 text-ink" : "text-ink-3 hover:text-ink-2"
      }`}
    >
      {children}
    </Link>
  );
}
