import type { Metadata } from "next";

import {
  ELEITORADO_MUNICIPIO,
  SECOES_MUNICIPIO,
  getBairros,
  getChecksSeed,
  getLocais,
  getRegioes,
} from "@/lib/territorio";
import { createAuthClient } from "@/lib/supabase/auth";
import type { Bairro, LocalVotacao } from "@/types/database";

export const metadata: Metadata = {
  title: "Território",
};

const num = (v: number) => v.toLocaleString("pt-BR");
const pct = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export default async function TerritorioPage() {
  const supabase = await createAuthClient();

  const [bairros, locais, regioes, checks] = await Promise.all([
    getBairros(supabase),
    getLocais(supabase),
    getRegioes(supabase),
    getChecksSeed(supabase),
  ]);

  const totalEleitores = bairros.reduce((s, b) => s + b.eleitores, 0);
  const totalSecoes = locais.reduce((s, l) => s + l.secoes, 0);
  const nomeBairro = new Map(bairros.map((b) => [b.id, b.nome]));
  const falhas = checks.filter((c) => !c.ok).length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Base territorial · TSE · 59ª Zona Eleitoral · extração de 03/08/2026
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Território
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          O denominador do sistema. Sem ele o painel mostra volume, e volume
          mente: 50 cadastros em São João e 50 em Três Vendas parecem iguais em
          qualquer planilha, sendo que o segundo é 61 vezes mais penetração.
          Tela de conferência, sem edição — o seed é imutável em produção.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Eleitores aptos" valor={num(totalEleitores)} referencia={`de ${num(ELEITORADO_MUNICIPIO)}`} ok={totalEleitores === ELEITORADO_MUNICIPIO} />
        <Indicador rotulo="Bairros" valor={num(bairros.length)} referencia="de 31" ok={bairros.length === 31} />
        <Indicador rotulo="Locais de votação" valor={num(locais.length)} referencia="de 40" ok={locais.length === 40} />
        <Indicador rotulo="Seções eleitorais" valor={num(totalSecoes)} referencia={`de ${num(SECOES_MUNICIPIO)}`} ok={totalSecoes === SECOES_MUNICIPIO} />
      </section>

      <section className="mt-4 rounded-lg border border-line" style={{ background: "var(--card-bg)" }}>
        <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3">
          <h2 className="font-display tracking-card text-card text-ink">
            Integridade do seed
          </h2>
          <p className={`font-data text-tiny ${falhas > 0 ? "text-t-afastado" : "text-ink-3"}`}>
            {falhas === 0 ? `${checks.length}/${checks.length} conferem` : `${falhas} falhando`}
          </p>
        </div>
        <ul className="divide-y divide-[var(--line)]">
          {checks.map((c) => (
            <li key={c.verificacao} className="flex items-center justify-between gap-4 px-5 py-2.5">
              <span className={`text-small ${c.ok ? "text-ink-2" : "text-t-afastado"}`}>
                {c.verificacao}
              </span>
              <span className="flex items-center gap-3 text-right">
                <span className="text-tiny text-ink-3">{c.detalhe}</span>
                <span className={`font-data text-small ${c.ok ? "text-ink" : "text-t-afastado"}`}>
                  {c.encontrado}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-3">
        {regioes.map((r) => (
          <div key={r.codigo} className="rounded-lg border border-line p-5" style={{ background: "var(--card-bg)" }}>
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              {r.codigo} · {r.nome}
            </p>
            <p className="font-data mt-2 text-kpi leading-none text-ink">
              {pct(r.percentual)}
            </p>
            <p className="font-data mt-2 text-small text-ink-2">
              {num(r.eleitores)} eleitores
            </p>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-ink" style={{ width: `${r.percentual}%` }} />
            </div>
            <p className="mt-3 font-data text-tiny text-ink-3">
              {r.bairros} bairros · {r.locais} locais · {r.secoes} seções
            </p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TabelaBairros bairros={bairros} locais={locais} total={totalEleitores} />
        <TabelaLocais locais={locais} nomeBairro={nomeBairro} total={totalEleitores} totalSecoes={totalSecoes} />
      </div>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  referencia,
  ok,
}: {
  rotulo: string;
  valor: string;
  referencia: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-lg border border-line px-5 py-4" style={{ background: "var(--card-bg)" }}>
      <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
        {rotulo}
      </p>
      <p className={`font-data mt-2 text-kpi leading-none ${ok ? "text-ink" : "text-t-afastado"}`}>
        {valor}
      </p>
      <p className="font-data mt-1 text-tiny text-ink-3">{referencia}</p>
    </div>
  );
}

function TabelaBairros({
  bairros,
  locais,
  total,
}: {
  bairros: Bairro[];
  locais: LocalVotacao[];
  total: number;
}) {
  const quantosLocais = (bairroId: string) =>
    locais.filter((l) => l.bairro_id === bairroId).length;

  return (
    <section className="overflow-hidden rounded-lg border border-line" style={{ background: "var(--card-bg)" }}>
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          31 bairros
        </h2>
        <p className="font-data text-tiny text-ink-3">
          {bairros.length} linhas · soma {total.toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-small">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Bairro</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-eyebrow font-normal text-ink-3">R</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Eleitores</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">%</th>
              <th className="font-display tracking-eyebrow px-5 py-2 text-right text-eyebrow font-normal text-ink-3">Locais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {bairros.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-2 text-ink">{b.nome}</td>
                <td className="font-data px-2 py-2 text-tiny text-ink-3">{b.regiao}</td>
                <td className="font-data px-2 py-2 text-right text-ink">{num(b.eleitores)}</td>
                <td className="font-data px-2 py-2 text-right text-ink-2">{pct((100 * b.eleitores) / total)}</td>
                <td className="font-data px-5 py-2 text-right text-ink-2">{quantosLocais(b.id)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-2">
              <td className="font-display tracking-card px-5 py-3 text-tiny text-ink">Total</td>
              <td />
              <td className="font-data px-2 py-3 text-right text-ink">{num(total)}</td>
              <td className="font-data px-2 py-3 text-right text-ink-2">100,0%</td>
              <td className="font-data px-5 py-3 text-right text-ink-2">{locais.length}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function TabelaLocais({
  locais,
  nomeBairro,
  total,
  totalSecoes,
}: {
  locais: LocalVotacao[];
  nomeBairro: Map<string, string>;
  total: number;
  totalSecoes: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-line" style={{ background: "var(--card-bg)" }}>
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          40 locais de votação
        </h2>
        <p className="font-data text-tiny text-ink-3">
          {locais.length} linhas · soma {total.toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-small">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Local</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">Eleitores</th>
              <th className="font-display tracking-eyebrow px-2 py-2 text-right text-eyebrow font-normal text-ink-3">%</th>
              <th className="font-display tracking-eyebrow px-5 py-2 text-right text-eyebrow font-normal text-ink-3">Seções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {locais.map((l) => (
              <tr key={l.id}>
                <td className="px-5 py-2">
                  <p className="text-ink">{l.nome}</p>
                  <p className="text-tiny text-ink-3">
                    {nomeBairro.get(l.bairro_id)} · {l.regiao}
                    {l.endereco ? ` · ${l.endereco}` : ""}
                  </p>
                </td>
                <td className="font-data px-2 py-2 text-right align-top text-ink">{num(l.eleitores)}</td>
                <td className="font-data px-2 py-2 text-right align-top text-ink-2">{pct((100 * l.eleitores) / total)}</td>
                <td className="font-data px-5 py-2 text-right align-top text-ink-2">{l.secoes}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-2">
              <td className="font-display tracking-card px-5 py-3 text-tiny text-ink">Total</td>
              <td className="font-data px-2 py-3 text-right text-ink">{num(total)}</td>
              <td className="font-data px-2 py-3 text-right text-ink-2">100,0%</td>
              <td className="font-data px-5 py-3 text-right text-ink">{totalSecoes}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
