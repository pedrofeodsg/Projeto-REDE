import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BotaoEnvio } from "@/components/admin/botao-envio";
import { listarTemplates } from "@/lib/mensagens/queries";
import { formatarTelefone } from "@/lib/pessoas/telefone";
import {
  STATUS_DEMANDA,
  TIPO_INTERACAO,
  getEstadoDaLideranca,
  getHistoricoEnvios,
  getHistoricoTemperatura,
  getIndicados,
  getLinhaDoTempo,
  getPessoa,
} from "@/lib/relacionamento/queries";
import { createAuthClient } from "@/lib/supabase/auth";
import { TEMPERATURA } from "@/lib/temperatura";
import { getLocais } from "@/lib/territorio";
import { hostPublico } from "@/lib/url";

import { RegistrarContato } from "./registrar-contato";
import { PromoverALideranca } from "./promover";

export const metadata: Metadata = { title: "Prontuário" };

const data = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function ProntuarioPage(props: PageProps<"/pessoas/[id]">) {
  const { id } = await props.params;
  const supabase = await createAuthClient();

  const pessoa = await getPessoa(supabase, id);
  if (!pessoa) notFound();

  const ehLideranca = pessoa.nivel === "lideranca";

  const [linhaDoTempo, indicados, estado, historico, envios, locais, templates] =
    await Promise.all([
      getLinhaDoTempo(supabase, id),
      ehLideranca ? getIndicados(supabase, id) : Promise.resolve([]),
      ehLideranca ? getEstadoDaLideranca(supabase, id) : Promise.resolve(null),
      ehLideranca ? getHistoricoTemperatura(supabase, id) : Promise.resolve([]),
      ehLideranca ? getHistoricoEnvios(supabase, id) : Promise.resolve([]),
      ehLideranca ? Promise.resolve([]) : getLocais(supabase),
      listarTemplates(supabase, true),
    ]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link
        href={ehLideranca ? "/liderancas" : "/pessoas"}
        className="font-display tracking-eyebrow text-eyebrow text-ink-3 hover:text-ink-2"
      >
        ← {ehLideranca ? "Lideranças" : "Pessoas"}
      </Link>

      {/* Camada 1 · identificação, com a origem automática */}
      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            {ehLideranca ? "Liderança" : "Apoiador"}
            {pessoa.origem === "link" ? " · entrou por link" : " · cadastro no admin"}
            {" · desde "}
            {data(pessoa.criado_em)}
          </p>
          <h1 className="font-display tracking-display mt-2 text-section text-ink">
            {pessoa.nome}
          </h1>
          <p className="font-data mt-2 text-small text-ink-2">
            {formatarTelefone(pessoa.telefone)}
            {pessoa.instagram_handle ? ` · @${pessoa.instagram_handle}` : ""}
          </p>
        </div>

        {ehLideranca && estado && (
          <div className="text-right">
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Estado
            </p>
            <p className="mt-1 flex items-center justify-end gap-2 text-body text-ink">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ background: TEMPERATURA[estado.estado].cor }}
              />
              {TEMPERATURA[estado.estado].rotulo}
            </p>
            <p className="font-data mt-1 text-tiny text-ink-3">
              {estado.cadastros}/{estado.meta} cadastros
              {estado.dias_parada !== null ? ` · ${estado.dias_parada}d parada` : ""}
            </p>
          </div>
        )}
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Dado rotulo="Onde vota" valor={pessoa.local?.nome ?? (pessoa.fora_do_municipio ? "Outro município" : "não informado")} apoio={pessoa.local ? `${pessoa.bairro?.nome ?? ""} · ${pessoa.local.regiao}` : ""} />
        <Dado rotulo="Bairro onde mora" valor={pessoa.bairro?.nome ?? "não informado"} />
        <Dado
          rotulo="Quem trouxe"
          valor={pessoa.quem_indicou?.nome ?? "cadastro direto"}
          apoio={pessoa.quem_indicou ? "atribuição registrada" : "sem indicação"}
          href={pessoa.quem_indicou ? `/pessoas/${pessoa.quem_indicou.id}` : undefined}
        />
        <Dado
          rotulo={ehLideranca ? "Link de captação" : "Situação"}
          valor={ehLideranca ? (pessoa.slug ? "ativo" : "sem link") : pessoa.ativo ? "Ativo" : "Inativo"}
          apoio={ehLideranca && pessoa.slug ? `${hostPublico()}/${pessoa.slug}` : ""}
        />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        {/* Camada 2 · linha do tempo unificada */}
        <div className="flex flex-col gap-4">
          <RegistrarContato pessoaId={id} />

          <section
            className="overflow-hidden rounded-lg border border-line"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
              <h2 className="font-display tracking-card text-card text-ink">
                Linha do tempo
              </h2>
              <p className="font-data text-tiny text-ink-3">
                {linhaDoTempo.length} {linhaDoTempo.length === 1 ? "registro" : "registros"}
              </p>
            </div>

            {linhaDoTempo.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-body text-ink">Ainda não há história aqui.</p>
                <p className="mx-auto mt-2 max-w-sm text-small text-ink-2">
                  O prontuário se preenche por evento. Registre o primeiro
                  contato acima e ele começa a existir.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {linhaDoTempo.map((item) => (
                  <li key={`${item.especie}-${item.id}`} className="px-5 py-4">
                    {item.especie === "interacao" ? (
                      <>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display tracking-card text-eyebrow text-ink-3">
                            {TIPO_INTERACAO[item.tipo]}
                            {item.canal ? ` · ${item.canal}` : ""}
                          </p>
                          <p className="font-data text-tiny text-ink-3">
                            {dataHora(item.em)}
                            {item.autor_nome ? ` · ${item.autor_nome}` : ""}
                          </p>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-small text-ink">
                          {item.descricao}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display tracking-card text-eyebrow text-ink-3">
                            Demanda
                            {item.categoria ? ` · ${item.categoria}` : ""}
                          </p>
                          <p className="font-data text-tiny text-ink-3">
                            {dataHora(item.em)}
                          </p>
                        </div>
                        <p className="mt-1.5 text-small font-medium text-ink">
                          {item.titulo}
                        </p>
                        {item.descricao && (
                          <p className="mt-1 whitespace-pre-wrap text-small text-ink-2">
                            {item.descricao}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-2 text-tiny">
                          <span
                            className={`rounded-full border px-2 py-0.5 ${
                              STATUS_DEMANDA[item.status].aberta
                                ? "border-line-2 text-ink"
                                : "border-line text-ink-3"
                            }`}
                          >
                            {STATUS_DEMANDA[item.status].rotulo}
                          </span>
                          {item.resolvida_em && (
                            <span className="font-data text-ink-3">
                              fechada em {data(item.resolvida_em)}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Camada 3 · bloco da liderança, ou o convite para promover */}
        <div className="flex flex-col gap-4">
          {ehLideranca ? (
            <>
              {pessoa.slug && estado && (
                <section
                  className="rounded-lg border border-line p-5"
                  style={{ background: "var(--card-bg)" }}
                >
                  <h2 className="font-display tracking-card text-card text-ink">
                    Mensagem
                  </h2>
                  <div className="mt-3">
                    <BotaoEnvio
                      destino={estado}
                      templates={templates}
                      urlBase={hostPublico()}
                      templatePadrao={estado.enviado_em === null ? "boas_vindas" : "cutucada"}
                    />
                  </div>

                  {envios.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
                      {envios.slice(0, 6).map((e) => (
                        <li
                          key={e.id}
                          className="flex items-baseline justify-between gap-2 text-tiny"
                        >
                          <span className={e.confirmado ? "text-ink-2" : "text-ink-3 line-through"}>
                            {e.template_nome ?? "envio"}
                          </span>
                          <span className="font-data text-ink-3">{dataHora(e.enviado_em)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {historico.length > 0 && (
                <section
                  className="rounded-lg border border-line p-5"
                  style={{ background: "var(--card-bg)" }}
                >
                  <h2 className="font-display tracking-card text-card text-ink">
                    Histórico de temperatura
                  </h2>
                  <div className="mt-4 flex items-end gap-1">
                    {historico.map((h) => (
                      <div
                        key={h.calculado_em}
                        title={`${data(h.calculado_em)} · ${TEMPERATURA[h.estado].rotulo} · ${h.cadastros} cadastros`}
                        className="h-10 flex-1 rounded-t-[2px]"
                        style={{ background: TEMPERATURA[h.estado].cor }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-tiny text-ink-3">
                    Uma barra por semana. Mostra quem está subindo e quem está
                    caindo, não só onde está hoje.
                  </p>
                </section>
              )}

              <section
                className="overflow-hidden rounded-lg border border-line"
                style={{ background: "var(--card-bg)" }}
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
                  <h2 className="font-display tracking-card text-card text-ink">
                    Quem ela trouxe
                  </h2>
                  <p className="font-data text-tiny text-ink-3">{indicados.length}</p>
                </div>

                {indicados.length === 0 ? (
                  <p className="px-5 py-8 text-center text-small text-ink-2">
                    O link ainda não trouxe ninguém.
                  </p>
                ) : (
                  <ul className="max-h-96 divide-y divide-[var(--line)] overflow-auto">
                    {indicados.map((p) => (
                      <li key={p.id} className="px-5 py-2.5">
                        <Link
                          href={`/pessoas/${p.id}`}
                          className="text-small text-ink hover:underline"
                        >
                          {p.nome}
                        </Link>
                        <p className="font-data text-tiny text-ink-3">
                          {data(p.criado_em)}
                          {p.local_nome ? ` · ${p.local_nome}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <PromoverALideranca
              pessoaId={id}
              nome={pessoa.nome}
              locais={locais}
              quemTrouxe={pessoa.quem_indicou?.nome ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Dado({
  rotulo,
  valor,
  apoio,
  href,
}: {
  rotulo: string;
  valor: string;
  apoio?: string;
  href?: string;
}) {
  const conteudo = (
    <>
      <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">{rotulo}</p>
      <p className="mt-1.5 text-small text-ink">{valor}</p>
      {apoio ? <p className="font-data mt-0.5 text-tiny text-ink-3">{apoio}</p> : null}
    </>
  );

  return (
    <div
      className="rounded-lg border border-line px-5 py-4"
      style={{ background: "var(--card-bg)" }}
    >
      {href ? (
        <Link href={href} className="block hover:opacity-80">
          {conteudo}
        </Link>
      ) : (
        conteudo
      )}
    </div>
  );
}
