import type { Metadata } from "next";
import Link from "next/link";

import { BotaoEnvio } from "@/components/admin/botao-envio";
import { FilaDeEnvio } from "@/components/admin/fila-de-envio";
import { DIGITAL, getDigitalDasLiderancas } from "@/lib/instagram/queries";
import {
  listarLiderancasComEstado,
  listarTemplates,
  tagsPorPessoa,
} from "@/lib/mensagens/queries";
import { listarTags } from "@/lib/pessoas/queries";
import { nomeCompleto } from "@/lib/pessoas/nome";
import { formatarTelefone } from "@/lib/pessoas/telefone";
import { createAuthClient } from "@/lib/supabase/auth";
import { TEMPERATURA, ehTemperatura } from "@/lib/temperatura";
import { REGIAO_LABEL, getBairros } from "@/lib/territorio";
import { hostPublico } from "@/lib/url";
import type { MacroRegiao } from "@/types/database";

import { Filtros } from "./filtros";
import { Pendentes } from "./pendentes";

export const metadata: Metadata = { title: "Lideranças" };

const REGIOES: MacroRegiao[] = ["R1", "R2", "R3"];

function ehRegiao(v: string): v is MacroRegiao {
  return (REGIOES as string[]).includes(v);
}

export default async function LiderancasPage(props: PageProps<"/liderancas">) {
  const params = await props.searchParams;
  const primeiro = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const busca = primeiro(params.busca) ?? "";
  const bairroId = primeiro(params.bairro) ?? "";
  const regiao = primeiro(params.regiao) ?? "";
  const tagId = primeiro(params.tag) ?? "";
  const estadoParam = primeiro(params.estado);

  const supabase = await createAuthClient();

  const [bairros, tags, templates, mapaTags, digital, listaBruta] = await Promise.all([
    getBairros(supabase),
    listarTags(supabase),
    listarTemplates(supabase, true),
    tagsPorPessoa(supabase),
    getDigitalDasLiderancas(supabase),
    listarLiderancasComEstado(supabase, {
      busca,
      bairroId: bairroId || undefined,
      regiao: ehRegiao(regiao) ? regiao : undefined,
      estado: ehTemperatura(estadoParam) ? estadoParam : undefined,
    }),
  ]);

  // Tag filtra em memória: são 70 lideranças, e cruzar no banco exigiria um
  // inner join que a view não expõe.
  const liderancas = tagId
    ? listaBruta.filter((l) => (mapaTags.get(l.id) ?? []).some((t) => t.id === tagId))
    : listaBruta;

  // Dois termômetros, nunca combinados num número só: quem cadastra 20 e não
  // comenta é um problema diferente de quem comenta em tudo e cadastra zero.
  const porPessoa = new Map(digital.map((d) => [d.pessoa_id, d]));

  const host = hostPublico();
  const filtrando = Boolean(busca || bairroId || regiao || tagId || estadoParam);

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            Rede · {liderancas.length}{" "}
            {liderancas.length === 1 ? "liderança" : "lideranças"}
            {filtrando ? " no filtro" : ""}
          </p>
          <h1 className="font-display tracking-display mt-2 text-section text-ink">
            Lideranças
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilaDeEnvio
            liderancas={liderancas}
            templates={templates}
            urlBase={host}
            templatePadrao={estadoParam === "afastado" ? "cutucada" : "boas_vindas"}
          />
          <Link
            href="/liderancas/nova"
            className="font-display tracking-card inline-flex h-11 items-center rounded-full bg-primary px-5 text-card text-primary-foreground transition-opacity duration-[var(--dur-micro)] hover:opacity-90"
          >
            Nova liderança
          </Link>
        </div>
      </header>

      {/* Quem se cadastrou sozinho e ainda não foi avaliado. Enquanto está
          aqui, o link exclusivo devolve 404. */}
      <Pendentes
        pendentes={listaBruta
          .filter((l) => !l.ativo)
          .map((l) => ({
            id: l.id,
            nome: l.nome,
            apelido: l.apelido,
            telefone: l.telefone,
            slug: l.slug,
            bairro_nome: l.bairro_nome,
            local_nome: l.local_nome,
          }))}
        host={host}
      />

      <Filtros
        bairros={bairros}
        tags={tags}
        regioes={REGIOES.map((r) => ({ codigo: r, nome: REGIAO_LABEL[r] }))}
        valores={{ busca, bairroId, regiao, tagId, estado: estadoParam ?? "" }}
      />

      {liderancas.length === 0 ? (
        <div
          className="mt-4 rounded-lg border border-line px-6 py-12 text-center"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="text-body text-ink">
            {filtrando ? "Nenhuma liderança nesse recorte." : "A rede começa aqui."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
            {filtrando
              ? "Tire um filtro para ver mais."
              : "Cadastre a primeira liderança e o link de captação dela sai pronto para o WhatsApp."}
          </p>
          {!filtrando && (
            <Link
              href="/liderancas/nova"
              className="font-display tracking-card mt-6 inline-flex h-11 items-center rounded-full bg-primary px-5 text-card text-primary-foreground"
            >
              Cadastrar a primeira
            </Link>
          )}
        </div>
      ) : (
        <div
          className="mt-4 overflow-hidden rounded-lg border border-line"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Liderança</Th>
                  <Th>Vota em</Th>
                  <Th>Tags</Th>
                  <Th className="text-right">Cadastros</Th>
                  <Th>Estado</Th>
                  <Th>Digital</Th>
                  <Th className="text-right">Parada</Th>
                  <Th>Ação</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {liderancas.map((l) => {
                  const progresso =
                    l.meta > 0 ? Math.min(100, (100 * l.cadastros) / l.meta) : 0;
                  const cor = TEMPERATURA[l.estado];

                  return (
                    <tr key={l.id} className="align-top">
                      <td className="px-5 py-3">
                        <Link
                          href={`/liderancas/${l.id}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {nomeCompleto(l.nome, l.apelido)}
                        </Link>
                        <p className="font-data text-tiny text-ink-3">
                          {formatarTelefone(l.telefone)}
                          {l.instagram_handle ? ` · @${l.instagram_handle}` : ""}
                        </p>
                        {l.slug && (
                          <p className="font-data text-tiny text-ink-3">
                            {host}/{l.slug}
                          </p>
                        )}
                        {!l.ativo && (
                          <p className="font-display tracking-eyebrow mt-1 text-eyebrow text-ink-3">
                            Inativa
                          </p>
                        )}
                      </td>

                      <td className="px-2 py-3 text-ink-2">
                        {l.local_nome ?? (
                          <span className="text-t-afastado">sem colégio</span>
                        )}
                        <p className="font-data text-tiny text-ink-3">
                          {l.bairro_nome ?? "—"}
                          {l.regiao ? ` · ${l.regiao}` : ""}
                        </p>
                      </td>

                      <td className="px-2 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(mapaTags.get(l.id) ?? []).map((t) => (
                            <span
                              key={t.id}
                              className="font-display tracking-card rounded-full border border-line px-2 py-0.5 text-eyebrow text-ink-3"
                            >
                              {t.nome}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-2 py-3 text-right">
                        <p className="font-data text-ink">
                          {l.cadastros}
                          <span className="text-ink-3">/{l.meta}</span>
                        </p>
                        <div className="mt-1.5 ml-auto h-1 w-20 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full"
                            style={{ width: `${progresso}%`, background: cor.cor }}
                          />
                        </div>
                      </td>

                      <td className="px-2 py-3">
                        <span className="flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: cor.cor }}
                          />
                          <span className="text-ink-2">{cor.rotulo}</span>
                        </span>
                        {l.enviado_em === null && (
                          <p className="text-tiny text-ink-3">link não enviado</p>
                        )}
                      </td>

                      <td className="px-2 py-3">
                        {(() => {
                          const d = porPessoa.get(l.id);
                          if (!d || !d.estado_digital) {
                            return <span className="text-tiny text-ink-3">—</span>;
                          }
                          return (
                            <>
                              <span className="flex items-center gap-1.5">
                                <span
                                  aria-hidden
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ background: DIGITAL[d.estado_digital].cor }}
                                />
                                <span className="text-ink-2">
                                  {DIGITAL[d.estado_digital].rotulo}
                                </span>
                              </span>
                              <p className="font-data text-tiny text-ink-3">
                                {d.presencas}/{d.janela} posts
                              </p>
                            </>
                          );
                        })()}
                      </td>

                      <td className="font-data px-2 py-3 text-right text-ink-2">
                        {l.dias_parada === null ? "—" : `${l.dias_parada}d`}
                      </td>

                      <td className="px-5 py-3">
                        <BotaoEnvio
                          destino={l}
                          templates={templates}
                          templatePadrao={
                            l.enviado_em === null ? "boas_vindas" : "cutucada"
                          }
                          urlBase={host}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3 [&:not(:first-child):not(:last-child)]:px-2 ${className}`}
    >
      {children}
    </th>
  );
}
