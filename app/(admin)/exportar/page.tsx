import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Relatorio } from "@/components/admin/relatorio";
import { exigirOperador } from "@/lib/auth/operador";
import { montarRelatorio } from "@/lib/exportacao/montar";
import { PERFIL, type PerfilExportacao } from "@/lib/exportacao/perfis";
import { createAuthClient } from "@/lib/supabase/auth";
import { urlPublicaBase } from "@/lib/url";

import { GerarLink, ListaDeLinks } from "./links";

export const metadata: Metadata = { title: "Exportar" };

function ehPerfil(v: string | undefined): v is PerfilExportacao {
  return v === "interno" || v === "candidato" || v === "publico";
}

export default async function ExportarPage(props: PageProps<"/exportar">) {
  const operador = await exigirOperador();

  // RF-02: operador não exporta. A policy do banco já barra a escrita; isto
  // evita a tela existir para quem não pode usá-la.
  if (operador.papel !== "coordenacao") notFound();

  const params = await props.searchParams;
  const bruto = Array.isArray(params.perfil) ? params.perfil[0] : params.perfil;
  const perfil: PerfilExportacao = ehPerfil(bruto) ? bruto : "candidato";

  const supabase = await createAuthClient();

  const [relatorio, links] = await Promise.all([
    montarRelatorio(supabase, perfil),
    supabase
      .from("exportacoes")
      .select("id, perfil, token, revogado, rotulo, gerado_em, visitas, visto_em")
      .order("gerado_em", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Prestação de contas
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Exportar
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          O relatório para os candidatos é um produto diferente do painel: a
          coordenação usa o painel para trabalhar, o candidato usa o relatório
          para decidir onde põe recurso e palanque.
        </p>
      </header>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <GerarLink perfilAtual={perfil} />
          <ListaDeLinks links={links.data ?? []} urlBase={urlPublicaBase()} />
        </div>

        <div
          className="overflow-hidden rounded-lg border border-line px-6 py-8 sm:px-10"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="font-display tracking-card mb-6 text-eyebrow text-ink-3">
            Prévia · perfil {PERFIL[perfil].rotulo}
          </p>
          <Relatorio relatorio={relatorio} />
        </div>
      </div>
    </div>
  );
}
