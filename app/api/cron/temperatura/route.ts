import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

/**
 * Snapshot semanal da temperatura de cada liderança (RF-14).
 *
 * Disparado pelo cron da Vercel, configurado em `vercel.json`. O histórico é o
 * que mostra quem está subindo e quem está caindo — o estado sozinho só diz
 * onde a pessoa está hoje.
 *
 * A gravação em si mora em SQL (`gravar_snapshot_temperatura`), e é idempotente
 * por dia: uma segunda chamada no mesmo dia não duplica linha, porque a série é
 * semanal e duplicata só sujaria o gráfico.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;

  // Em produção a rota é fechada. Sem o segredo definido ela recusa tudo, em
  // vez de ficar aberta por omissão.
  if (process.env.NODE_ENV === "production") {
    if (!segredo) {
      return NextResponse.json({ erro: "CRON_SECRET não configurado" }, { status: 503 });
    }
    if (request.headers.get("authorization") !== `Bearer ${segredo}`) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("gravar_snapshot_temperatura");

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ gravados: data ?? 0, em: new Date().toISOString() });
}
