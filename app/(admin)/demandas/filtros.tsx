"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const STATUS = [
  { valor: "aberta", rotulo: "Aberta" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "resolvida", rotulo: "Resolvida" },
  { valor: "sem_solucao", rotulo: "Sem solução" },
];

export function FiltrosDemandas({
  categorias,
  operadores,
  valores,
}: {
  categorias: string[];
  operadores: { id: string; nome: string }[];
  valores: { status: string; categoria: string; responsavel: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciar] = useTransition();

  function aplicar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);

    iniciar(() => {
      router.replace(params.size ? `${pathname}?${params}` : pathname);
    });
  }

  const temFiltro = Boolean(valores.status || valores.categoria || valores.responsavel);

  return (
    <div
      className={`mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-line p-3 transition-opacity ${
        pendente ? "opacity-60" : ""
      }`}
      style={{ background: "var(--card-bg)" }}
    >
      <select
        aria-label="Status"
        value={valores.status}
        onChange={(e) => aplicar("status", e.target.value)}
        className="h-9 rounded-md border border-input bg-surface-3 px-2 text-small text-ink"
      >
        <option value="">Só as abertas</option>
        {STATUS.map((s) => (
          <option key={s.valor} value={s.valor}>
            {s.rotulo}
          </option>
        ))}
      </select>

      <select
        aria-label="Categoria"
        value={valores.categoria}
        onChange={(e) => aplicar("categoria", e.target.value)}
        className="h-9 rounded-md border border-input bg-surface-3 px-2 text-small text-ink"
      >
        <option value="">Toda categoria</option>
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        aria-label="Responsável"
        value={valores.responsavel}
        onChange={(e) => aplicar("responsavel", e.target.value)}
        className="h-9 rounded-md border border-input bg-surface-3 px-2 text-small text-ink"
      >
        <option value="">Qualquer responsável</option>
        {operadores.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>

      {temFiltro && (
        <button
          type="button"
          onClick={() => iniciar(() => router.replace(pathname))}
          className="font-display tracking-card h-9 rounded-full border border-line px-3 text-tiny text-ink-3 hover:text-ink"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
