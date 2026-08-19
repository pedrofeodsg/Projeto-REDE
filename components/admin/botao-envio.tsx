"use client";

import { useState, useTransition } from "react";

import { registrarEnvio } from "@/lib/envios/actions";
import { montarLinkWa, montarMensagem } from "@/lib/whatsapp";
import type { TemplateMensagem } from "@/types/database";

export type DestinoEnvio = {
  id: string;
  nome: string;
  telefone: string;
  slug: string | null;
  meta: number;
  cadastros: number;
  faltam: number;
  linha_pessoal: string | null;
};

/**
 * Abre o WhatsApp e grava o envio no mesmo clique.
 *
 * A janela abre ANTES da ida ao servidor, e de forma síncrona: `window.open`
 * disparado depois de um `await` é engolido pelo bloqueador de pop-up, e o
 * operador fica clicando num botão que não faz nada.
 */
export function BotaoEnvio({
  destino,
  templates,
  urlBase,
  templatePadrao,
  compacto = false,
}: {
  destino: DestinoEnvio;
  templates: TemplateMensagem[];
  urlBase: string;
  templatePadrao?: string;
  compacto?: boolean;
}) {
  const disponiveis = templates.filter((t) => t.ativo);
  const inicial =
    disponiveis.find((t) => t.chave === templatePadrao)?.id ??
    disponiveis[0]?.id ??
    "";

  const [templateId, setTemplateId] = useState(inicial);
  const [enviando, iniciar] = useTransition();
  const [registrado, setRegistrado] = useState(false);

  const template = disponiveis.find((t) => t.id === templateId);
  const semLink = !destino.slug;

  function disparar() {
    if (!template || semLink) return;

    const mensagem = montarMensagem(template.corpo, {
      nome: destino.nome,
      linkCadastro: `${urlBase}/${destino.slug}`,
      cadastrados: destino.cadastros,
      meta: destino.meta,
      faltam: destino.faltam,
      linhaPessoal: destino.linha_pessoal,
    });

    window.open(montarLinkWa(destino.telefone, mensagem), "_blank", "noopener");

    iniciar(async () => {
      await registrarEnvio(destino.id, template.id);
      setRegistrado(true);
      setTimeout(() => setRegistrado(false), 2500);
    });
  }

  if (semLink) {
    return <span className="text-tiny text-t-afastado">sem link</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {!compacto && disponiveis.length > 1 && (
        <select
          aria-label="Template da mensagem"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="h-8 max-w-40 rounded-md border border-input bg-surface-3 px-2 text-tiny text-ink-2"
        >
          {disponiveis.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={disparar}
        disabled={enviando || !template}
        className="font-display tracking-card h-8 shrink-0 rounded-full border border-line-2 px-3 text-tiny text-ink transition-colors duration-[var(--dur-micro)] hover:bg-surface-3 disabled:opacity-50"
      >
        {registrado ? "Registrado" : enviando ? "…" : "WhatsApp"}
      </button>
    </div>
  );
}
