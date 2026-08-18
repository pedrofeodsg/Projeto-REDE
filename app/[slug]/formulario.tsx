"use client";

import { useActionState, useMemo, useState } from "react";

import type { EstadoCadastro } from "./actions";

type BairroOpcao = { id: string; nome: string };
type LocalOpcao = { id: string; nome: string; bairro_id: string; eleitores: number };

const ESTADO_INICIAL: EstadoCadastro = { erro: null };
const FORA = "fora";

/** Máscara de leitura. A gravação passa sempre por normalizarTelefone(). */
function mascarar(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function FormularioApoio({
  acao,
  bairros,
  locais,
}: {
  acao: (estado: EstadoCadastro, formData: FormData) => Promise<EstadoCadastro>;
  bairros: BairroOpcao[];
  locais: LocalOpcao[];
}) {
  const [estado, enviar, pendente] = useActionState(acao, ESTADO_INICIAL);

  const [bairro, setBairro] = useState("");
  const [telefone, setTelefone] = useState("");
  const [verTodas, setVerTodas] = useState(false);

  const foraDoMunicipio = bairro === FORA;

  const { doBairro, demais } = useMemo(() => {
    const ordenado = [...locais].sort((a, b) => b.eleitores - a.eleitores);
    return {
      doBairro: ordenado.filter((l) => l.bairro_id === bairro),
      demais: ordenado
        .filter((l) => l.bairro_id !== bairro)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    };
  }, [locais, bairro]);

  const mostrarTodas = verTodas || doBairro.length === 0;

  return (
    <form action={enviar} className="mt-8 flex flex-col gap-5">
      <Campo rotulo="Nome completo" erro={estado.campo === "nome" ? estado.erro : null}>
        <input
          name="nome"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          required
          disabled={pendente}
          className="campo-publico"
        />
      </Campo>

      <Campo
        rotulo="WhatsApp"
        erro={estado.campo === "telefone" ? estado.erro : null}
      >
        <input
          name="telefone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(22) 99999-9999"
          value={telefone}
          onChange={(e) => setTelefone(mascarar(e.target.value))}
          required
          disabled={pendente}
          className="campo-publico"
        />
      </Campo>

      <Campo
        rotulo="Bairro onde mora"
        erro={estado.campo === "bairro" ? estado.erro : null}
      >
        <select
          name="bairro"
          value={bairro}
          onChange={(e) => {
            setBairro(e.target.value);
            setVerTodas(false);
          }}
          required
          disabled={pendente}
          className="campo-publico"
        >
          <option value="">Escolha o bairro</option>
          {bairros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
          <option value={FORA}>Moro em outro município</option>
        </select>
      </Campo>

      {/* Quem vota fora do município não escolhe colégio daqui: o campo some. */}
      {!foraDoMunicipio && (
        <Campo
          rotulo="Onde você vota"
          erro={estado.campo === "local" ? estado.erro : null}
        >
          <select
            name="local"
            required
            disabled={pendente || bairro === ""}
            defaultValue=""
            className="campo-publico"
          >
            <option value="">
              {bairro === "" ? "Escolha o bairro primeiro" : "Escolha a escola"}
            </option>
            {doBairro.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
            {mostrarTodas &&
              demais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
          </select>

          {bairro !== "" && !mostrarTodas && (
            <button
              type="button"
              onClick={() => setVerTodas(true)}
              className="mt-2 self-start text-[14px] underline underline-offset-4 text-paper-ink-2"
            >
              Ver escolas de outros bairros
            </button>
          )}
        </Campo>
      )}

      {estado.erro && !estado.campo ? (
        <p
          role="alert"
          className="rounded-md border-l-2 border-[#c0392b] bg-paper-2 px-3 py-2 text-[14px] text-[#c0392b]"
        >
          {estado.erro}
        </p>
      ) : null}

      {/* Cor da campanha, lugar 3 de 4: o botão. */}
      <button
        type="submit"
        disabled={pendente}
        className="font-display mt-2 h-14 w-full rounded-full bg-[var(--campanha)] text-[15px] tracking-[0.1em] text-[var(--campanha-ink)] transition-opacity disabled:opacity-70"
      >
        {pendente ? "Confirmando…" : "Confirmar apoio"}
      </button>
    </form>
  );
}

function Campo({
  rotulo,
  erro,
  children,
}: {
  rotulo: string;
  erro?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[14px] font-medium text-paper-ink">{rotulo}</span>
      {children}
      {erro ? (
        <span role="alert" className="text-[13px] text-[#c0392b]">
          {erro}
        </span>
      ) : null}
    </label>
  );
}
