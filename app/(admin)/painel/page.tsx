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
import { REGIAO_LABEL } from "@/lib/territorio";
import {
  LIMITE_DESVIO_PP,
  getCoberturaRegiao,
  getPenetracaoBairro,
  getRankingSemanal,
} from "@/lib/territorio/penetracao";
import { hostPublico } from "@/lib/url";
import type {
  CoberturaRegiao,
  LiderancaNaLista,
  PenetracaoBairro,
  RankingSemanal,
} from "@/types/database";

export const metadata: Metadata = { title: "Painel" };

const num = (v: number) => v.toLocaleString("pt-BR");
const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export default async function PainelPage() {
  const supabase = await createAuthClient();

  const [liderancas, templates, ranking, penetracao, cobertura] =
    await Promise.all([
      listarLiderancasComEstado(supabase),
      listarTemplates(supabase, true),
      getRankingSemanal(supabase),
      getPenetracaoBairro(supabase),
      getCoberturaRegiao(supabase),
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

      {/* Bloco 4 · onde investir o próximo passo */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <RankingSemana ranking={ranking} />
        <CoberturaRegional cobertura={cobertura} />
      </div>

      <PenetracaoPorBairro bairros={penetracao} />
    </div>
  );
}

function RankingSemana({ ranking }: { ranking: RankingSemanal[] }) {
  const maior = Math.max(...ranking.map((r) => r.novos_na_semana), 1);

  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display tracking-card text-card text-ink">
          Quem está trabalhando agora
        </h2>
        <p className="text-tiny text-ink-3">Novos nos últimos 7 dias</p>
      </div>

      {ranking.length === 0 ? (
        <p className="mt-4 text-small text-ink-2">
          Nenhum cadastro novo nesta semana. O ranking recomeça toda segunda.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-2.5">
          {ranking.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3">
              <span className="font-data w-5 shrink-0 text-tiny text-ink-3">
                {i + 1}
              </span>
              <Link
                href={`/liderancas/${r.id}`}
                className="min-w-0 flex-1 truncate text-small text-ink hover:underline"
              >
                {r.nome}
              </Link>
              <div className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full bg-ink"
                  style={{ width: `${(100 * r.novos_na_semana) / maior}%` }}
                />
              </div>
              <span className="font-data w-8 shrink-0 text-right text-small text-ink">
                {r.novos_na_semana}
              </span>
              <span className="font-data w-14 shrink-0 text-right text-tiny text-ink-3">
                {r.cadastros} no total
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-tiny text-ink-3">
        Ordenado por novos na semana, não por total acumulado: o total premia
        quem tem agenda grande e cristaliza o ranking em duas semanas.
      </p>
    </section>
  );
}

function CoberturaRegional({ cobertura }: { cobertura: CoberturaRegiao[] }) {
  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display tracking-card text-card text-ink">
          Cobertura por macro-região
        </h2>
        <p className="text-tiny text-ink-3">Realizado contra o eleitorado</p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {cobertura.map((r) => {
          const desvio = Number(r.desvio_pp ?? 0);
          const fora = Math.abs(desvio) > LIMITE_DESVIO_PP;

          return (
            <div key={r.regiao}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-small text-ink">
                  {r.regiao}{" "}
                  <span className="text-ink-3">· {REGIAO_LABEL[r.regiao]}</span>
                </p>
                <p
                  className={`font-data text-tiny ${fora ? "text-t-afastado" : "text-ink-3"}`}
                >
                  {desvio > 0 ? "+" : ""}
                  {desvio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp
                </p>
              </div>
              {/* Trilho = proporção do eleitorado. Preenchimento = realizado. */}
              <div className="relative mt-1.5 h-7 overflow-hidden rounded-sm border border-line bg-surface-3">
                <div
                  className="absolute inset-y-0 left-0 bg-ink opacity-90"
                  style={{ width: `${Number(r.cadastros_pct ?? 0)}%` }}
                />
                <div className="relative flex h-full items-center justify-between px-2.5">
                  <span className="font-data text-tiny text-ink-2">
                    eleitorado{" "}
                    {Number(r.eleitorado_pct ?? 0).toLocaleString("pt-BR")}%
                  </span>
                  <span className="font-data text-tiny text-ink-2">
                    cadastros{" "}
                    {Number(r.cadastros_pct ?? 0).toLocaleString("pt-BR")}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PenetracaoPorBairro({ bairros }: { bairros: PenetracaoBairro[] }) {
  // Só os oito mais descobertos: o painel é fila de trabalho, e a tabela
  // inteira mora em /territorio.
  const primeiros = bairros.slice(0, 8);

  return (
    <section
      className="mt-4 overflow-hidden rounded-lg border border-line"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          Onde falta
        </h2>
        <Link href="/territorio" className="text-tiny text-ink-3 hover:text-ink">
          Ver os 31 bairros e os 40 colégios →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-small">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">
                Bairro
              </th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">
                Eleitores
              </th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">
                Cadastros
              </th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">
                Penetração
              </th>
              <th className="font-display tracking-eyebrow px-5 py-2 text-right text-eyebrow font-normal text-ink-3">
                Lideranças
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {primeiros.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-2 text-ink">
                  {b.nome}
                  <span className="font-data ml-2 text-tiny text-ink-3">
                    {b.regiao}
                  </span>
                </td>
                <td className="font-data px-2 py-2 text-right text-ink-2">
                  {num(b.eleitores)}
                </td>
                <td className="font-data px-2 py-2 text-right text-ink">
                  {b.cadastros}
                </td>
                <td className="font-data px-2 py-2 text-right text-ink">
                  {b.penetracao_pct === null
                    ? "—"
                    : `${Number(b.penetracao_pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                </td>
                <td
                  className={`font-data px-5 py-2 text-right ${b.liderancas === 0 ? "text-t-afastado" : "text-ink-2"}`}
                >
                  {b.liderancas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
