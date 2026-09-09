/**
 * Tudo do sistema que abre sem login.
 *
 * Existe para responder uma pergunta que ninguém deveria ter que responder
 * abrindo o código: o que exatamente está exposto lá fora, e para quem. Cada
 * endereço público é uma porta; porta que a coordenação esqueceu que existe é
 * porta que ninguém confere.
 *
 * Dado puro, sem `server-only`: a página lê no servidor e os botões de copiar
 * leem no cliente.
 */

/** Endereço único, o mesmo para todo mundo, que se divulga como está. */
export type LinkFixo = {
  id: string;
  rotulo: string;
  caminho: string;
  /** Quem recebe este link. */
  paraQuem: string;
  resumo: string;
  /** Aparece em busca do Google? */
  indexavel: boolean;
  /** Texto que sai pronto no WhatsApp. Quem envia revisa antes. */
  convite: string;
  /** O cuidado que este link exige, quando exige algum. */
  cuidado?: string;
};

/**
 * Endereço que não é um, e sim um por pessoa ou por exportação. Não cabe numa
 * lista: o que cabe é dizer que existe, quantos estão de pé e onde se mexe.
 */
export type FamiliaDeLink = {
  id: string;
  rotulo: string;
  padrao: string;
  resumo: string;
  /** Onde no painel esses links se criam e se administram. */
  onde: string;
  ondeHref: string;
  /** Como contar quantos estão ativos agora. */
  contagem: "liderancas" | "relatorios";
  unidade: [singular: string, plural: string];
};

export const LINKS_FIXOS: LinkFixo[] = [
  {
    id: "sou-lideranca",
    rotulo: "Cadastro de lideranças",
    caminho: "/sou-lideranca",
    paraQuem: "Só para quem a coordenação já escolheu como liderança",
    resumo:
      "A pessoa preenche os próprios dados — nome, apelido, onde mora, onde vota, Instagram e telefone. Ela entra na base como liderança pendente e só vira liderança de verdade quando alguém aprova em Lideranças.",
    indexavel: false,
    convite:
      "Fala! Esse é o cadastro da nossa rede. Preenche com os seus dados que eu te mando a sua página exclusiva em seguida:",
    cuidado:
      "Mandar no 1x1, nunca em grupo. O texto da página diz que o convite é individual e intransferível — se ele circular solto, entra gente que a coordenação não escolheu, e alguém vai ter que recusar uma por uma.",
  },
  {
    id: "molduras",
    rotulo: "Molduras para Instagram",
    caminho: "/molduras",
    paraQuem: "Qualquer pessoa. É feito para espalhar",
    resumo:
      "A pessoa escolhe a moldura, põe a própria foto e baixa pronta para story ou publicação. A montagem acontece dentro do celular dela: a foto não sobe para servidor nenhum.",
    indexavel: true,
    convite:
      "Bora botar a sua cara na campanha? Escolhe a moldura, põe a sua foto e baixa pronta pro Instagram. Leva menos de um minuto:",
  },
];

export const FAMILIAS_DE_LINK: FamiliaDeLink[] = [
  {
    id: "captacao",
    rotulo: "Página de captação de cada liderança",
    padrao: "/nome-da-lideranca",
    resumo:
      "Cada liderança ativa tem um endereço só dela. Todo apoiador que se cadastra por ali fica registrado como indicação dela — é o que faz a conta de quem trouxe quem.",
    onde: "Lideranças",
    ondeHref: "/liderancas",
    contagem: "liderancas",
    unidade: ["página no ar", "páginas no ar"],
  },
  {
    id: "relatorio",
    rotulo: "Relatório de prestação de contas",
    padrao: "/r/codigo-do-link",
    resumo:
      "Leitura sem login, com código não adivinhável, limitada ao perfil que o link carrega. Serve para mostrar número a quem está de fora sem dar acesso ao painel — e se revoga a qualquer momento.",
    onde: "Exportar",
    ondeHref: "/exportar",
    contagem: "relatorios",
    unidade: ["link ativo", "links ativos"],
  },
];

/** Endereço completo, para copiar e abrir. */
export function enderecoCompleto(base: string, caminho: string): string {
  return base.replace(/\/+$/, "") + caminho;
}

/** O que aparece na tela: sem protocolo, porque protocolo não é informação. */
export function enderecoParaExibir(host: string, caminho: string): string {
  return host.replace(/^https?:\/\//, "").replace(/\/+$/, "") + caminho;
}
