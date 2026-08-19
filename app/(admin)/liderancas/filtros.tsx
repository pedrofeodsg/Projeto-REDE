"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ORDEM_TEMPERATURA, TEMPERATURA } from "@/lib/temperatura";
import type { Bairro, MacroRegiao, Tag } from "@/types/database";

/**
 * Filtro é navegação (regra 10 dos tokens): cada escolha reescreve a URL, então
 * o recorte é compartilhável e o botão voltar funciona.
 */
export function Filtros({
  bairros,
  tags,
  regioes,
  valores,
}: {
  bairros: Bairro[];
  tags: Tag[];
  regioes: { codigo: MacroRegiao; nome: string }[];
  valores: {
    busca: string;
    bairroId: string;
    regiao: string;
    tagId: string;
    estado: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();

  function aplicar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);

    iniciarTransicao(() => {
      router.replace(params.size ? `${pathname}?${params}` : pathname);
    });
  }

  const temFiltro = Boolean(
    valores.busca ||
      valores.bairroId ||
      valores.regiao ||
      valores.tagId ||
      valores.estado,
  );

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
        aria-label="Buscar liderança"
        onChange={(e) => aplicar("busca", e.target.value)}
        className="h-9 min-w-56 flex-1 rounded-md border border-input bg-surface-3 px-3 text-small text-ink placeholder:text-ink-3"
      />

      <Seletor
        rotulo="Bairro do colégio"
        valor={valores.bairroId}
        onChange={(v) => aplicar("bairro", v)}
        opcoes={bairros.map((b) => ({ valor: b.id, texto: b.nome }))}
      />

      <Seletor
        rotulo="Macro-região"
        valor={valores.regiao}
        onChange={(v) => aplicar("regiao", v)}
        opcoes={regioes.map((r) => ({ valor: r.codigo, texto: `${r.codigo} · ${r.nome}` }))}
      />

      <Seletor
        rotulo="Temperatura"
        valor={valores.estado}
        onChange={(v) => aplicar("estado", v)}
        opcoes={ORDEM_TEMPERATURA.map((e) => ({
          valor: e,
          texto: TEMPERATURA[e].rotulo,
        }))}
      />

      <Seletor
        rotulo="Tag"
        valor={valores.tagId}
        onChange={(v) => aplicar("tag", v)}
        opcoes={tags.map((t) => ({ valor: t.id, texto: t.nome }))}
      />

      {temFiltro && (
        <button
          type="button"
          onClick={() => iniciarTransicao(() => router.replace(pathname))}
          className="font-display tracking-card h-9 rounded-full border border-line px-3 text-tiny text-ink-3 hover:text-ink"
        >
          Limpar
        </button>
      )}
    </div>
  );
}

function Seletor({
  rotulo,
  valor,
  onChange,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: { valor: string; texto: string }[];
}) {
  return (
    <select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-surface-3 px-2 text-small text-ink"
    >
      <option value="">{rotulo}</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
  );
}
