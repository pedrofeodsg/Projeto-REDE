import type { Metadata } from "next";
import Link from "next/link";

import { BotaoEnvio } from "@/components/admin/botao-envio";
import {
  DIGITAL,
  FALTAS_PARA_ALERTA,
  getAusencias,
  getDigitalDasLiderancas,
  listarPosts,
} from "@/lib/instagram/queries";
import { listarLiderancasComEstado, listarTemplates } from "@/lib/mensagens/queries";
import { createAuthClient } from "@/lib/supabase/auth";
import { hostPublico } from "@/lib/url";

export const metadata: Metadata = { title: "Ausências" };

export default async function AusenciasPage() {
  const supabase = await createAuthClient();

  const [ausentes, todas, posts, templates, liderancas] = await Promise.all([
    getAusencias(supabase),
    getDigitalDasLiderancas(supabase),
    listarPosts(supabase),
    listarTemplates(supabase, true),
    listarLiderancasComEstado(supabase),
  ]);

  const porId = new Map(liderancas.map((l) => [l.id, l]));
  const comJanela = todas.filter((l) => l.janela > 0);
  const contagem = { ativo: 0, irregular: 0, ausente: 0 };
  for (const l of comJanela) {
    if (l.estado_digital) contagem[l.estado_digital] += 1;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador rotulo="Posts cadastrados" valor={String(posts.length)} apoio="a janela olha os 6 últimos" />
        <Indicador
          rotulo="Ativo"
          valor={String(contagem.ativo)}
          apoio="comentou em 5 dos 6"
          cor={DIGITAL.ativo.cor}
        />
        <Indicador
          rotulo="Irregular"
          valor={String(contagem.irregular)}
          apoio="comentou em 2 a 4"
          cor={DIGITAL.irregular.cor}
        />
        <Indicador
          rotulo="Ausente"
          valor={String(contagem.ausente)}
          apoio="menos de 2 na janela"
          cor={DIGITAL.ausente.cor}
        />
      </section>

      <section
        className="overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--card-bg)" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="font-display tracking-card text-card text-ink">
            Quem faltou
          </h2>
          <p className="text-tiny text-ink-3">
            Faltou em {FALTAS_PARA_ALERTA} ou mais dos últimos 6 posts em que
            estava no roster
          </p>
        </div>

        {ausentes.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-body text-ink">
              {posts.length === 0
                ? "A medição começa no primeiro post."
                : "Ninguém acumulou faltas."}
            </p>
            <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
              {posts.length === 0 ? (
                <>
                  Cadastre um post em{" "}
                  <Link href="/instagram/posts" className="underline underline-offset-2">
                    Posts
                  </Link>{" "}
                  e importe o engajamento dele.
                </>
              ) : (
                "Faltar em um post não significa nada. Esta lista só acusa quem faltou em cinco dos últimos seis."
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {ausentes.map((l) => {
              const destino = porId.get(l.pessoa_id);
              return (
                <li
                  key={l.pessoa_id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/pessoas/${l.pessoa_id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {l.nome}
                    </Link>
                    <p className="font-data text-tiny text-ink-3">
                      {l.instagram_handle ? `@${l.instagram_handle}` : "sem @ cadastrado"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-right">
                      <span className="font-data text-small text-d-ausente">
                        {l.faltas} de {l.janela}
                      </span>
                      <span className="block text-tiny text-ink-3">sem comentar</span>
                    </p>

                    {destino && (
                      <BotaoEnvio
                        destino={destino}
                        templates={templates}
                        templatePadrao="cutucada"
                        urlBase={hostPublico()}
                        compacto
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className="overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--card-bg)" }}
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-display tracking-card text-card text-ink">
            Temperatura digital da rede
          </h2>
          <p className="text-tiny text-ink-3">
            Eixo independente — nunca somado à temperatura de cadastro
          </p>
        </div>

        {comJanela.length === 0 ? (
          <p className="px-5 py-8 text-center text-small text-ink-2">
            Nenhuma liderança tem janela ainda. Quem entrou depois do último post
            não está ausente: está sem janela.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Liderança</th>
                  <th className="font-display tracking-eyebrow px-2 py-2 text-eyebrow font-normal text-ink-3">@</th>
                  <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Presenças</th>
                  <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {comJanela.map((l) => (
                  <tr key={l.pessoa_id}>
                    <td className="px-5 py-2">
                      <Link href={`/pessoas/${l.pessoa_id}`} className="text-ink hover:underline">
                        {l.nome}
                      </Link>
                    </td>
                    <td className="font-data px-2 py-2 text-tiny text-ink-3">
                      {l.instagram_handle ? `@${l.instagram_handle}` : "—"}
                    </td>
                    <td className="font-data px-2 py-2 text-right text-ink">
                      {l.presencas}
                      <span className="text-ink-3">/{l.janela}</span>
                    </td>
                    <td className="px-5 py-2">
                      {l.estado_digital ? (
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="size-2 rounded-full"
                            style={{ background: DIGITAL[l.estado_digital].cor }}
                          />
                          <span className="text-ink-2">
                            {DIGITAL[l.estado_digital].rotulo}
                          </span>
                        </span>
                      ) : (
                        <span className="text-ink-3">sem janela</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  apoio,
  cor,
}: {
  rotulo: string;
  valor: string;
  apoio: string;
  cor?: string;
}) {
  return (
    <div
      className="rounded-lg border border-line px-5 py-4"
      style={{ background: "var(--card-bg)" }}
    >
      <p className="font-display flex items-center gap-2 text-eyebrow tracking-eyebrow text-ink-3">
        {cor && (
          <span aria-hidden className="size-2 rounded-full" style={{ background: cor }} />
        )}
        {rotulo}
      </p>
      <p className="font-data mt-2 text-kpi leading-none text-ink">{valor}</p>
      <p className="mt-2 text-tiny text-ink-3">{apoio}</p>
    </div>
  );
}
