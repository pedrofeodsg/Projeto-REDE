"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { montarMensagem } from "@/lib/whatsapp";
import type { TemplateMensagem } from "@/types/database";

import { excluirTemplate, salvarTemplate, type EstadoTemplate } from "./actions";

const ESTADO_INICIAL: EstadoTemplate = { erro: null };

const VARIAVEIS = [
  { marcador: "{nome}", descricao: "primeiro nome da liderança" },
  { marcador: "{link_cadastro}", descricao: "a página exclusiva dela" },
  { marcador: "{linha_pessoal}", descricao: "a frase escrita só para ela" },
  { marcador: "{cadastrados}", descricao: "quantos ela já trouxe" },
  { marcador: "{meta}", descricao: "a meta assumida" },
  { marcador: "{faltam}", descricao: "quanto falta para a meta" },
];

/** Uma liderança de mentira, para o operador ver o texto montado. */
const EXEMPLO = {
  nome: "Maria do Carmo Ferreira",
  linkCadastro: "rede.com.br/maria-do-carmo",
  cadastrados: 7,
  meta: 10,
  faltam: 3,
  linhaPessoal: "depois do que você fez na Rua do Fogo em 2024, não tinha como não te chamar",
};

export function ListaDeTemplates({ templates }: { templates: TemplateMensagem[] }) {
  const [editando, setEditando] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  return (
    <div className="mt-8 flex flex-col gap-3">
      {templates.map((t) =>
        editando === t.id ? (
          <Editor
            key={t.id}
            template={t}
            aoFechar={() => setEditando(null)}
          />
        ) : (
          <Cartao
            key={t.id}
            template={t}
            aoEditar={() => setEditando(t.id)}
          />
        ),
      )}

      {criando ? (
        <Editor template={null} aoFechar={() => setCriando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="font-display tracking-card h-11 rounded-lg border border-dashed border-line-2 text-tiny text-ink-3 transition-colors duration-[var(--dur-micro)] hover:text-ink"
        >
          Novo template
        </button>
      )}
    </div>
  );
}

function Cartao({
  template,
  aoEditar,
}: {
  template: TemplateMensagem;
  aoEditar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const previa = montarMensagem(template.corpo, EXEMPLO);

  return (
    <section
      className="rounded-lg border border-line"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-body font-medium text-ink">{template.nome}</h2>
          <p className="font-data text-tiny text-ink-3">
            {template.chave ? `chave ${template.chave} · ` : ""}
            {template.ativo ? "ativo" : "desativado"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="font-display tracking-card h-8 rounded-full border border-line px-3 text-tiny text-ink-3 hover:text-ink"
          >
            {aberto ? "Fechar prévia" : "Ver prévia"}
          </button>
          <button
            type="button"
            onClick={aoEditar}
            className="font-display tracking-card h-8 rounded-full border border-line-2 px-3 text-tiny text-ink hover:bg-surface-3"
          >
            Editar
          </button>
        </div>
      </div>

      {aberto && (
        <div className="border-t border-line px-5 py-4">
          <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            Como chega no WhatsApp
          </p>
          <pre className="mt-3 max-w-[46ch] whitespace-pre-wrap rounded-md bg-surface-3 px-4 py-3 text-small leading-relaxed text-ink">
            {previa}
          </pre>
        </div>
      )}
    </section>
  );
}

function Editor({
  template,
  aoFechar,
}: {
  template: TemplateMensagem | null;
  aoFechar: () => void;
}) {
  const acao = salvarTemplate.bind(null, template?.id ?? null);
  const [estado, enviar, pendente] = useActionState(acao, ESTADO_INICIAL);
  const [corpo, setCorpo] = useState(template?.corpo ?? "");

  if (estado.salvo) {
    // Fecha na volta do servidor, sem esperar clique.
    queueMicrotask(aoFechar);
  }

  return (
    <form
      action={enviar}
      className="rounded-lg border border-line-2 p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nome-template"
              className="font-display text-eyebrow tracking-eyebrow text-ink-3"
            >
              Nome
            </label>
            <Input
              id="nome-template"
              name="nome"
              defaultValue={template?.nome ?? ""}
              required
              className="h-11 bg-surface-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="corpo-template"
              className="font-display text-eyebrow tracking-eyebrow text-ink-3"
            >
              Mensagem
            </label>
            <textarea
              id="corpo-template"
              name="corpo"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={14}
              required
              className="w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-body leading-relaxed text-ink"
            />
          </div>

          <label className="flex items-center gap-2 text-small text-ink-2">
            <input
              type="checkbox"
              name="ativo"
              defaultChecked={template?.ativo ?? true}
              className="size-4 accent-[var(--ink)]"
            />
            Disponível no seletor de envio
          </label>
        </div>

        <aside className="flex w-full flex-col gap-3 lg:w-72">
          <div>
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Variáveis
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {VARIAVEIS.map((v) => (
                <li key={v.marcador}>
                  <button
                    type="button"
                    onClick={() => setCorpo((c) => `${c}${v.marcador}`)}
                    className="w-full text-left"
                  >
                    <span className="font-data text-tiny text-ink">{v.marcador}</span>
                    <span className="block text-tiny text-ink-3">{v.descricao}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-tiny text-ink-3">
              Se a linha pessoal estiver vazia, a linha inteira sai do texto —
              não fica buraco.
            </p>
          </div>

          <div className="border-t border-line pt-3">
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Prévia
            </p>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-tiny leading-relaxed text-ink-2">
              {montarMensagem(corpo, EXEMPLO)}
            </pre>
          </div>
        </aside>
      </div>

      {estado.erro && (
        <p role="alert" className="mt-4 border-l-2 border-t-afastado pl-3 text-small text-t-afastado">
          {estado.erro}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <Button
          type="submit"
          disabled={pendente}
          className="font-display tracking-card h-10 px-5 text-tiny"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </Button>
        <button
          type="button"
          onClick={aoFechar}
          className="font-display tracking-card h-10 rounded-full border border-line px-4 text-tiny text-ink-3 hover:text-ink"
        >
          Cancelar
        </button>

        {template && !template.chave && (
          <button
            type="button"
            onClick={() => excluirTemplate(template.id)}
            className="font-display tracking-card ml-auto h-10 rounded-full px-4 text-tiny text-ink-3 hover:text-t-afastado"
          >
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
