"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function BuscaDePessoas({
  valores,
}: {
  valores: { busca: string; nivel: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciar] = useTransition();

  function aplicar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    params.delete("p");

    iniciar(() => {
      router.replace(params.size ? `${pathname}?${params}` : pathname);
    });
  }

  return (
    <div
      className={`mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-line p-3 transition-opacity ${
        pendente ? "opacity-60" : ""
      }`}
      style={{ background: "var(--card-bg)" }}
    >
      <input
        type="search"
        defaultValue={valores.busca}
        placeholder="Nome ou WhatsApp"
        aria-label="Buscar pessoa"
        onChange={(e) => aplicar("busca", e.target.value)}
        className="h-9 min-w-56 flex-1 rounded-md border border-input bg-surface-3 px-3 text-small text-ink placeholder:text-ink-3"
      />

      <select
        aria-label="Nível"
        value={valores.nivel}
        onChange={(e) => aplicar("nivel", e.target.value)}
        className="h-9 rounded-md border border-input bg-surface-3 px-2 text-small text-ink"
      >
        <option value="">Todos</option>
        <option value="lideranca">Lideranças</option>
        <option value="apoiador">Apoiadores</option>
      </select>
    </div>
  );
}
