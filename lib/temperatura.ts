import type { TemperaturaCadastro } from "@/types/database";

/**
 * Rótulo e cor de cada estado do termômetro.
 *
 * A cor comunica URGÊNCIA DE AÇÃO, não temperatura literal: "afastado" é
 * vermelho por ser o estado que exige ação imediata, embora seja o mais frio
 * da escada. Em painel operacional, vermelho significa "abra e resolva".
 *
 * Estas seis cores não aparecem em nenhum outro contexto do sistema.
 */
export const ORDEM_TEMPERATURA: TemperaturaCadastro[] = [
  "afastado",
  "aguardando",
  "frio",
  "quente",
  "muito_quente",
  "engajado",
];

export const TEMPERATURA: Record<
  TemperaturaCadastro,
  { rotulo: string; cor: string; explicacao: string }
> = {
  aguardando: {
    rotulo: "Aguardando",
    cor: "var(--t-aguardando)",
    explicacao: "Link enviado há menos de 5 dias, ainda sem cadastros.",
  },
  afastado: {
    rotulo: "Afastado",
    cor: "var(--t-afastado)",
    explicacao: "Zero cadastros, com o link enviado há 5 dias ou mais.",
  },
  frio: {
    rotulo: "Frio",
    cor: "var(--t-frio)",
    explicacao: "1 a 4 cadastros, ou qualquer volume parado há 10 dias.",
  },
  quente: {
    rotulo: "Quente",
    cor: "var(--t-quente)",
    explicacao: "5 a 9 cadastros, com atividade nos últimos 10 dias.",
  },
  muito_quente: {
    rotulo: "Muito quente",
    cor: "var(--t-muito)",
    explicacao: "Meta batida, com atividade nos últimos 10 dias.",
  },
  engajado: {
    rotulo: "Engajado",
    cor: "var(--t-engajado)",
    explicacao: "20 ou mais cadastros, em 3 semanas distintas. Referência da rede.",
  },
};

export function ehTemperatura(v: string | undefined): v is TemperaturaCadastro {
  return v !== undefined && v in TEMPERATURA;
}
