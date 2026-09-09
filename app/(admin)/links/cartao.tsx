"use client";

import { useState } from "react";

import type { LinkFixo } from "@/lib/links/publicos";
import { montarLinkWa } from "@/lib/whatsapp";

/**
 * Um link público na tela.
 *
 * O endereço aparece por extenso e selecionável: quem estiver lendo isto no
 * telefone de outra pessoa ainda consegue anotar. Copiar é conveniência, não
 * o único caminho.
 */
export function CartaoDeLink({
  link,
  endereco,
  exibicao,
}: {
  link: LinkFixo;
  endereco: string;
  exibicao: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Navegador sem permissão de área de transferência. O endereço está na
      // tela e dá para selecionar na mão.
    }
  }

  return (
    <article
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display tracking-card text-card text-ink">
            {link.rotulo}
          </h3>
          <p className="mt-1 text-tiny text-ink-3">{link.paraQuem}</p>
        </div>

        <span
          className={
            "font-display tracking-card shrink-0 rounded-full border px-2.5 py-1 text-eyebrow " +
            (link.indexavel
              ? "border-line-2 text-ink-2"
              : "border-line text-ink-3")
          }
        >
          {link.indexavel ? "aparece no Google" : "fora da busca"}
        </span>
      </div>

      <p className="mt-3 max-w-prose text-small leading-relaxed text-ink-2">
        {link.resumo}
      </p>

      <p className="font-data mt-4 rounded-md border border-line bg-surface-3 px-3 py-2.5 text-small break-all text-ink">
        {exibicao}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={copiar}
          className="font-display tracking-card h-8 rounded-full border border-line-2 px-3.5 text-tiny text-ink hover:bg-surface-2"
        >
          {copiado ? "Copiado" : "Copiar link"}
        </button>

        <a
          href={endereco}
          target="_blank"
          rel="noreferrer"
          className="font-display tracking-card h-8 rounded-full border border-line px-3.5 text-tiny leading-8 text-ink-2 hover:text-ink"
        >
          Abrir
        </a>

        {/*
          Sem número no endereço: o WhatsApp abre a lista de contatos e quem
          escolhe é a pessoa. Continua valendo a invariante 7 — nada dispara
          sozinho, e o texto ainda passa pelos olhos de alguém antes de ir.
        */}
        <a
          href={montarLinkWa("", `${link.convite}\n\n${endereco}`)}
          target="_blank"
          rel="noreferrer"
          className="font-display tracking-card h-8 rounded-full border border-line px-3.5 text-tiny leading-8 text-ink-2 hover:text-ink"
        >
          Mandar no WhatsApp
        </a>
      </div>

      {link.cuidado && (
        <p className="mt-4 border-t border-line pt-3 text-tiny leading-relaxed text-ink-3">
          <span className="text-ink-2">Cuidado: </span>
          {link.cuidado}
        </p>
      )}
    </article>
  );
}
