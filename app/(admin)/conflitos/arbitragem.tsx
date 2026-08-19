"use client";

import { useTransition } from "react";

import { arbitrarConflito } from "@/lib/relacionamento/actions";

/**
 * Arbitragem de conflito.
 *
 * Duas saídas, e nenhuma delas fala com as lideranças envolvidas. Manter é o
 * padrão do sistema — o primeiro cadastro prevalece. Transferir existe para o
 * caso em que a coordenação sabe, por fora, que o contato é mesmo de quem
 * tentou depois; e toda transferência vira linha no log de reatribuição.
 */
export function Arbitragem({
  conflitoId,
  nomeTentou,
  podeTransferir,
}: {
  conflitoId: string;
  nomeTentou: string | null;
  podeTransferir: boolean;
}) {
  const [pendente, iniciar] = useTransition();

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <button
        type="button"
        disabled={pendente}
        onClick={() => iniciar(async () => { await arbitrarConflito(conflitoId, "manter"); })}
        className="font-display tracking-card h-9 rounded-full border border-line-2 px-4 text-tiny text-ink hover:bg-surface-3 disabled:opacity-50"
      >
        Manter como está
      </button>

      {podeTransferir && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => iniciar(async () => { await arbitrarConflito(conflitoId, "transferir"); })}
          className="font-display tracking-card h-9 rounded-full border border-line px-4 text-tiny text-ink-2 hover:text-ink disabled:opacity-50"
        >
          Transferir para {nomeTentou?.split(/\s+/)[0] ?? "quem tentou"}
        </button>
      )}

      <p className="text-tiny text-ink-3">
        A transferência fica registrada no log de reatribuição.
      </p>
    </div>
  );
}
