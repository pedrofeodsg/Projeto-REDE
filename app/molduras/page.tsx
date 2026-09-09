import type { Metadata } from "next";
import Image from "next/image";

import { MOLDURAS } from "@/lib/molduras/catalogo";
import { hostPublico } from "@/lib/url";

import { Estudio } from "./estudio";

export const metadata: Metadata = {
  title: "Molduras",
  description: "Coloque a sua foto na moldura da campanha e poste no story.",
  // Esta é a única página do sistema que existe para ser espalhada, então é a
  // única que convida buscador. Nada aqui toca a base de pessoas.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Faça a sua moldura · Vereador Pedro Abreu",
    description:
      "Escolha a moldura, coloque a sua foto e baixe pronta pro story. Leva 30 segundos.",
  },
};

export default function MoldurasPage() {
  const link = hostPublico() + "/molduras";

  return (
    <>
      <header className="mb-7 text-center sm:mb-9">
        <Image
          src="/marca-pedro-abreu.png"
          alt="Vereador Pedro Abreu"
          width={940}
          height={200}
          priority
          className="mx-auto h-12 w-auto brightness-0 invert sm:h-14"
        />

        <p className="font-marca mt-5 text-[13px] font-extrabold uppercase tracking-[0.2em] text-marca-amarelo">
          Molduras da campanha
        </p>
        <h1 className="font-marca mx-auto mt-1.5 max-w-[16ch] text-[38px] font-extrabold leading-[0.95] sm:text-[54px]">
          Bota a sua cara<span className="text-marca-amarelo">.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-[16px] leading-snug text-white/75 sm:text-[17px]">
          Escolha a moldura, coloque a sua foto e baixe pronta pro story. Leva
          menos de um minuto e não precisa de nenhum aplicativo.
        </p>
      </header>

      <Estudio molduras={MOLDURAS} link={link} />

      <section className="vidro mt-6 rounded-[22px] p-5 sm:p-6">
        <h2 className="font-marca text-[13px] font-extrabold uppercase tracking-[0.16em] text-marca-amarelo">
          Por que isso importa
        </h2>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-white/80">
          Um story seu vale mais que dez posts nossos. Quem te segue conhece
          você, confia em você e vota em quem você indica. É assim que a
          campanha chega em gente que a gente sozinho nunca alcançaria.
        </p>
        <p className="mt-3 max-w-[70ch] text-[14px] leading-relaxed text-white/60">
          A montagem acontece dentro do seu próprio celular. A sua foto não é
          enviada para lugar nenhum e não fica guardada em nenhum servidor.
        </p>
      </section>

      <footer className="mt-8 pb-4 text-center text-[13px] font-semibold text-white/45">
        {link}
      </footer>
    </>
  );
}
