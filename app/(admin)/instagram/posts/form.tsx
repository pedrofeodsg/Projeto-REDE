"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cadastrarPost, excluirPost, type EstadoPost } from "@/lib/instagram/actions";
import type { PostComResumo } from "@/lib/instagram/queries";

const INICIAL: EstadoPost = { erro: null };

export function FormPost() {
  const [estado, enviar, pendente] = useActionState(cadastrarPost, INICIAL);
  const [chave, setChave] = useState(0);

  if (estado.ok) queueMicrotask(() => setChave((k) => k + 1));

  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <h2 className="font-display tracking-card text-card text-ink">
        Cadastrar post
      </h2>
      <p className="mt-2 text-small text-ink-2">
        Ao salvar, o sistema congela o roster: grava quem era liderança ativa
        <strong className="text-ink"> naquele instante</strong>. Quem entrar na
        rede depois nunca aparecerá como ausente neste post.
      </p>

      <form key={chave} action={enviar} className="mt-4 flex flex-col gap-3">
        <Campo rotulo="URL do post">
          <Input
            name="url"
            type="url"
            required
            placeholder="https://www.instagram.com/p/..."
            className="h-11 bg-surface-3"
          />
        </Campo>

        <Campo rotulo="Publicado em">
          <Input
            name="publicado_em"
            type="datetime-local"
            defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
            className="h-11 bg-surface-3"
          />
        </Campo>

        <Campo rotulo="Legenda">
          <textarea
            name="legenda"
            rows={2}
            placeholder="opcional — ajuda a reconhecer o post na lista"
            className="w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-body text-ink placeholder:text-ink-3"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Curtidas">
            <Input name="curtidas_total" type="number" min={0} className="h-11 bg-surface-3" />
          </Campo>
          <Campo rotulo="Comentários">
            <Input name="comentarios_total" type="number" min={0} className="h-11 bg-surface-3" />
          </Campo>
        </div>

        <p className="text-tiny text-ink-3">
          A contagem de curtidas entra à mão porque a lista de quem curtiu não é
          exposta por nenhuma via oficial. Por isso o comentário é a exigência
          da rede, e a curtida é piso.
        </p>

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
          {pendente ? "Salvando…" : "Cadastrar e congelar roster"}
        </Button>
      </form>
    </section>
  );
}

export function LinhaPost({ post }: { post: PostComResumo }) {
  const [pendente, iniciar] = useTransition();
  const cobertura = post.no_roster > 0 ? (100 * post.comentaram) / post.no_roster : 0;

  return (
    <li className={`px-5 py-3.5 transition-opacity ${pendente ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-data text-small text-ink hover:underline"
          >
            {post.url.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").slice(0, 40)}
          </a>
          <p className="text-tiny text-ink-3">
            {new Date(post.publicado_em).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {post.curtidas_total !== null ? ` · ${post.curtidas_total} curtidas` : ""}
            {post.comentarios_total !== null ? ` · ${post.comentarios_total} comentários` : ""}
          </p>
          {post.legenda && (
            <p className="mt-1 line-clamp-2 max-w-prose text-tiny text-ink-3">
              {post.legenda}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="font-data text-small text-ink">
              {post.comentaram}
              <span className="text-ink-3">/{post.no_roster}</span>
            </p>
            <p className="font-data text-tiny text-ink-3">
              {post.no_roster > 0
                ? `${cobertura.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% da rede`
                : "roster vazio"}
            </p>
          </div>

          <button
            type="button"
            disabled={pendente}
            onClick={() => {
              if (!confirm("Excluir este post e todo o engajamento importado nele?")) return;
              iniciar(async () => {
                await excluirPost(post.id);
              });
            }}
            className="font-display tracking-card h-8 rounded-full px-3 text-tiny text-ink-3 hover:text-t-afastado"
          >
            Excluir
          </button>
        </div>
      </div>
    </li>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-eyebrow tracking-eyebrow text-ink-3">
        {rotulo}
      </span>
      {children}
    </label>
  );
}
