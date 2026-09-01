import type { PenetracaoLocal } from "@/types/database";

/**
 * A silhueta dos 40 colégios.
 *
 * Uma coluna por local, altura pelo eleitorado, preenchimento pela penetração,
 * do maior para o menor. Colégio com flag `buraco` recebe borda superior
 * vermelha — é um colégio grande num bairro onde ninguém da rede mora, e
 * vermelho no painel significa sempre "abra e resolva".
 *
 * A escala do preenchimento é relativa à maior penetração da cidade, não
 * absoluta: com 0,5% de penetração em todo lugar, uma barra proporcional ao
 * percentual real seria invisível e a tela não diria nada.
 */
export function Silhueta({ locais }: { locais: PenetracaoLocal[] }) {
  if (locais.length === 0) return null;

  const maiorEleitorado = Math.max(...locais.map((l) => l.eleitores));
  const maiorPenetracao = Math.max(
    ...locais.map((l) => Number(l.penetracao_pct ?? 0)),
    0.0001,
  );

  const buracos = locais.filter((l) => l.buraco).length;

  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display tracking-card text-card text-ink">
          Os 40 colégios
        </h2>
        <p className="text-tiny text-ink-3">
          Altura pelo eleitorado, preenchimento pela penetração
        </p>
      </div>

      <div
        className="mt-4 flex h-52 items-end gap-[3px] overflow-hidden rounded-md border border-line px-5 pt-5"
        style={{ background: "linear-gradient(180deg, var(--surface), var(--surface-2))" }}
      >
        {locais.map((l) => {
          const altura = Math.max(6, (l.eleitores / maiorEleitorado) * 100);
          const preenchimento =
            (Number(l.penetracao_pct ?? 0) / maiorPenetracao) * 88;

          return (
            <div
              key={l.id}
              className="relative min-w-0 flex-1 rounded-t-[2px] border-t bg-surface-3 transition-colors duration-[var(--dur-micro)] hover:bg-line"
              style={{
                height: `${altura}%`,
                borderTopColor: l.buraco ? "var(--t-afastado)" : "var(--line-2)",
              }}
              title={`${l.nome} · ${l.bairro_nome} · ${l.eleitores.toLocaleString("pt-BR")} eleitores · ${l.cadastros} cadastros${l.buraco ? " · DESCOBERTO: ninguém da rede mora neste bairro" : ""}${l.liderancas_votam > 0 ? ` · ${l.liderancas_votam} liderança(s) votam aqui` : ""}`}
            >
              <i
                aria-hidden
                className="absolute inset-x-0 bottom-0 rounded-t-[1px] bg-acento"
                style={{ height: `${preenchimento}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-data text-tiny text-ink-3">
          {locais[0]?.eleitores.toLocaleString("pt-BR")} eleitores
        </p>
        {buracos > 0 ? (
          <p className="text-tiny text-t-afastado">
            {buracos} {buracos === 1 ? "colégio grande em bairro" : "colégios grandes em bairros"}{" "}
            sem liderança
          </p>
        ) : (
          <p className="text-tiny text-ink-3">
            Todo colégio acima de 2.000 eleitores tem alguém no bairro
          </p>
        )}
        <p className="font-data text-tiny text-ink-3">
          {locais[locais.length - 1]?.eleitores.toLocaleString("pt-BR")} eleitores
        </p>
      </div>
    </section>
  );
}
