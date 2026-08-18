import { ImageResponse } from "next/og";

import {
  CAMPANHA,
  CAMPANHA_INK,
  PAPER,
  PAPER_INK,
  PAPER_INK_2,
} from "@/lib/design-tokens";
import { getLiderancaPorSlug } from "@/lib/pessoas/publico";

/**
 * RF-12 · preview do link no WhatsApp.
 *
 * Link sem preview parece golpe e derruba a taxa de clique de forma
 * perceptível. Como o convite é pessoal, a imagem também é: quem recebe vê o
 * nome de quem convidou antes mesmo de abrir.
 */

export const alt = "Convite para apoiar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lideranca = await getLiderancaPorSlug(slug);
  const nome = lideranca?.nome ?? "Projeto REDE";

  const campanha = CAMPANHA();
  const campanhaInk = CAMPANHA_INK();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER(),
        }}
      >
        <div style={{ height: 16, background: campanha }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 88px",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: PAPER_INK_2(),
            }}
          >
            Convite de
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: nome.length > 26 ? 74 : 92,
              fontWeight: 600,
              lineHeight: 1.05,
              color: PAPER_INK(),
            }}
          >
            {nome}
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "18px 34px",
              borderRadius: 99,
              background: campanha,
              color: campanhaInk,
              fontSize: 30,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Confirmar apoio
          </div>

          <div style={{ marginTop: 36, fontSize: 28, color: PAPER_INK_2() }}>
            Quatro campos. Menos de um minuto.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
