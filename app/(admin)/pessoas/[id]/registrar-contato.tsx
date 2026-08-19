"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  registrarDemanda,
  registrarInteracao,
  type EstadoAcao,
} from "@/lib/relacionamento/actions";

const INICIAL: EstadoAcao = { erro: null };

const TIPOS = [
  { valor: "conversa", rotulo: "Conversa" },
  { valor: "ligacao", rotulo: "Ligação" },
  { valor: "visita", rotulo: "Visita" },
  { valor: "mensagem", rotulo: "Mensagem" },
];

const CATEGORIAS = [
  "Saúde",
  "Iluminação",
  "Calçamento e buraco",
  "Água e esgoto",
  "Educação",
  "Assistência social",
  "Transporte",
  "Limpeza urbana",
  "Segurança",
  "Documentação",
  "Emprego",
];

/**
 * Registrar contato fica sempre visível, inclusive no estado vazio.
 *
 * Prontuário que cobra preenchimento vira prontuário abandonado: ninguém
 * preenche ficha proativamente para milhares de pessoas. Ele se preenche por
 * evento, e o botão precisa estar onde a mão já está.
 */
export function RegistrarContato({ pessoaId }: { pessoaId: string }) {
  const [aba, setAba] = useState<"interacao" | "demanda">("interacao");

  return (
    <section
      className="rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <div className="flex items-center gap-1">
        <Aba ativa={aba === "interacao"} onClick={() => setAba("interacao")}>
          Registrar contato
        </Aba>
        <Aba ativa={aba === "demanda"} onClick={() => setAba("demanda")}>
          Abrir demanda
        </Aba>
      </div>

      {aba === "interacao" ? (
        <FormInteracao pessoaId={pessoaId} />
      ) : (
        <FormDemanda pessoaId={pessoaId} />
      )}
    </section>
  );
}

function Aba({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-display tracking-card rounded-full px-3 py-1.5 text-tiny transition-colors duration-[var(--dur-micro)] ${
        ativa ? "bg-surface-3 text-ink" : "text-ink-3 hover:text-ink-2"
      }`}
    >
      {children}
    </button>
  );
}

function FormInteracao({ pessoaId }: { pessoaId: string }) {
  const acao = registrarInteracao.bind(null, pessoaId);
  const [estado, enviar, pendente] = useActionState(acao, INICIAL);
  const [chave, setChave] = useState(0);

  if (estado.ok) {
    // Limpa o formulário quando o servidor confirma.
    queueMicrotask(() => setChave((k) => k + 1));
  }

  return (
    <form key={chave} action={enviar} className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t, i) => (
          <label
            key={t.valor}
            className="font-display tracking-card cursor-pointer rounded-full border border-line px-3 py-1.5 text-tiny text-ink-3 transition-colors has-[:checked]:border-line-3 has-[:checked]:bg-surface-3 has-[:checked]:text-ink"
          >
            <input
              type="radio"
              name="tipo"
              value={t.valor}
              defaultChecked={i === 0}
              className="sr-only"
            />
            {t.rotulo}
          </label>
        ))}
      </div>

      <textarea
        name="descricao"
        rows={3}
        required
        placeholder="O que aconteceu nesse contato?"
        className="w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-body text-ink placeholder:text-ink-3"
      />

      {estado.erro && (
        <p role="alert" className="text-small text-t-afastado">
          {estado.erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pendente}
          className="font-display tracking-card h-10 px-5 text-tiny"
        >
          {pendente ? "Salvando…" : "Registrar"}
        </Button>
        <p className="text-tiny text-ink-3">
          Não registre promessa ou troca — atendimento é trabalho de mandato,
          registro de troca é outra coisa.
        </p>
      </div>
    </form>
  );
}

function FormDemanda({ pessoaId }: { pessoaId: string }) {
  const acao = registrarDemanda.bind(null, pessoaId);
  const [estado, enviar, pendente] = useActionState(acao, INICIAL);
  const [chave, setChave] = useState(0);

  if (estado.ok) {
    queueMicrotask(() => setChave((k) => k + 1));
  }

  return (
    <form key={chave} action={enviar} className="mt-4 flex flex-col gap-3">
      <Input
        name="titulo"
        required
        placeholder="O que a pessoa pediu"
        className="h-11 bg-surface-3"
      />

      <div className="flex flex-wrap gap-2">
        <select
          name="categoria"
          defaultValue=""
          className="h-10 rounded-md border border-input bg-surface-3 px-2 text-small text-ink"
        >
          <option value="">Sem categoria</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="descricao"
        rows={3}
        placeholder="Detalhes, se houver"
        className="w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-body text-ink placeholder:text-ink-3"
      />

      {estado.erro && (
        <p role="alert" className="text-small text-t-afastado">
          {estado.erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pendente}
          className="font-display tracking-card h-10 px-5 text-tiny"
        >
          {pendente ? "Abrindo…" : "Abrir demanda"}
        </Button>
        <p className="text-tiny text-ink-3">Entra na fila de /demandas.</p>
      </div>
    </form>
  );
}
