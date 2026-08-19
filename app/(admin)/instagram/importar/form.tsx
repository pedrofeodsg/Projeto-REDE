"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  importarEngajamento,
  type EstadoImportacao,
} from "@/lib/instagram/actions";
import { extrairHandles } from "@/lib/instagram/importar";
import type { PostComResumo } from "@/lib/instagram/queries";

const INICIAL: EstadoImportacao = { erro: null };

const TIPOS = [
  { valor: "comentario", rotulo: "Comentário", nota: "o sinal que conta para a temperatura" },
  { valor: "curtida", rotulo: "Curtida", nota: "piso, não entra no cálculo" },
  { valor: "story_mention", rotulo: "Menção em story", nota: "compartilhamento rastreável" },
];

export function FormImportacao({ posts }: { posts: PostComResumo[] }) {
  const [estado, enviar, pendente] = useActionState(importarEngajamento, INICIAL);
  const [lista, setLista] = useState("");

  // Prévia local, antes de qualquer ida ao servidor.
  const previa = extrairHandles(lista);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <form
        action={enviar}
        className="rounded-lg border border-line p-5"
        style={{ background: "var(--card-bg)" }}
      >
        <h2 className="font-display tracking-card text-card text-ink">
          Importar engajamento
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Post
            </span>
            <select
              name="post_id"
              required
              defaultValue={posts[0]?.id}
              className="h-11 w-full rounded-md border border-input bg-surface-3 px-3 text-body text-ink"
            >
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {new Date(p.publicado_em).toLocaleDateString("pt-BR")} ·{" "}
                  {p.legenda?.slice(0, 40) ??
                    p.url.replace(/^https?:\/\/(www\.)?instagram\.com\//, "")}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Tipo de ação
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {TIPOS.map((t, i) => (
                <label
                  key={t.valor}
                  className="flex cursor-pointer items-baseline gap-2 rounded-md px-2 py-1.5 has-[:checked]:bg-surface-3"
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={t.valor}
                    defaultChecked={i === 0}
                    className="size-3.5 accent-[var(--ink)]"
                  />
                  <span className="text-small text-ink">{t.rotulo}</span>
                  <span className="text-tiny text-ink-3">{t.nota}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Cole a lista
            </span>
            <textarea
              name="lista"
              rows={10}
              value={lista}
              onChange={(e) => setLista(e.target.value)}
              placeholder={"@joao.silva\n@maria_c\n@ana.paula\n\nou cole o CSV inteiro"}
              className="font-data w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-small text-ink placeholder:text-ink-3"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Ou suba um arquivo
            </span>
            <input
              type="file"
              name="arquivo"
              accept=".csv,.txt,text/csv,text/plain"
              className="text-small text-ink-2 file:mr-3 file:rounded-full file:border file:border-line-2 file:bg-transparent file:px-3 file:py-1.5 file:text-tiny file:text-ink"
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
            {pendente ? "Importando…" : "Importar"}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {estado.resumo && (
          <section
            className="rounded-lg border border-line-2 p-5"
            style={{ background: "var(--card-bg)" }}
          >
            <h2 className="font-display tracking-card text-card text-ink">
              Resultado
            </h2>
            <dl className="mt-4 flex flex-col gap-2">
              <Numero rotulo="Lidos" valor={estado.resumo.lidos} />
              <Numero rotulo="Gravados" valor={estado.resumo.gravados} />
              <Numero rotulo="Casados com a base" valor={estado.resumo.casados} />
              <Numero rotulo="Sem vínculo" valor={estado.resumo.semVinculo} />
              {estado.resumo.repetidos > 0 && (
                <Numero rotulo="Já estavam gravados" valor={estado.resumo.repetidos} />
              )}
            </dl>
            {estado.resumo.semVinculo > 0 && (
              <p className="mt-4 text-tiny text-ink-3">
                Os sem vínculo não são erro: é gente engajada que a campanha
                ainda não tem cadastrada.{" "}
                <Link href="/instagram/vincular" className="underline underline-offset-2">
                  Ver a fila
                </Link>
              </p>
            )}
          </section>
        )}

        <section
          className="rounded-lg border border-line p-5"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display tracking-card text-card text-ink">
              Prévia
            </h2>
            <p className="font-data text-tiny text-ink-3">
              {previa.length} {previa.length === 1 ? "@" : "@"} reconhecidos
            </p>
          </div>

          {previa.length === 0 ? (
            <p className="mt-3 text-small text-ink-2">
              Aceita um @ por linha, com ou sem arroba, e também link do perfil
              ou CSV com cabeçalho. O @ repetido entra uma vez só.
            </p>
          ) : (
            <ul className="mt-3 max-h-80 divide-y divide-[var(--line)] overflow-auto">
              {previa.slice(0, 60).map((h) => (
                <li key={h.cru} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="font-data truncate text-tiny text-ink">
                    {h.normalizado ?? h.cru}
                  </span>
                  {!h.normalizado && (
                    <span className="shrink-0 text-tiny text-t-afastado">
                      não parece um @
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-tiny text-ink-3">
            O texto original de cada linha é gravado como veio e nunca é
            reescrito. A normalização serve só para tentar o casamento.
          </p>
        </section>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-small text-ink-2">{rotulo}</dt>
      <dd className="font-data text-small text-ink">{valor}</dd>
    </div>
  );
}
