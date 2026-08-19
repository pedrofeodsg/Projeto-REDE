"use client";

import Link from "next/link";
import { useTransition } from "react";

import { atribuirDemanda, mudarStatusDemanda } from "@/lib/relacionamento/actions";
import type { DemandaNaFila, StatusDemanda } from "@/types/database";

const STATUS: { valor: StatusDemanda; rotulo: string }[] = [
  { valor: "aberta", rotulo: "Aberta" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "resolvida", rotulo: "Resolvida" },
  { valor: "sem_solucao", rotulo: "Sem solução" },
];

export function LinhaDemanda({
  demanda,
  operadores,
}: {
  demanda: DemandaNaFila;
  operadores: { id: string; nome: string }[];
}) {
  const [pendente, iniciar] = useTransition();
  const aberta = demanda.status === "aberta" || demanda.status === "em_andamento";

  return (
    <li className={`px-5 py-3.5 transition-opacity ${pendente ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-ink">{demanda.titulo}</p>
          <p className="mt-0.5 text-tiny text-ink-3">
            <Link href={`/pessoas/${demanda.pessoa_id}`} className="hover:underline">
              {demanda.pessoa_nome}
            </Link>
            {demanda.bairro_nome ? ` · ${demanda.bairro_nome}` : ""}
            {demanda.categoria ? ` · ${demanda.categoria}` : ""}
          </p>
          {demanda.descricao && (
            <p className="mt-1.5 max-w-prose whitespace-pre-wrap text-small text-ink-2">
              {demanda.descricao}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`font-data text-tiny ${
              aberta && demanda.dias_aberta > 30 ? "text-t-afastado" : "text-ink-3"
            }`}
          >
            {demanda.dias_aberta}d
          </span>

          <select
            aria-label="Responsável"
            value={demanda.responsavel ?? ""}
            disabled={pendente}
            onChange={(e) =>
              iniciar(async () => {
                await atribuirDemanda(demanda.id, e.target.value || null);
              })
            }
            className="h-8 max-w-36 rounded-md border border-input bg-surface-3 px-2 text-tiny text-ink-2"
          >
            <option value="">Sem responsável</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>

          <select
            aria-label="Status"
            value={demanda.status}
            disabled={pendente}
            onChange={(e) =>
              iniciar(async () => {
                await mudarStatusDemanda(
                  demanda.id,
                  e.target.value as StatusDemanda,
                  demanda.pessoa_id,
                );
              })
            }
            className="h-8 rounded-md border border-input bg-surface-3 px-2 text-tiny text-ink"
          >
            {STATUS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>
    </li>
  );
}
