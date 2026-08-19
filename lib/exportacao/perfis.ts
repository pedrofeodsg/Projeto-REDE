/**
 * Os três perfis de exportação, definidos aqui e em nenhum outro lugar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INVARIANTE 8, TRAVADA NO TIPO
 *
 * `RelatorioCandidato` não tem campo de telefone. Não tem campo de apoiador
 * nominal. Não é que a query não busque — é que não existe onde colocar.
 *
 * A base é o ativo de negociação da estrutura. Entregue o contato e o
 * candidato fala direto: a liderança local vira intermediário dispensável.
 * Isso não é desconfiança, é como a relação funciona.
 *
 * `scanearVazamento()` faz a segunda checagem, em tempo de execução, e o teste
 * do bloco falha se qualquer coisa que pareça contato aparecer no payload.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type PerfilExportacao = "interno" | "candidato" | "publico";

export const PERFIL: Record<
  PerfilExportacao,
  { rotulo: string; descricao: string; compartilhavel: boolean }
> = {
  interno: {
    rotulo: "Interno",
    descricao: "Tudo, nominal, com contato. Só para a coordenação.",
    compartilhavel: false,
  },
  candidato: {
    rotulo: "Candidato",
    descricao:
      "Agregados territoriais, curva semanal e lideranças nominais sem telefone. Nenhum apoiador nominal.",
    compartilhavel: true,
  },
  publico: {
    rotulo: "Público",
    descricao: "Só números-síntese, sem nome nenhum.",
    compartilhavel: true,
  },
};

// ── as formas que saem da organização ──────────────────────────────────────

export type NumerosSintese = {
  cadastrados: number;
  eleitorado: number;
  penetracaoPct: number;
  liderancasAtivas: number;
  liderancasTotal: number;
  colegiosCobertos: number;
  colegiosTotal: number;
};

export type LinhaRegiao = {
  regiao: string;
  nome: string;
  eleitores: number;
  eleitoradoPct: number;
  cadastros: number;
  cadastrosPct: number;
  desvioPp: number;
};

export type LinhaColegio = {
  nome: string;
  bairro: string;
  regiao: string;
  eleitores: number;
  cadastros: number;
  penetracaoPct: number;
  temAncora: boolean;
};

export type PontoDaCurva = {
  semana: string;
  novos: number;
  acumulado: number;
};

/**
 * Liderança no relatório do candidato.
 *
 * Nome, bairro e volume. E só. Não existe campo de telefone nesta forma, e é
 * por isso que ele não pode vazar por descuido de query.
 */
export type LiderancaSemContato = {
  nome: string;
  bairro: string;
  regiao: string;
  cadastros: number;
};

export type RelatorioCandidato = {
  perfil: "candidato";
  estrutura: string;
  municipio: string;
  extraidoEm: string;
  fonteTerritorial: string;
  numeros: NumerosSintese;
  regioes: LinhaRegiao[];
  colegios: LinhaColegio[];
  curva: PontoDaCurva[];
  projecao: { ate: string; estimado: number } | null;
  liderancas: LiderancaSemContato[];
};

export type RelatorioPublico = {
  perfil: "publico";
  estrutura: string;
  municipio: string;
  extraidoEm: string;
  numeros: NumerosSintese;
  regioes: Omit<LinhaRegiao, "nome">[];
};

/** O interno é o único que carrega contato, e nunca sai por link. */
export type RelatorioInterno = {
  perfil: "interno";
  estrutura: string;
  municipio: string;
  extraidoEm: string;
  numeros: NumerosSintese;
  regioes: LinhaRegiao[];
  colegios: LinhaColegio[];
  curva: PontoDaCurva[];
  liderancas: (LiderancaSemContato & { telefone: string; meta: number })[];
};

export type Relatorio = RelatorioCandidato | RelatorioPublico | RelatorioInterno;

// ── a segunda trava, em tempo de execução ──────────────────────────────────

const CHAVES_PROIBIDAS = /telefone|whatsapp|celular|contato|email|e_mail|fone/i;

/** 12 ou 13 dígitos começando em 55 — o formato canônico da base. */
const TELEFONE = /\b55\d{10,11}\b/;

/** (22) 99999-9999, +55 22 99999-9999 e variações. */
const TELEFONE_MASCARADO = /\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}/;

export type Vazamento = { caminho: string; motivo: string };

/**
 * Varre um payload inteiro atrás de qualquer coisa que pareça contato.
 *
 * Roda no teste do bloco e antes de gravar qualquer link compartilhável. Se um
 * dia alguém acrescentar um campo por conveniência, isto quebra antes de o
 * link sair.
 */
export function scanearVazamento(valor: unknown, caminho = "$"): Vazamento[] {
  const achados: Vazamento[] = [];

  if (valor === null || valor === undefined) return achados;

  if (typeof valor === "string") {
    if (TELEFONE.test(valor)) {
      achados.push({ caminho, motivo: "texto com telefone no formato da base" });
    } else if (TELEFONE_MASCARADO.test(valor)) {
      achados.push({ caminho, motivo: "texto com telefone mascarado" });
    }
    return achados;
  }

  if (Array.isArray(valor)) {
    valor.forEach((item, i) => {
      achados.push(...scanearVazamento(item, `${caminho}[${i}]`));
    });
    return achados;
  }

  if (typeof valor === "object") {
    for (const [chave, item] of Object.entries(valor)) {
      const filho = `${caminho}.${chave}`;
      if (CHAVES_PROIBIDAS.test(chave)) {
        achados.push({ caminho: filho, motivo: `campo "${chave}" é de contato` });
      }
      achados.push(...scanearVazamento(item, filho));
    }
  }

  return achados;
}
