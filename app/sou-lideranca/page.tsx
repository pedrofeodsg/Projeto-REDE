import type { Metadata } from "next";
import Image from "next/image";

import { getTerritorioPublico } from "@/lib/pessoas/publico";

import { FormularioLideranca } from "./formulario";

// A lista de bairros e colégios vem do banco. Estática, a página assaria essa
// lista no build — e o build passaria a depender do banco estar de pé. A rota
// irmã /[slug] já é dinâmica pelo mesmo motivo.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadastro de Lideranças",
  description: "Conta pra gente quem é você.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Cadastro de Lideranças · Vereador Pedro Abreu",
    description: "Bora somar. Conta pra gente quem é você.",
  },
};

export default async function CadastroDeLiderancaPage() {
  const { bairros, locais } = await getTerritorioPublico();

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-6 flex items-center justify-center">
        <Image
          src="/marca-pedro-abreu.png"
          alt="Vereador Pedro Abreu"
          width={940}
          height={200}
          priority
          className="h-16 w-auto sm:h-20"
        />
      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_-24px_rgba(20,58,126,0.4)] ring-1 ring-marca-azul/5">
        {/* Faixa do topo */}
        <div className="relative overflow-hidden bg-marca-azul px-7 pb-14 pt-8 text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 22px)",
            }}
          />
          <div className="relative">
            <p className="font-marca text-[13px] font-semibold uppercase tracking-[0.18em] text-marca-amarelo">
              Cadastro de Lideranças
            </p>
            <h1 className="font-marca mt-1 text-[32px] font-extrabold leading-[0.95] sm:text-[40px]">
              Bora somar<span className="text-marca-verde">.</span>
            </h1>
            <p className="mt-2 max-w-[38ch] text-[15px] leading-snug text-white/75 sm:text-[16px]">
              Cada liderança que entra fortalece a caminhada. Conta pra gente
              quem é você.
            </p>
          </div>

          <svg
            className="absolute -bottom-px left-0 w-full text-white"
            viewBox="0 0 560 40"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 24 C 140 4 210 40 320 26 C 430 12 500 30 560 18 L560 40 L0 40 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* O recado que o Pedro pediu: o convite é de quem recebeu. */}
        <div className="mx-6 mt-5 rounded-2xl bg-marca-azul-claro px-4 py-3 sm:mx-7">
          <p className="font-marca text-[14px] font-bold text-marca-azul">
            Este convite é seu.
          </p>
          <p className="mt-0.5 text-[14px] leading-snug text-marca-tinta/70">
            Ele foi enviado só para você e não vale para outra pessoa. Preencha
            com os seus dados — depois você recebe a sua página exclusiva, e
            todo apoiador que entrar por ela fica registrado como seu.
          </p>
        </div>

        <FormularioLideranca bairros={bairros} locais={locais} />
      </div>
    </div>
  );
}
