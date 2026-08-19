import { Baloo_2, Nunito } from "next/font/google";

import "./campanha.css";

/**
 * A superfície da campanha.
 *
 * Terceira superfície do sistema, ao lado do painel (preto, ferramenta) e do
 * convite (papel claro, captação de apoiador). Esta aqui é a identidade do
 * Vereador Pedro Abreu, e só aparece onde a liderança é o interlocutor.
 *
 * As fontes são carregadas neste layout, e não no raiz, para o painel não
 * pagar o download de duas famílias que ele nunca usa.
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

export default function CampanhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`campanha ${display.variable} ${corpo.variable} flex min-h-dvh w-full items-center justify-center p-4 sm:p-8`}
    >
      {children}
    </div>
  );
}
