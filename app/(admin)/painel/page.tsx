import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel",
};

export default function PainelPage() {
  return (
    <div>
      <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
        Visão geral
      </p>
      <h1 className="font-display tracking-display mt-2 text-section text-ink">
        Painel
      </h1>

      <p className="mt-6 max-w-prose text-body text-ink-2">
        A base territorial entra no Bloco 2. Os indicadores, o termômetro da
        rede e o bloco de cobrança entram no Bloco 3.
      </p>
    </div>
  );
}
