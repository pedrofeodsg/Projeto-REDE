"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { promoverALideranca, type EstadoAcao } from "@/lib/relacionamento/actions";
import { gerarSlug } from "@/lib/pessoas/slug";
import type { LocalVotacao } from "@/types/database";

const INICIAL: EstadoAcao = { erro: null };

/**
 * Promoção de apoiador a liderança (RF-06).
 *
 * Muda o nível na mesma linha e gera o slug. Não migra registro entre tabelas
 * — é por isso que `pessoas` é única e autorreferente — então quem trouxe essa
 * pessoa continua levando o crédito por ela.
 */
export function PromoverALideranca({
  pessoaId,
  nome,
  locais,
  quemTrouxe,
}: {
  pessoaId: string;
  nome: string;
  locais: LocalVotacao[];
  quemTrouxe: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = promoverALideranca.bind(null, pessoaId);
  const [estado, enviar, pendente] = useActionState(acao, INICIAL);

  const ordenados = [...locais].sort((a, b) => b.eleitores - a.eleitores);

  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <h2 className="font-display tracking-card text-card text-ink">
        Promover a liderança
      </h2>
      <p className="mt-2 text-small text-ink-2">
        Quem chega trazendo gente por conta própria já é liderança na prática.
        Promover gera o link exclusivo e coloca a pessoa no termômetro.
      </p>

      {quemTrouxe && (
        <p className="mt-3 border-l-2 border-line-2 pl-3 text-tiny text-ink-3">
          {nome.split(/\s+/)[0]} continua creditada a <strong className="text-ink-2">{quemTrouxe}</strong>{" "}
          depois da promoção — o histórico de quem trouxe quem não se perde.
        </p>
      )}

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="font-display tracking-card mt-4 h-10 rounded-full border border-line-2 px-4 text-tiny text-ink hover:bg-surface-3"
        >
          Promover
        </button>
      ) : (
        <form action={enviar} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="local-ancora"
              className="font-display text-eyebrow tracking-eyebrow text-ink-3"
            >
              Colégio âncora
            </label>
            <select
              id="local-ancora"
              name="local_votacao_id"
              required
              defaultValue=""
              className="h-11 w-full rounded-md border border-input bg-surface-3 px-3 text-body text-ink"
            >
              <option value="">Onde ela vai atuar</option>
              {ordenados.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome} · {l.eleitores.toLocaleString("pt-BR")} eleitores
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="meta-promocao"
              className="font-display text-eyebrow tracking-eyebrow text-ink-3"
            >
              Meta
            </label>
            <Input
              id="meta-promocao"
              name="meta"
              type="number"
              min={0}
              defaultValue={10}
              className="h-11 w-28 bg-surface-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="instagram-promocao"
              className="font-display text-eyebrow tracking-eyebrow text-ink-3"
            >
              @ do Instagram
            </label>
            <Input
              id="instagram-promocao"
              name="instagram_handle"
              placeholder="opcional"
              className="h-11 bg-surface-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="linha-promocao"
              className="font-display text-eyebrow tracking-eyebrow text-ink-3"
            >
              Linha pessoal
            </label>
            <textarea
              id="linha-promocao"
              name="linha_pessoal"
              rows={2}
              placeholder="opcional — entra na mensagem de boas-vindas"
              className="w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-body text-ink placeholder:text-ink-3"
            />
          </div>

          <p className="font-data text-tiny text-ink-3">
            O link será /{gerarSlug(nome)}
          </p>

          {estado.erro && (
            <p role="alert" className="text-small text-t-afastado">
              {estado.erro}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={pendente}
              className="font-display tracking-card h-10 px-5 text-tiny"
            >
              {pendente ? "Promovendo…" : "Confirmar promoção"}
            </Button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="font-display tracking-card h-10 rounded-full border border-line px-4 text-tiny text-ink-3 hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
