import type { Metadata } from "next";
import Link from "next/link";

import { BotaoEnvio } from "@/components/admin/botao-envio";
import {
  getResumoDaRede,
  listarLiderancasComEstado,
  listarTemplates,
} from "@/lib/mensagens/queries";
import { createAuthClient } from "@/lib/supabase/auth";
import { ORDEM_TEMPERATURA, TEMPERATURA } from "@/lib/temperatura";
import { hostPublico } from "@/lib/url";
import type { LiderancaNaLista } from "@/types/database";

export const metadata: Metadata = { title: "Painel" };

const num = (v: number) => v.toLocaleString("pt-BR");
const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export default async function PainelPage() {
  const supabase = await createAuthClient();

  const [liderancas, templates] = await Promise.all([
    listarLiderancasComEstado(supabase),
    listarTemplates(supabase, true),
  ]);

  const resumo = await getResumoDaRede(supabase, liderancas);

  const cobranca = liderancas
    .filter((l) => l.estado === "afastado")
    .sort((a, b) => (b.dias_parada ?? 0) - (a.dias_parada ?? 0));

  const metaAgregada = resumo.metaAgregada || 700;
  const percentualMeta = (100 * resumo.totalCadastrados) / metaAgregada;

  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Visão geral
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Painel
        </h1>
      </header>

      {/* RF-17 · faixa de indicadores */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Cadastrados"
          valor={num(resumo.totalCadastrados)}
          apoio={`${pct(percentualMeta)} da meta de ${num(metaAgregada)}`}
        />
        <Indicador
          rotulo="Lideranças ativas"
          valor={`${resumo.liderancasAtivas}/${resumo.liderancasTotal}`}
          apoio={
            resumo.liderancasTotal > 0
              ? `${pct((100 * resumo.liderancasAtivas) / resumo.liderancasTotal)} da rede cadastrou nos últimos 10 dias`
              : "nenhuma liderança cadastrada"
          }
        />
        <Indicador
          rotulo="Últimas 24 horas"
          valor={num(resumo.cadastrados24h)}
          apoio={
            resumo.totalCadastrados > 0
              ? `${pct((100 * resumo.cadastrados24h) / resumo.totalCadastrados)} do total acumulado`
              : "a curva começa no primeiro cadastro"
          }
        />
        <Indicador
          rotulo="Sem link enviado"
          valor={num(resumo.semLinkEnviado)}
          apoio={
            resumo.semLinkEnviado > 0
              ? "não recebeu a mensagem de boas-vindas"
              : "toda a rede recebeu o link"
          }
          alerta={resumo.semLinkEnviado > 0}
        />
      </section>

      {/* RF-18 · termômetro da rede */}
      <Termometro liderancas={liderancas} porEstado={resumo.porEstado} />

      {/* RF-19 · bloco de cobrança — o mais valioso da tela */}
      <section
        className="mt-4 overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--card-bg)" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="font-display tracking-card text-card text-ink">
            Cobrança
          </h2>
          <p className="text-tiny text-ink-3">
            Quem recebeu o link há 5 dias ou mais e não trouxe ninguém
          </p>
        </div>

        {cobranca.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-body text-ink">Ninguém parado.</p>
            <p className="mt-1 text-small text-ink-2">
              Toda a rede cadastrou nos últimos 5 dias.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {cobranca.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/liderancas/${l.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {l.nome}
                  </Link>
                  <p className="text-tiny text-ink-3">
                    {l.local_nome ?? "sem colégio âncora"}
                    {l.regiao ? ` · ${l.regiao}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-data text-right text-small text-t-afastado">
                    {l.dias_parada ?? 0} dias
                    <span className="block text-tiny text-ink-3">desde o envio</span>
                  </p>

                  <BotaoEnvio
                    destino={l}
                    templates={templates}
                    templatePadrao="cutucada"
                    urlBase={hostPublico()}
                    compacto
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  apoio,
  alerta = false,
}: {
  rotulo: string;
  valor: string;
  apoio: string;
  alerta?: boolean;
}) {
  return (
    <div
      className="rounded-lg border border-line px-5 py-4"
      style={{ background: "var(--card-bg)" }}
    >
      <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
        {rotulo}
      </p>
      <p
        className={`font-data mt-2 text-kpi leading-none ${alerta ? "text-t-afastado" : "text-ink"}`}
      >
        {valor}
      </p>
      {/* Nenhum número absoluto aparece sozinho quando existe um percentual
          que o qualifica. */}
      <p className="mt-2 text-tiny text-ink-3">{apoio}</p>
    </div>
  );
}

function Termometro({
  liderancas,
  porEstado,
}: {
  liderancas: LiderancaNaLista[];
  porEstado: Record<string, number>;
}) {
  const total = liderancas.length;

  return (
    <section
      className="mt-4 rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display tracking-card text-card text-ink">
          Termômetro da rede
        </h2>
        <p className="text-tiny text-ink-3">
          Clique numa faixa para filtrar a lista
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-small text-ink-2">
          A rede começa com a primeira liderança cadastrada.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
            {ORDEM_TEMPERATURA.map((estado) => {
              const qtd = porEstado[estado] ?? 0;
              if (qtd === 0) return null;
              return (
                <div
                  key={estado}
                  title={`${TEMPERATURA[estado].rotulo}: ${qtd}`}
                  style={{
                    width: `${(100 * qtd) / total}%`,
                    background: TEMPERATURA[estado].cor,
                  }}
                />
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ORDEM_TEMPERATURA.map((estado) => {
              const qtd = porEstado[estado] ?? 0;
              return (
                <Link
                  key={estado}
                  href={`/liderancas?estado=${estado}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-[var(--dur-micro)] hover:bg-surface-2"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: TEMPERATURA[estado].cor }}
                  />
                  <span className="flex-1 text-small text-ink-2">
                    {TEMPERATURA[estado].rotulo}
                  </span>
                  <span className="font-data text-small text-ink">{qtd}</span>
                  <span className="font-data w-12 text-right text-tiny text-ink-3">
                    {total > 0 ? pct((100 * qtd) / total) : "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
