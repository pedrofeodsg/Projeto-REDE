"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";

import {
  cadastrarLideranca,
  type EstadoCadastroLideranca,
} from "./actions";

type BairroOpcao = { id: string; nome: string };
type LocalOpcao = { id: string; nome: string; bairro_id: string; eleitores: number };

const INICIAL: EstadoCadastroLideranca = { erro: null };
const FORA = "fora";

/** Máscara de leitura. A gravação passa sempre por normalizarTelefone(). */
function mascarar(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function FormularioLideranca({
  bairros,
  locais,
}: {
  bairros: BairroOpcao[];
  locais: LocalOpcao[];
}) {
  const [estado, enviar, pendente] = useActionState(cadastrarLideranca, INICIAL);

  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [bairro, setBairro] = useState("");
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

  if (estado.pronto) {
    return <Concluido primeiroNome={estado.primeiroNome ?? ""} />;
  }

  return (
    <form action={enviar} className="px-6 pb-7 pt-5 sm:px-7">
      <Campo rotulo="Nome" obrigatorio icone={<IconePessoa />} erro={estado.campo === "nome" ? estado.erro : null}>
        <input
          name="nome"
          required
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Nome completo"
          disabled={pendente}
        />
      </Campo>

      <Campo rotulo="Apelido" ajuda="opcional · como a cidade te chama" icone={<IconeSorriso />}>
        <input
          name="apelido"
          placeholder="Ex.: Zé da Praça"
          autoCapitalize="words"
          disabled={pendente}
        />
      </Campo>

      <Campo
        rotulo="WhatsApp"
        obrigatorio
        icone={<IconeWhatsapp />}
        erro={estado.campo === "telefone" ? estado.erro : null}
      >
        <input
          name="whatsapp"
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(22) 90000-0000"
          value={whatsapp}
          onChange={(e) => setWhatsapp(mascarar(e.target.value))}
          disabled={pendente}
        />
      </Campo>

      <Campo
        rotulo="Instagram"
        ajuda="opcional"
        icone={<IconeInstagram />}
        prefixo="@"
        erro={estado.campo === "instagram" ? estado.erro : null}
      >
        <input
          name="instagram"
          placeholder="seu.usuario"
          autoCapitalize="none"
          spellCheck={false}
          value={instagram}
          onChange={(e) => setInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
          disabled={pendente}
        />
      </Campo>

      <div className="gap-x-4 sm:grid sm:grid-cols-2">
        <Campo
          rotulo="Onde mora"
          obrigatorio
          icone={<IconeCasa />}
          erro={estado.campo === "bairro" ? estado.erro : null}
        >
          <select
            name="bairro"
            required
            value={bairro}
            onChange={(e) => {
              setBairro(e.target.value);
              setVerTodas(false);
            }}
            disabled={pendente}
          >
            <option value="">Seu bairro</option>
            {bairros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
            <option value={FORA}>Moro em outro município</option>
          </select>
        </Campo>

        {/* Quem mora fora não tem colégio daqui: o campo some. */}
        {!foraDoMunicipio && (
          <Campo
            rotulo="Onde vota"
            obrigatorio
            icone={<IconeMarcador />}
            erro={estado.campo === "local" ? estado.erro : null}
          >
            <select name="local" required defaultValue="" disabled={pendente || bairro === ""}>
              <option value="">
                {bairro === "" ? "Escolha o bairro antes" : "Sua escola"}
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
          </Campo>
        )}
      </div>

      {!foraDoMunicipio && bairro !== "" && !mostrarTodas && (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          className="-mt-2 mb-4 text-[14px] font-semibold text-marca-azul/70 underline underline-offset-4"
        >
          Voto em escola de outro bairro
        </button>
      )}

      {estado.erro && !estado.campo ? (
        <p
          role="alert"
          className="mb-3 rounded-2xl bg-[#fdecea] px-4 py-3 text-[14px] font-semibold text-[#b3261e]"
        >
          {estado.erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendente}
        className="font-marca group mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-marca-verde text-[18px] font-extrabold text-white shadow-[0_12px_24px_-10px_rgba(95,163,44,0.9)] transition-all hover:bg-marca-verde-fundo active:scale-[0.99] disabled:opacity-70"
      >
        {pendente ? "Enviando…" : "Contar comigo"}
        {!pendente && (
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        )}
      </button>

      <p className="mt-3 text-center text-[13px] leading-snug text-marca-tinta/50">
        Seus dados são usados só para organizar a campanha.
      </p>
    </form>
  );
}

function Concluido({ primeiroNome }: { primeiroNome: string }) {
  return (
    <div className="px-7 pb-9 pt-6 text-center">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-marca-verde text-white shadow-[0_12px_24px_-10px_rgba(95,163,44,0.9)]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="font-marca text-[26px] font-extrabold text-marca-azul">
        {primeiroNome ? `Tamo junto, ${primeiroNome}!` : "Tamo junto!"}
      </h2>

      <p className="mx-auto mt-2 max-w-[34ch] leading-snug text-marca-tinta/60">
        Recebemos seu cadastro. Em breve a equipe entra em contato pelo WhatsApp
        com a sua página exclusiva de captação.
      </p>
    </div>
  );
}

function Campo({
  rotulo,
  ajuda,
  icone,
  prefixo,
  obrigatorio,
  erro,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  icone: ReactNode;
  prefixo?: string;
  obrigatorio?: boolean;
  erro?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="font-marca text-[15px] font-bold text-marca-azul">
          {rotulo}
        </span>
        {obrigatorio && <span aria-hidden className="font-bold text-marca-verde">•</span>}
        {ajuda && (
          <span className="text-[13px] font-medium text-marca-tinta/45">{ajuda}</span>
        )}
      </span>

      <span className="campo-campanha">
        <span aria-hidden className="shrink-0 text-marca-azul/45">
          {icone}
        </span>
        {prefixo && (
          <span aria-hidden className="font-marca font-bold text-marca-azul/60">
            {prefixo}
          </span>
        )}
        {children}
      </span>

      {erro ? (
        <span role="alert" className="mt-1.5 block text-[13px] font-semibold text-[#b3261e]">
          {erro}
        </span>
      ) : null}
    </label>
  );
}

/* ── ícones, traçado simples ─────────────────────────────────────────────── */
const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconePessoa() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function IconeSorriso() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14c1 1.3 2.4 2 4 2s3-.7 4-2" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

function IconeWhatsapp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.8 9.2c.3 2.2 2.8 4.7 5 5l1-1.3 1.7.8-.4 1.5c-2.8.6-6.8-3.4-6.2-6.2l1.5-.4.8 1.7-1.4 1Z" />
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17 7h.01" />
    </svg>
  );
}

function IconeCasa() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function IconeMarcador() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
