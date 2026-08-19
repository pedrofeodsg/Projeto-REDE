import type { Metadata } from "next";

import {
  getHandlesSemVinculo,
  listarLiderancasParaVinculo,
} from "@/lib/instagram/queries";
import { createAuthClient } from "@/lib/supabase/auth";

import { LinhaSemVinculo } from "./linha";

export const metadata: Metadata = { title: "Não casados" };

export default async function VincularPage() {
  const supabase = await createAuthClient();

  const [handles, pessoas] = await Promise.all([
    getHandlesSemVinculo(supabase),
    listarLiderancasParaVinculo(supabase),
  ]);

  const marcados = handles.filter((h) => h.marcado).length;

  return (
    <section
      className="overflow-hidden rounded-lg border border-line"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="font-display tracking-card text-card text-ink">
          @ que engajaram e não casaram
        </h2>
        <p className="font-data text-tiny text-ink-3">
          {handles.length} {handles.length === 1 ? "handle" : "handles"}
          {marcados > 0 ? ` · ${marcados} marcados para convidar` : ""}
        </p>
      </div>

      <div className="border-b border-line px-5 py-3">
        <p className="max-w-prose text-small text-ink-2">
          Isto não é erro de importação. É gente que comentou em post político
          por vontade própria e que a campanha não tem cadastrada — em eleição
          municipal, esse é o perfil de liderança em potencial. Ordenado por
          frequência de engajamento.
        </p>
      </div>

      {handles.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-body text-ink">Todo mundo casou.</p>
          <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
            Cada @ importado encontrou alguém na base.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {handles.map((h) => (
            <LinhaSemVinculo key={h.handle_cru} handle={h} pessoas={pessoas} />
          ))}
        </ul>
      )}

      <p className="border-t border-line px-5 py-3 text-tiny text-ink-3">
        Vincular altera apenas o vínculo com a pessoa. O texto original de cada
        engajamento permanece intocado — é assim que a liderança pode trocar de @
        no meio da campanha sem o histórico se perder.
      </p>
    </section>
  );
}
