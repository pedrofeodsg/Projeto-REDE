import type { Metadata } from "next";
import Link from "next/link";

import { formatarTelefone } from "@/lib/pessoas/telefone";
import { createAuthClient } from "@/lib/supabase/auth";
import { getBairros } from "@/lib/territorio";
import type { NivelPessoa } from "@/types/database";

import { BuscaDePessoas } from "./busca";

export const metadata: Metadata = { title: "Pessoas" };

const POR_PAGINA = 50;

function ehNivel(v: string): v is NivelPessoa {
  return v === "lideranca" || v === "apoiador" || v === "coordenacao";
}

type LinhaPessoa = {
  id: string;
  nome: string;
  telefone: string;
  nivel: string;
  origem: string;
  criado_em: string;
  fora_do_municipio: boolean;
  local: { nome: string } | null;
  quem_indicou: { id: string; nome: string } | null;
};

export default async function PessoasPage(props: PageProps<"/pessoas">) {
  const params = await props.searchParams;
  const primeiro = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const busca = primeiro(params.busca) ?? "";
  const nivel = primeiro(params.nivel) ?? "";
  const pagina = Math.max(1, Number(primeiro(params.p) ?? 1) || 1);

  const supabase = await createAuthClient();

  let query = supabase
    .from("pessoas")
    .select(
      `id, nome, telefone, nivel, origem, criado_em, fora_do_municipio,
       local:locais_votacao ( nome ),
       quem_indicou:pessoas!indicado_por ( id, nome )`,
      { count: "exact" },
    )
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (ehNivel(nivel)) query = query.eq("nivel", nivel);

  if (busca.trim()) {
    const termo = busca.trim();
    const digitos = termo.replace(/\D/g, "");
    query =
      digitos.length >= 4
        ? query.or(`nome.ilike.%${termo}%,telefone.ilike.%${digitos}%`)
        : query.ilike("nome", `%${termo}%`);
  }

  const [{ data, count, error }, bairros] = await Promise.all([
    query.returns<LinhaPessoa[]>(),
    getBairros(supabase),
  ]);

  if (error) throw new Error(error.message);

  const pessoas = data ?? [];
  const total = count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Base completa · {total.toLocaleString("pt-BR")}{" "}
          {total === 1 ? "pessoa" : "pessoas"}
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Pessoas
        </h1>
      </header>

      <BuscaDePessoas valores={{ busca, nivel }} />

      {pessoas.length === 0 ? (
        <div
          className="mt-4 rounded-lg border border-line px-6 py-12 text-center"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="text-body text-ink">
            {busca || nivel ? "Ninguém nesse recorte." : "A base ainda está vazia."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
            {busca || nivel
              ? "Tire um filtro para ver mais."
              : "Ela cresce sozinha conforme as lideranças compartilham o link."}
          </p>
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
                  <th className="font-display tracking-eyebrow px-5 py-2 text-eyebrow font-normal text-ink-3">Pessoa</th>
                  <th className="font-display tracking-eyebrow px-2 py-2 text-eyebrow font-normal text-ink-3">Onde vota</th>
                  <th className="font-display tracking-eyebrow px-2 py-2 text-eyebrow font-normal text-ink-3">Quem trouxe</th>
                  <th className="font-display tracking-eyebrow px-5 py-2 text-right text-eyebrow font-normal text-ink-3">Entrou</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {pessoas.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/pessoas/${p.id}`}
                        className="text-ink hover:underline"
                      >
                        {p.nome}
                      </Link>
                      <p className="font-data text-tiny text-ink-3">
                        {formatarTelefone(p.telefone)}
                        {p.nivel === "lideranca" ? " · liderança" : ""}
                      </p>
                    </td>
                    <td className="px-2 py-2.5 text-ink-2">
                      {p.fora_do_municipio ? (
                        <span className="text-ink-3">outro município</span>
                      ) : (
                        (p.local?.nome ?? <span className="text-ink-3">—</span>)
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      {p.quem_indicou ? (
                        <Link
                          href={`/pessoas/${p.quem_indicou.id}`}
                          className="text-ink-2 hover:underline"
                        >
                          {p.quem_indicou.nome}
                        </Link>
                      ) : (
                        <span className="text-ink-3">cadastro direto</span>
                      )}
                    </td>
                    <td className="font-data px-5 py-2.5 text-right text-tiny text-ink-3">
                      {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                      {p.origem === "link" ? " · link" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginas > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
              <p className="font-data text-tiny text-ink-3">
                página {pagina} de {paginas}
              </p>
              <div className="flex gap-2">
                {pagina > 1 && (
                  <Paginacao
                    href={`/pessoas?${new URLSearchParams({ busca, nivel, p: String(pagina - 1) })}`}
                  >
                    Anterior
                  </Paginacao>
                )}
                {pagina < paginas && (
                  <Paginacao
                    href={`/pessoas?${new URLSearchParams({ busca, nivel, p: String(pagina + 1) })}`}
                  >
                    Próxima
                  </Paginacao>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-tiny text-ink-3">
        {bairros.length} bairros na base territorial. Quem vota fora do município
        aparece aqui e fica fora do cálculo de penetração.
      </p>
    </div>
  );
}

function Paginacao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-display tracking-card rounded-full border border-line px-3 py-1.5 text-tiny text-ink-2 hover:text-ink"
    >
      {children}
    </Link>
  );
}
