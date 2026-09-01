import { LIMITE_DESVIO_PP } from "@/lib/territorio/penetracao";
import type { Relatorio } from "@/lib/exportacao/perfis";

/**
 * O artefato que sai da organização.
 *
 * Precisa parecer método, não planilha. Segue a Seção 8.4 do PRD: capa com a
 * data de extração em destaque, os quatro números-síntese grandes, a
 * distribuição territorial contra a proporção do eleitorado, os 15 maiores
 * colégios, a curva semanal com projeção e as lideranças nominais sem
 * telefone. A data de extração se repete no rodapé.
 */
export function Relatorio({ relatorio }: { relatorio: Relatorio }) {
  const extraido = new Date(relatorio.extraidoEm);
  const carimbo = extraido.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const num = (v: number) => v.toLocaleString("pt-BR");
  const pct = (v: number, casas = 1) =>
    `${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

  const temDetalhe = relatorio.perfil !== "publico";

  return (
    <article className="mx-auto max-w-[900px] pb-16">
      {/* Capa */}
      <header className="border-b border-line pb-8">
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          {relatorio.estrutura}
        </p>
        <h1 className="font-display tracking-display mt-4 text-display leading-[1.05] text-ink">
          Prestação de contas
          <br />
          da estrutura
        </h1>
        <p className="mt-4 text-body text-ink-2">{relatorio.municipio}</p>

        <div className="mt-8 inline-flex flex-col rounded-lg border border-line-2 px-5 py-4">
          <span className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            Extraído em
          </span>
          <span className="font-data mt-1 text-body text-ink">{carimbo}</span>
        </div>

        {relatorio.perfil === "candidato" && (
          <p className="mt-6 max-w-prose text-tiny text-ink-3">
            {relatorio.fonteTerritorial}. Este documento traz agregados
            territoriais e lideranças nominais. Não contém dados de contato nem
            identificação de apoiadores.
          </p>
        )}
      </header>

      {/* Página 1 · os quatro números-síntese */}
      <section className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Numero
          rotulo="Cadastrados"
          valor={num(relatorio.numeros.cadastrados)}
          apoio={`${pct(relatorio.numeros.penetracaoPct, 2)} do eleitorado de ${num(relatorio.numeros.eleitorado)}`}
        />
        <Numero
          rotulo="Lideranças ativas"
          valor={`${relatorio.numeros.liderancasAtivas}/${relatorio.numeros.liderancasTotal}`}
          apoio={
            relatorio.numeros.liderancasTotal > 0
              ? `${pct((100 * relatorio.numeros.liderancasAtivas) / relatorio.numeros.liderancasTotal, 0)} da rede em atividade`
              : "rede em formação"
          }
        />
        <Numero
          rotulo="Colégios cobertos"
          valor={`${relatorio.numeros.colegiosCobertos}/${relatorio.numeros.colegiosTotal}`}
          apoio={
            relatorio.numeros.colegiosTotal > 0
              ? `${pct((100 * relatorio.numeros.colegiosCobertos) / relatorio.numeros.colegiosTotal, 0)} dos colégios em bairro com liderança`
              : "—"
          }
        />
        <Numero
          rotulo="Eleitorado do município"
          valor={num(relatorio.numeros.eleitorado)}
          apoio={`${relatorio.numeros.colegiosTotal} colégios · 31 bairros`}
        />
      </section>

      {/* Distribuição territorial */}
      <Secao titulo="Distribuição territorial" nota="Realizado contra a proporção real do eleitorado">
        <div className="flex flex-col gap-5">
          {relatorio.regioes.map((r) => {
            const fora = Math.abs(r.desvioPp) > LIMITE_DESVIO_PP;
            return (
              <div key={r.regiao}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-small text-ink">
                    {r.regiao}
                    {"nome" in r && r.nome ? (
                      <span className="text-ink-3"> · {r.nome}</span>
                    ) : null}
                  </p>
                  <p className={`font-data text-tiny ${fora ? "text-t-afastado" : "text-ink-3"}`}>
                    {r.desvioPp > 0 ? "+" : ""}
                    {r.desvioPp.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp
                  </p>
                </div>
                <div className="relative mt-2 h-9 overflow-hidden rounded-sm border border-line bg-surface-3">
                  <div
                    className="absolute inset-y-0 left-0 bg-acento"
                    style={{ width: `${Math.min(100, r.cadastrosPct)}%` }}
                  />
                  <div className="relative flex h-full items-center justify-between px-3">
                    <span className="font-data text-tiny text-ink-2">
                      eleitorado {pct(r.eleitoradoPct)}
                    </span>
                    <span className="font-data text-tiny text-ink-2">
                      cadastros {pct(r.cadastrosPct)} · {num(r.cadastros)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Secao>

      {temDetalhe && (
        <>
          {/* Curva semanal */}
          <Secao
            titulo="Curva semanal"
            nota={
              relatorio.perfil === "candidato" && relatorio.projecao
                ? `Projeção de ${num(relatorio.projecao.estimado)} até 4 de outubro, no ritmo das últimas semanas`
                : "Evolução do volume por semana"
            }
          >
            {relatorio.curva.length === 0 ? (
              <p className="text-small text-ink-2">A curva começa no primeiro cadastro.</p>
            ) : (
              <>
                <div className="flex h-32 items-end gap-1.5">
                  {relatorio.curva.map((p) => {
                    const maior = Math.max(...relatorio.curva.map((x) => x.novos), 1);
                    return (
                      <div
                        key={p.semana}
                        title={`${new Date(p.semana).toLocaleDateString("pt-BR")} · ${p.novos} novos · ${p.acumulado} acumulado`}
                        className="flex-1 rounded-t-[2px] bg-acento"
                        style={{ height: `${Math.max(4, (100 * p.novos) / maior)}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="font-data text-tiny text-ink-3">
                    {new Date(relatorio.curva[0].semana).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="font-data text-tiny text-ink-3">
                    {num(relatorio.curva[relatorio.curva.length - 1].acumulado)} acumulado
                  </span>
                </div>
              </>
            )}
          </Secao>

          {/* Penetração por colégio */}
          <Secao
            titulo="Penetração por colégio"
            nota="Os 15 maiores locais concentram 59,6% do eleitorado"
          >
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Colégio</Th>
                  <Th className="text-right">Eleitores</Th>
                  <Th className="text-right">Cadastros</Th>
                  <Th className="text-right">Penetração</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {relatorio.colegios.map((c) => (
                  <tr key={c.nome}>
                    <td className="px-2 py-2">
                      <p className="text-ink">{c.nome}</p>
                      <p className="text-tiny text-ink-3">
                        {c.bairro} · {c.regiao}
                        {c.temCobertura ? "" : " · sem liderança no bairro"}
                      </p>
                    </td>
                    <td className="font-data px-2 py-2 text-right align-top text-ink-2">
                      {num(c.eleitores)}
                    </td>
                    <td className="font-data px-2 py-2 text-right align-top text-ink">
                      {num(c.cadastros)}
                    </td>
                    <td className="font-data px-2 py-2 text-right align-top text-ink">
                      {pct(c.penetracaoPct, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>

          {/* Lideranças */}
          <Secao
            titulo="Lideranças"
            nota={
              relatorio.perfil === "candidato"
                ? "Nominal, sem dado de contato"
                : "Uso interno da coordenação"
            }
          >
            {relatorio.liderancas.length === 0 ? (
              <p className="text-small text-ink-2">A rede está em formação.</p>
            ) : (
              <table className="w-full text-small">
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th>Liderança</Th>
                    <Th>Território</Th>
                    <Th className="text-right">Cadastros</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {relatorio.liderancas.map((l) => (
                    <tr key={l.nome}>
                      <td className="px-2 py-1.5 text-ink">{l.nome}</td>
                      <td className="px-2 py-1.5 text-ink-3">
                        {l.bairro} · {l.regiao}
                      </td>
                      <td className="font-data px-2 py-1.5 text-right text-ink">
                        {l.cadastros}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>
        </>
      )}

      <footer className="mt-12 border-t border-line pt-5">
        <p className="font-data text-tiny text-ink-3">
          {relatorio.estrutura} · {relatorio.municipio} · extraído em {carimbo}
        </p>
        <p className="mt-1 text-tiny text-ink-3">
          Número muda todo dia. Comparação sem data de corte não tem sentido.
        </p>
      </footer>
    </article>
  );
}

function Numero({
  rotulo,
  valor,
  apoio,
}: {
  rotulo: string;
  valor: string;
  apoio: string;
}) {
  return (
    <div
      className="rounded-lg border border-line px-5 py-5"
      style={{ background: "var(--card-bg)" }}
    >
      <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">{rotulo}</p>
      <p className="font-data mt-3 text-kpi leading-none text-ink">{valor}</p>
      <p className="mt-3 text-tiny leading-relaxed text-ink-3">{apoio}</p>
    </div>
  );
}

function Secao({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h2 className="font-display tracking-section text-section text-ink">{titulo}</h2>
        <p className="text-tiny text-ink-3">{nota}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`font-display tracking-eyebrow px-2 py-2 text-eyebrow font-normal text-ink-3 ${className}`}
    >
      {children}
    </th>
  );
}
