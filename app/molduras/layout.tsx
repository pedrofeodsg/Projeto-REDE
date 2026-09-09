import { Baloo_2, Nunito } from "next/font/google";

import "./molduras.css";

/**
 * A superfície das molduras.
 *
 * Mesmas duas famílias da página de lideranças — é a mesma marca falando —
 * carregadas aqui e não na raiz para o painel não pagar o download.
 */

const display = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-marca-display",
  display: "swap",
});

const corpo = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-marca-body",
  display: "swap",
});

export default function MoldurasLayout({ children }: LayoutProps<"/molduras">) {
  return (
    <div
      className={`molduras ${display.variable} ${corpo.variable} min-h-dvh w-full px-4 py-8 sm:px-6 sm:py-12`}
    >
      <div className="relative mx-auto w-full max-w-[1120px]">{children}</div>
    </div>
  );
}
