import type { Metadata } from "next";

import { Silhueta } from "@/components/admin/silhueta";
import { createAuthClient } from "@/lib/supabase/auth";
import {
  ELEITORADO_MUNICIPIO,
  REGIAO_LABEL,
  SECOES_MUNICIPIO,
  getChecksSeed,
} from "@/lib/territorio";
import {
  LIMITE_DESVIO_PP,
  getCoberturaRegiao,
  getPenetracaoBairro,
  getPenetracaoLocal,
} from "@/lib/territorio/penetracao";
import type { CoberturaRegiao, PenetracaoBairro, PenetracaoLocal } from "@/types/database";

export const metadata: Metadata = { title: "Território" };

const num = (v: number) => v.toLocaleString("pt-BR");
const pen = (v: number | null) =>
  v === null
    ? "—"
    : `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export default async function TerritorioPage() {
  const supabase = await createAuthClient();

  const [bairros, locais, cobertura, checks] = await Promise.all([
    getPenetracaoBairro(supabase),
    getPenetracaoLocal(supabase),
    getCoberturaRegiao(supabase),
    getChecksSeed(supabase),
  ]);

  const totalEleitores = bairros.reduce((s, b) => s + b.eleitores, 0);
  const totalSecoes = locais.reduce((s, l) => s + l.secoes, 0);
  const totalCadastros = locais.reduce((s, l) => s + l.cadastros, 0);
  const falhas = checks.filter((c) => !c.ok).length;

  const buracos = locais.filter((l) => l.buraco);
  // Concentração é pergunta de bairro, não de colégio: o trabalho se faz
  // morando no bairro, e dois colégios do mesmo bairro repetiriam a mesma
  // informação três vezes.
  const bairrosConcentrados = bairros
    .filter((b) => b.liderancas >= 2)
    .sort((a, b) => a.eleitores - b.eleitores);

  return (
    <div className="mx-auto max-w-[1500px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Base territorial · TSE · 59ª Zona Eleitoral · extração de 03/08/2026
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Território
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          O denominador do sistema. Quem vota fora do município entra no total
          geral e no crédito da liderança, e fica fora de todo cálculo desta
          tela.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Penetração do município"
          valor={pen(totalEleitores > 0 ? (100 * totalCadastros) / totalEleitores : null)}
          apoio={`${num(totalCadastros)} de ${num(totalEleitores)} eleitores`}
        />
        <Indicador
          rotulo="Colégios descobertos"
          valor={num(buracos.length)}
          apoio="acima de 2.000 eleitores, em bairro onde ninguém da rede mora"
          alerta={buracos.length > 0}
        />
        <Indicador
          rotulo="Bairros com concentração"
          valor={num(bairrosConcentrados.length)}
          apoio="duas ou mais lideranças morando no mesmo bairro"
        />
        <Indicador
          rotulo="Integridade do seed"
          valor={`${checks.length - falhas}/${checks.length}`}
          apoio={
            falhas === 0
              ? `${num(bairros.length)} bairros · ${num(locais.length)} colégios · ${num(totalSecoes)} de ${num(SECOES_MUNICIPIO)} seções`
              : "o deploy não sobe assim"
          }
          alerta={falhas > 0}
        />
      </section>

      <div className="mt-4">
        <Silhueta locais={locais} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Cobertura cobertura={cobertura} />
        <Anomalias buracos={buracos} concentrados={bairrosConcentrados} />
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-2">
        <TabelaBairros bairros={bairros} eleitorado={totalEleitores} />
        <TabelaLocais locais={locais} />
      </div>

      {falhas > 0 && (
        <section className="mt-4 rounded-lg border border-t-afastado/40 p-5">
          <h2 className="font-display tracking-card text-card text-t-afastado">
            Integridade do seed
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {checks
              .filter((c) => !c.ok)
              .map((c) => (
                <li key={c.verificacao} className="text-small text-t-afastado">
                  {c.verificacao}: {c.encontrado} · {c.detalhe}
                </li>
              ))}
          </ul>
        </section>
      )}
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
      <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">{rotulo}</p>
      <p
        className={`font-data mt-2 text-kpi leading-none ${alerta ? "text-t-afastado" : "text-ink"}`}
      >
        {valor}
      </p>
      <p className="mt-2 text-tiny text-ink-3">{apoio}</p>
    </div>
  );
}

function Cobertura({ cobertura }: { cobertura: CoberturaRegiao[] }) {
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

      <div className="mt-5 flex flex-col gap-5">
        {cobertura.map((r) => {
          const desvio = Number(r.desvio_pp ?? 0);
          const desequilibrio = Math.abs(desvio) > LIMITE_DESVIO_PP;

          return (
            <div key={r.regiao}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-small text-ink">
                  {r.regiao}{" "}
                  <span className="text-ink-3">· {REGIAO_LABEL[r.regiao]}</span>
                </p>
                <p
                  className={`font-data text-tiny ${desequilibrio ? "text-t-afastado" : "text-ink-3"}`}
                >
                  {desvio > 0 ? "+" : ""}
                  {desvio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp
                </p>
              </div>

              {/* Trilho = proporção do eleitorado. Preenchimento = realizado. */}
              <div className="relative mt-2 h-8 overflow-hidden rounded-sm border border-line bg-surface-3">
                <div
                  className="absolute inset-y-0 left-0 bg-acento"
                  style={{ width: `${Number(r.cadastros_pct ?? 0)}%` }}
                />
                <div className="relative flex h-full items-center justify-between px-2.5">
                  <span className="font-data text-tiny text-ink-2">
                    eleitorado {Number(r.eleitorado_pct ?? 0).toLocaleString("pt-BR")}%
                  </span>
                  <span className="font-data text-tiny text-ink-2">
                    cadastros {Number(r.cadastros_pct ?? 0).toLocaleString("pt-BR")}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-tiny text-ink-3">
        Desvio acima de {LIMITE_DESVIO_PP} pontos percentuais indica que a rede
        está concentrada fora da proporção do eleitorado.
      </p>
    </section>
  );
}

function Anomalias({
  buracos,
  concentrados,
}: {
  buracos: PenetracaoLocal[];
  concentrados: PenetracaoBairro[];
}) {
  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <h2 className="font-display tracking-card text-card text-ink">
        Buracos e sobreposições
      </h2>
      <p className="mt-2 text-tiny text-ink-2">
        Não são erros, são informação. Duas lideranças em São João é adequado;
        duas em Sapeatiba Mirim, com 55 eleitores, é desperdício.
      </p>

      <div className="mt-5">
        <p className="font-display text-eyebrow tracking-eyebrow text-t-afastado">
          Descobertos
        </p>
        {buracos.length === 0 ? (
          <p className="mt-2 text-small text-ink-2">
            Todo colégio acima de 2.000 eleitores fica num bairro com alguém da
            rede morando.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {buracos.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-3">
                <span className="text-small text-ink">{l.nome}</span>
                <span className="font-data shrink-0 text-tiny text-ink-3">
                  {num(l.eleitores)} eleitores
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Bairros com duas ou mais lideranças
        </p>
        {concentrados.length === 0 ? (
          <p className="mt-2 text-small text-ink-2">
            Nenhum bairro com liderança repetida.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {concentrados.map((b) => (
              <li key={b.id} className="flex items-baseline justify-between gap-3">
                <span className="text-small text-ink">{b.nome}</span>
                <span className="font-data shrink-0 text-tiny text-ink-2">
                  {b.liderancas} lideranças · {num(b.eleitores)} eleitores
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TabelaBairros({
  bairros,
  eleitorado,
}: {
  bairros: PenetracaoBairro[];
  eleitorado: number;
}) {
  const cadastros = bairros.reduce((s, b) => s + b.cadastros, 0);

  return (
    <section
      className="overflow-hidden rounded-lg border border-line"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          Penetração por bairro
        </h2>
        <p className="text-tiny text-ink-3">Do mais descoberto para o mais coberto</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-small">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Bairro</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-eyebrow font-normal text-ink-3">R</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Eleitores</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Cadastros</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Penetração</th>
              <th className="font-display tracking-eyebrow px-5 py-2 text-right text-eyebrow font-normal text-ink-3">Moram aqui</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {bairros.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-2 text-ink">{b.nome}</td>
                <td className="font-data px-2 py-2 text-tiny text-ink-3">{b.regiao}</td>
                <td className="font-data px-2 py-2 text-right text-ink-2">{num(b.eleitores)}</td>
                <td className="font-data px-2 py-2 text-right text-ink">{num(b.cadastros)}</td>
                <td className="font-data px-2 py-2 text-right text-ink">{pen(b.penetracao_pct)}</td>
                <td
                  className={`font-data px-5 py-2 text-right ${b.liderancas === 0 ? "text-t-afastado" : "text-ink-2"}`}
                >
                  {b.liderancas}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-2">
              <td className="font-display tracking-card px-5 py-3 text-tiny text-ink">Total</td>
              <td />
              <td className="font-data px-2 py-3 text-right text-ink-2">{num(eleitorado)}</td>
              <td className="font-data px-2 py-3 text-right text-ink">{num(cadastros)}</td>
              <td className="font-data px-2 py-3 text-right text-ink">
                {pen(eleitorado > 0 ? (100 * cadastros) / eleitorado : null)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function TabelaLocais({ locais }: { locais: PenetracaoLocal[] }) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-line"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          Penetração por colégio
        </h2>
        <p className="text-tiny text-ink-3">
          Os 15 maiores concentram 59,6% do eleitorado
        </p>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-small">
          <thead className="sticky top-0" style={{ background: "var(--surface-2)" }}>
            <tr className="border-b border-line text-left">
              <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Colégio</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Eleitores</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Cadastros</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Penetração</th>
              <th className="font-display tracking-eyebrow px-5 py-2 text-right text-eyebrow font-normal text-ink-3">Votam aqui</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {locais.map((l, i) => (
              <tr key={l.id} className={l.buraco ? "bg-[var(--t-afastado)]/[0.06]" : ""}>
                <td className="px-5 py-2">
                  <p className="text-ink">
                    {i < 15 && (
                      <span className="font-data mr-1.5 text-tiny text-ink-3">
                        {i + 1}º
                      </span>
                    )}
                    {l.nome}
                  </p>
                  <p className="text-tiny text-ink-3">
                    {l.bairro_nome} · {l.regiao}
                    {l.buraco ? " · bairro sem liderança" : ""}
                  </p>
                </td>
                <td className="font-data px-2 py-2 text-right align-top text-ink-2">{num(l.eleitores)}</td>
                <td className="font-data px-2 py-2 text-right align-top text-ink">{num(l.cadastros)}</td>
                <td className="font-data px-2 py-2 text-right align-top text-ink">{pen(l.penetracao_pct)}</td>
                <td
                  className={`font-data px-5 py-2 text-right align-top ${l.buraco ? "text-t-afastado" : "text-ink-2"}`}
                >
                  {l.liderancas_votam}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
