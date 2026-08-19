"use client";

import { useTransition } from "react";

import { marcarParaConvidar, vincularHandle } from "@/lib/instagram/actions";
import type { HandleSemVinculo } from "@/types/database";

export function LinhaSemVinculo({
  handle,
  pessoas,
}: {
  handle: HandleSemVinculo;
  pessoas: { id: string; nome: string; instagram_handle: string | null }[];
}) {
  const [pendente, iniciar] = useTransition();

  return (
    <li className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-opacity ${pendente ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <p className="font-data text-small text-ink">{handle.handle_cru}</p>
        <p className="text-tiny text-ink-3">
          {handle.engajamentos} {handle.engajamentos === 1 ? "engajamento" : "engajamentos"} em{" "}
          {handle.posts} {handle.posts === 1 ? "post" : "posts"} · último em{" "}
          {new Date(handle.ultimo).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              await marcarParaConvidar(handle.handle_cru, !handle.marcado);
            })
          }
          className={`font-display tracking-card h-8 rounded-full border px-3 text-tiny transition-colors ${
            handle.marcado
              ? "border-line-3 bg-surface-3 text-ink"
              : "border-line text-ink-3 hover:text-ink"
          }`}
        >
          {handle.marcado ? "Marcado" : "Convidar"}
        </button>

        <select
          aria-label={`Vincular ${handle.handle_cru} a uma pessoa`}
          defaultValue=""
          disabled={pendente}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) return;
            iniciar(async () => {
              await vincularHandle(handle.handle_cru, id);
            });
          }}
          className="h-8 max-w-56 rounded-md border border-input bg-surface-3 px-2 text-tiny text-ink-2"
        >
          <option value="">Vincular a…</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
              {p.instagram_handle ? ` · @${p.instagram_handle}` : ""}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
