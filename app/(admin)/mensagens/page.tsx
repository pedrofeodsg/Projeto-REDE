import type { Metadata } from "next";

import { listarTemplates } from "@/lib/mensagens/queries";
import { createAuthClient } from "@/lib/supabase/auth";

import { ListaDeTemplates } from "./lista";

export const metadata: Metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const supabase = await createAuthClient();
  const templates = await listarTemplates(supabase);

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Motor de mensagens · {templates.length}{" "}
          {templates.length === 1 ? "template" : "templates"}
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Mensagens
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          Template é registro de banco, nunca texto travado no código: mensagem
          nova que exigisse deploy acabaria virando copiar e colar no bloco de
          notas. O envio continua sendo sempre um toque humano — nada dispara
          sozinho.
        </p>
      </header>

      <ListaDeTemplates templates={templates} />
    </div>
  );
}
