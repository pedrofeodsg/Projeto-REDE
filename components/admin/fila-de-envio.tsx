"use client";

import { useState } from "react";

import { registrarEnvio } from "@/lib/envios/actions";
import { montarLinkWa, montarMensagem } from "@/lib/whatsapp";
import type { LiderancaNaLista, TemplateMensagem } from "@/types/database";

/**
 * Fila de envio em lote (RF-32).
 *
 * Abre as conversas uma por vez, com avanço manual em cada. Nada dispara
 * sozinho em segundo plano — automação de envio massivo contratada de terceiro
 * é vedada pela legislação eleitoral, e o que faz este sistema estar do lado
 * certo dessa linha é exatamente o dedo humano em cada mensagem.
 *
 * O operador vê a mensagem antes de abrir, e pode pular quem não quer cutucar.
 */
export function FilaDeEnvio({
  liderancas,
  templates,
  urlBase,
  templatePadrao,
}: {
  liderancas: LiderancaNaLista[];
  templates: TemplateMensagem[];
  urlBase: string;
  templatePadrao?: string;
}) {
  const disponiveis = templates.filter((t) => t.ativo);
  const [aberta, setAberta] = useState(false);
  const [indice, setIndice] = useState(0);
  const [enviados, setEnviados] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState(
    disponiveis.find((t) => t.chave === templatePadrao)?.id ?? disponiveis[0]?.id ?? "",
  );

  const comLink = liderancas.filter((l) => l.slug);
  if (comLink.length < 2 || disponiveis.length === 0) return null;

  const template = disponiveis.find((t) => t.id === templateId);
  const atual = comLink[indice];
  const acabou = indice >= comLink.length;

  const mensagem =
    atual && template
      ? montarMensagem(template.corpo, {
          nome: atual.nome,
          linkCadastro: `${urlBase}/${atual.slug}`,
          cadastrados: atual.cadastros,
          meta: atual.meta,
          faltam: atual.faltam,
          linhaPessoal: atual.linha_pessoal,
        })
      : "";

  function abrirEAvancar() {
    if (!atual || !template) return;

    window.open(montarLinkWa(atual.telefone, mensagem), "_blank", "noopener");
    void registrarEnvio(atual.id, template.id);

    setEnviados((e) => [...e, atual.id]);
    setIndice((i) => i + 1);
  }

  if (!aberta) {
    return (
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="font-display tracking-card h-9 rounded-full border border-line-2 px-4 text-tiny text-ink hover:bg-surface-3"
      >
        Fila de envio · {comLink.length}
      </button>
    );
  }

  return (
    <div
      className="w-full rounded-lg border border-line-2 p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display tracking-card text-card text-ink">
          Fila de envio
        </h2>
        <p className="font-data text-tiny text-ink-3">
          {Math.min(indice + (acabou ? 0 : 1), comLink.length)} de {comLink.length}
          {enviados.length > 0 ? ` · ${enviados.length} abertas` : ""}
        </p>
      </div>

      {acabou ? (
        <div className="mt-5">
          <p className="text-body text-ink">Fila concluída.</p>
          <p className="mt-1 text-small text-ink-2">
            {enviados.length}{" "}
            {enviados.length === 1 ? "conversa aberta" : "conversas abertas"}. Cada
            envio ficou registrado e passa a contar os dias desta liderança.
          </p>
          <button
            type="button"
            onClick={() => {
              setAberta(false);
              setIndice(0);
              setEnviados([]);
            }}
            className="font-display tracking-card mt-4 h-9 rounded-full border border-line px-4 text-tiny text-ink-2 hover:text-ink"
          >
            Fechar
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              aria-label="Template da fila"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-9 rounded-md border border-input bg-surface-3 px-2 text-small text-ink-2"
            >
              {disponiveis.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            <p className="text-tiny text-ink-3">
              O mesmo template para toda a fila. A linha pessoal muda por pessoa.
            </p>
          </div>

          <div className="mt-4 rounded-md border border-line p-4">
            <p className="font-display tracking-card text-eyebrow text-ink-3">
              Agora
            </p>
            <p className="mt-1 text-body text-ink">{atual.nome}</p>
            <p className="font-data text-tiny text-ink-3">
              {atual.cadastros}/{atual.meta} cadastros
              {atual.dias_parada !== null ? ` · ${atual.dias_parada}d parada` : ""}
              {atual.linha_pessoal ? " · com linha pessoal" : " · sem linha pessoal"}
            </p>

            <pre className="mt-3 max-h-48 max-w-[46ch] overflow-auto whitespace-pre-wrap rounded-md bg-surface-3 px-3 py-2.5 text-tiny leading-relaxed text-ink-2">
              {mensagem}
            </pre>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={abrirEAvancar}
              className="font-display tracking-card h-10 rounded-full bg-primary px-5 text-tiny text-primary-foreground"
            >
              Abrir e avançar
            </button>
            <button
              type="button"
              onClick={() => setIndice((i) => i + 1)}
              className="font-display tracking-card h-10 rounded-full border border-line px-4 text-tiny text-ink-3 hover:text-ink"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={() => setAberta(false)}
              className="font-display tracking-card ml-auto h-10 rounded-full px-4 text-tiny text-ink-3 hover:text-ink"
            >
              Parar
            </button>
          </div>

          <p className="mt-3 text-tiny text-ink-3">
            Uma conversa por vez, com avanço manual. Nada é disparado em segundo
            plano.
          </p>
        </>
      )}
    </div>
  );
}
