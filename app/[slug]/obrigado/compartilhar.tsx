"use client";

import { useState } from "react";

/**
 * Compartilhar é o mecanismo que faz a Fase 3 da Rede 100x10 acontecer sem dar
 * link individual a apoiador: o que sai daqui é o link DA LIDERANÇA, então
 * quem entrar por ele continua sendo creditado a ela.
 *
 * Web Share API quando existe — no celular ela abre a lista de contatos do
 * WhatsApp direto. Fora dela, copia para a área de transferência.
 */
export function BotaoCompartilhar({
  link,
  texto,
  titulo,
}: {
  link: string;
  texto: string;
  titulo: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url: link });
        return;
      } catch {
        // Cancelou o menu de compartilhamento. Não é erro.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="font-display flex h-14 w-full items-center justify-center rounded-full bg-[var(--campanha)] text-[15px] tracking-[0.1em] text-[var(--campanha-ink)]"
    >
      {copiado ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
