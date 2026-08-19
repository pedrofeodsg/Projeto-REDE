import type { Metadata } from "next";
import Link from "next/link";

import {
  CATEGORIAS_SUGERIDAS,
  STATUS_DEMANDA,
  listarDemandas,
  listarOperadores,
} from "@/lib/relacionamento/queries";
import { createAuthClient } from "@/lib/supabase/auth";
import type { StatusDemanda } from "@/types/database";

import { FiltrosDemandas } from "./filtros";
import { LinhaDemanda } from "./linha";

export const metadata: Metadata = { title: "Demandas" };

function ehStatus(v: string | undefined): v is StatusDemanda {
  return (
    v === "aberta" || v === "em_andamento" || v === "resolvida" || v === "sem_solucao"
  );
}

export default async function DemandasPage(props: PageProps<"/demandas">) {
  const params = await props.searchParams;
  const primeiro = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const statusParam = primeiro(params.status);
  const categoria = primeiro(params.categoria) ?? "";
  const responsavel = primeiro(params.responsavel) ?? "";

  const supabase = await createAuthClient();

  const [demandas, operadores] = await Promise.all([
    listarDemandas(supabase, {
      status: ehStatus(statusParam) ? statusParam : undefined,
      categoria: categoria || undefined,
      responsavel: responsavel || undefined,
      apenasAbertas: !statusParam,
    }),
    listarOperadores(supabase),
  ]);

  const abertas = demandas.filter((d) => STATUS_DEMANDA[d.status].aberta);
  const maisVelha = abertas.reduce(
    (max, d) => Math.max(max, d.dias_aberta),
    0,
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Fila do gabinete · {demandas.length}{" "}
          {demandas.length === 1 ? "demanda" : "demandas"}
          {!statusParam ? " em aberto" : ""}
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Demandas
        </h1>
        {abertas.length > 0 && (
          <p className="font-data mt-3 text-small text-ink-2">
            A mais antiga está aberta há{" "}
            <span className={maisVelha > 30 ? "text-t-afastado" : "text-ink"}>
              {maisVelha} dias
            </span>
            .
          </p>
        )}
      </header>

      <FiltrosDemandas
        categorias={CATEGORIAS_SUGERIDAS}
        operadores={operadores}
        valores={{
          status: statusParam ?? "",
          categoria,
          responsavel,
        }}
      />

      {demandas.length === 0 ? (
        <div
          className="mt-4 rounded-lg border border-line px-6 py-12 text-center"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="text-body text-ink">
            {statusParam || categoria || responsavel
              ? "Nenhuma demanda nesse recorte."
              : "Nenhuma demanda em aberto."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
            As demandas nascem no prontuário de cada pessoa, quando alguém traz
            um pedido ao gabinete.
          </p>
        </div>
      ) : (
        <div
          className="mt-4 overflow-hidden rounded-lg border border-line"
          style={{ background: "var(--card-bg)" }}
        >
          <ul className="divide-y divide-[var(--line)]">
            {demandas.map((d) => (
              <LinhaDemanda key={d.id} demanda={d} operadores={operadores} />
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 max-w-prose text-tiny text-ink-3">
        Atendimento de demanda de morador é trabalho de mandato e é legítimo.
        Não existe, em nenhum campo desta tela, registro do que foi prometido ou
        entregue em troca de apoio — e o campo de descrição também não é lugar
        para isso.{" "}
        <Link href="/pessoas" className="underline underline-offset-2">
          Ver a base
        </Link>
      </p>
    </div>
  );
}
