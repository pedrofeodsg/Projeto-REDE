import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A imagem de preview do WhatsApp lê a cor da campanha direto do arquivo de
  // design, para a cor continuar existindo em um lugar só. Sem isto o arquivo
  // não sobe junto no deploy e a imagem cairia na cor padrão.
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": ["./docs/design-tokens.css"],
  },
};

export default nextConfig;
