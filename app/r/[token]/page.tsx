import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Relatorio } from "@/components/admin/relatorio";
import { montarRelatorio } from "@/lib/exportacao/montar";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Visão de leitura para o candidato (RF-41).
 *
 * Sem login, com token não adivinhável, limitada ao perfil que o link carrega.
 * Lida por service role no servidor: nada do Supabase chega ao navegador, e o
 * dado nunca sai do servidor — arquivo circula, link se revoga.
 *
 * O perfil `interno` nunca gera link, então nunca chega aqui. Ainda assim a
 * rota recusa explicitamente, porque a defesa que depende de outra camada
 * estar correta não é defesa.
 */
export const metadata: Metadata = {
  title: "Prestação de contas",
  robots: { index: false, follow: false },
};

export default async function RelatorioPublicoPage(
  props: PageProps<"/r/[token]">,
) {
  const { token } = await props.params;
  const supabase = createServerClient();

  const { data: exportacao } = await supabase
    .from("exportacoes")
    .select("id, perfil, revogado, visitas")
    .eq("token", token)
    .maybeSingle();

  if (!exportacao || exportacao.revogado) notFound();
  if (exportacao.perfil === "interno") notFound();

  const relatorio = await montarRelatorio(supabase, exportacao.perfil);

  // Registra a abertura. Falhar aqui não pode derrubar a leitura.
  await supabase
    .from("exportacoes")
    .update({ visitas: exportacao.visitas + 1, visto_em: new Date().toISOString() })
    .eq("id", exportacao.id);

  return (
    <div className="admin min-h-dvh bg-background px-5 py-10 sm:px-10">
      <Relatorio relatorio={relatorio} />
    </div>
  );
}
