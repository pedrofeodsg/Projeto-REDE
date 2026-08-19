"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gerarSlug } from "@/lib/pessoas/slug";
import type { Bairro, LocalVotacao, MacroRegiao, Tag } from "@/types/database";

import type { EstadoFormulario } from "./actions";

const REGIAO_NOME: Record<MacroRegiao, string> = {
  R1: "R1 · Central (Sede)",
  R2: "R2 · Leste",
  R3: "R3 · Balneários/Noroeste",
};

const ESTADO_INICIAL: EstadoFormulario = { erro: null };

export type ValoresIniciais = {
  nome: string;
  apelido: string;
  telefone: string;
  bairroId: string;
  localId: string;
  handle: string;
  meta: number;
  linhaPessoal: string;
  slug: string;
  tags: string[];
  ativo: boolean;
};

const VAZIO: ValoresIniciais = {
  nome: "",
  apelido: "",
  telefone: "",
  bairroId: "",
  localId: "",
  handle: "",
  meta: 10,
  linhaPessoal: "",
  slug: "",
  tags: [],
  ativo: true,
};

export function LiderancaForm({
  acao,
  bairros,
  locais,
  tags,
  iniciais = VAZIO,
  modo,
  slugTravado = false,
  cadastrosRecebidos = 0,
  urlBase,
}: {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  bairros: Bairro[];
  locais: LocalVotacao[];
  tags: Tag[];
  iniciais?: ValoresIniciais;
  modo: "criar" | "editar";
  slugTravado?: boolean;
  cadastrosRecebidos?: number;
  urlBase: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, ESTADO_INICIAL);

  const [nome, setNome] = useState(iniciais.nome);
  const [bairroId, setBairroId] = useState(iniciais.bairroId);
  const [localId, setLocalId] = useState(iniciais.localId);
  const [slug, setSlug] = useState(iniciais.slug);
  const [slugTocado, setSlugTocado] = useState(iniciais.slug !== "");
  const [tagsMarcadas, setTagsMarcadas] = useState<string[]>(iniciais.tags);

  const { doBairro, demais } = useMemo(() => {
    const ordenado = [...locais].sort((a, b) => b.eleitores - a.eleitores);
    return {
      doBairro: ordenado.filter((l) => l.bairro_id === bairroId),
      demais: ordenado
        .filter((l) => l.bairro_id !== bairroId)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    };
  }, [locais, bairroId]);

  const localEscolhido = locais.find((l) => l.id === localId) ?? null;
  const slugEfetivo = slugTocado ? slug : gerarSlug(nome);

  const erroDoCampo = (campo: string) =>
    estado.campo === campo ? estado.erro : null;

  return (
    <form action={enviar} className="mt-8 flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Quem é">
          <Campo rotulo="Nome" erro={erroDoCampo("nome")}>
            <Input
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus={modo === "criar"}
              className="h-11 bg-surface-3"
            />
          </Campo>

          <Campo
            rotulo="Apelido"
            ajuda="Como a cidade chama. Aparece junto do nome, inclusive no convite."
          >
            <Input
              name="apelido"
              defaultValue={iniciais.apelido}
              placeholder="opcional"
              className="h-11 bg-surface-3"
            />
          </Campo>

          <Campo
            rotulo="WhatsApp"
            erro={erroDoCampo("telefone")}
            ajuda="Pode digitar com DDD, parêntese e hífen — o sistema normaliza."
          >
            <Input
              name="telefone"
              defaultValue={iniciais.telefone}
              inputMode="tel"
              required
              className="h-11 bg-surface-3"
            />
          </Campo>

          <Campo
            rotulo="@ do Instagram"
            erro={erroDoCampo("instagram_handle")}
            ajuda="Aceita @, link ou só o nome. É a chave do monitoramento digital."
          >
            <Input
              name="instagram_handle"
              defaultValue={iniciais.handle}
              placeholder="@fulano"
              className="h-11 bg-surface-3"
            />
          </Campo>
        </Bloco>

        <Bloco titulo="Território">
          <Campo
            rotulo="Onde mora"
            ajuda="É o bairro que ela cobre no dia a dia. Também filtra os colégios abaixo."
          >
            <select
              name="bairro_moradia_id"
              value={bairroId}
              onChange={(e) => setBairroId(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-surface-3 px-3 text-body text-ink"
            >
              <option value="">Escolha o bairro</option>
              {bairros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            rotulo="Onde vota"
            erro={erroDoCampo("local_votacao_id")}
            ajuda="O colégio dela. É a base para estimar votos naquele local."
          >
            <select
              name="local_votacao_id"
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              required
              className="h-11 w-full rounded-md border border-input bg-surface-3 px-3 text-body text-ink"
            >
              <option value="">Escolha o colégio</option>
              {doBairro.length > 0 && (
                <optgroup label="No bairro escolhido">
                  {doBairro.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} · {l.eleitores.toLocaleString("pt-BR")} eleitores
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={doBairro.length > 0 ? "Colégios de outros bairros" : "Todos os colégios"}>
                {demais.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} · {l.eleitores.toLocaleString("pt-BR")} eleitores
                  </option>
                ))}
              </optgroup>
            </select>
          </Campo>

          <div className="rounded-md border border-line bg-surface-3/40 px-3 py-2.5">
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Macro-região
            </p>
            <p className="mt-1 text-small text-ink">
              {localEscolhido ? (
                REGIAO_NOME[localEscolhido.regiao]
              ) : (
                <span className="text-ink-2">
                  Aparece sozinha quando você escolher o colégio.
                </span>
              )}
            </p>
          </div>
        </Bloco>
      </div>

      <Bloco titulo="Link de captação">
        {slugTravado ? (
          <div>
            <p className="font-data text-body text-ink">
              {urlBase}/{iniciais.slug}
            </p>
            <p className="mt-2 text-small text-ink-2">
              O endereço está travado. Esta liderança já trouxe{" "}
              <strong className="text-ink">{cadastrosRecebidos}</strong>{" "}
              {cadastrosRecebidos === 1 ? "cadastro" : "cadastros"}, então o link
              já circulou por conversas de terceiros — trocar agora quebraria o
              que está no WhatsApp de outras pessoas.
            </p>
          </div>
        ) : (
          <Campo
            rotulo="Endereço"
            erro={erroDoCampo("slug")}
            ajuda="Editável enquanto o link não trouxer ninguém. Depois disso, trava."
          >
            <div className="flex items-center gap-0 overflow-hidden rounded-md border border-input bg-surface-3">
              <span className="font-data shrink-0 border-r border-line px-3 py-3 text-small text-ink-3">
                {urlBase}/
              </span>
              <input
                name="slug"
                value={slugEfetivo}
                onChange={(e) => {
                  setSlugTocado(true);
                  setSlug(e.target.value);
                }}
                className="font-data h-11 w-full bg-transparent px-3 text-body text-ink outline-none"
              />
            </div>
          </Campo>
        )}
      </Bloco>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Compromisso">
          <Campo
            rotulo="Meta de cadastros"
            erro={erroDoCampo("meta")}
            ajuda="Piso de 10 na comunicação, com 100 como horizonte."
          >
            <Input
              name="meta"
              type="number"
              min={0}
              defaultValue={iniciais.meta}
              className="h-11 w-32 bg-surface-3"
            />
          </Campo>

          <Campo
            rotulo="Linha pessoal"
            ajuda="Entra na mensagem de boas-vindas. É a diferença entre a liderança sentir que foi escolhida e sentir que foi incluída numa lista."
          >
            <textarea
              name="linha_pessoal"
              defaultValue={iniciais.linhaPessoal}
              rows={3}
              placeholder="depois do que você fez na Rua do Fogo em 2024, não tinha como não te chamar"
              className="w-full rounded-md border border-input bg-surface-3 px-3 py-2.5 text-body text-ink placeholder:text-ink-3"
            />
          </Campo>
        </Bloco>

        <Bloco titulo="Tags">
          <p className="text-small text-ink-2">
            Atributo declarado. Não é temperatura, que é calculada, nem
            território, que vem do colégio.
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const marcada = tagsMarcadas.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`font-display tracking-card cursor-pointer rounded-full border px-3 py-1.5 text-tiny transition-colors duration-[var(--dur-micro)] ${
                    marcada
                      ? "border-line-3 bg-surface-3 text-ink"
                      : "border-line text-ink-3 hover:text-ink-2"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag.id}
                    checked={marcada}
                    onChange={(e) =>
                      setTagsMarcadas((atual) =>
                        e.target.checked
                          ? [...atual, tag.id]
                          : atual.filter((t) => t !== tag.id),
                      )
                    }
                    className="sr-only"
                  />
                  {tag.nome}
                </label>
              );
            })}
          </div>

          {modo === "editar" && (
            <label className="mt-2 flex items-center gap-2 text-small text-ink-2">
              <input
                type="checkbox"
                name="ativo"
                defaultChecked={iniciais.ativo}
                className="size-4 accent-[var(--ink)]"
              />
              Liderança ativa na rede
            </label>
          )}
        </Bloco>
      </div>

      {estado.erro && !estado.campo ? (
        <p role="alert" className="border-l-2 border-t-afastado pl-3 text-small text-t-afastado">
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pendente}
          className="font-display tracking-card h-11 px-6 text-card"
        >
          {pendente
            ? "Salvando…"
            : modo === "criar"
              ? "Cadastrar liderança"
              : "Salvar alterações"}
        </Button>
        <p className="text-tiny text-ink-3">
          O WhatsApp é a chave única da base. Duplicado não entra.
        </p>
      </div>
    </form>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-line p-5"
      style={{ background: "var(--card-bg)" }}
    >
      <h2 className="font-display tracking-card text-card text-ink">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  rotulo,
  ajuda,
  erro,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  erro?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="font-display text-eyebrow tracking-eyebrow text-ink-3">
        {rotulo}
      </Label>
      {children}
      {erro ? (
        <p role="alert" className="text-tiny text-t-afastado">
          {erro}
        </p>
      ) : ajuda ? (
        <p className="text-tiny text-ink-3">{ajuda}</p>
      ) : null}
    </div>
  );
}
