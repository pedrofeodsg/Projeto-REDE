/**
 * Extrai a base territorial de São Pedro da Aldeia do arquivo oficial do TSE.
 *
 *   node scripts/extrai-tse.mjs <caminho-do-csv>
 *
 * O arquivo vem dos Dados Abertos do TSE, dataset "Eleitorado Atual":
 * https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/eleitorado_local_votacao_ATUAL.zip
 *
 * Ele traz uma linha por seção eleitoral. Este script agrega por local de
 * votação: conta seções distintas e soma QT_ELEITOR_SECAO. O resultado vai para
 * supabase/seed/fonte/, que é a fonte do seed e o registro de proveniência.
 *
 * Rodar de novo com um arquivo mais novo do TSE regrava a fonte. O seed em si
 * se regenera com `npm run seed:gerar`.
 */
import { createReadStream, writeFileSync, mkdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const MUNICIPIO = "SÃO PEDRO DA ALDEIA";
const UF = "RJ";

/** Macro-região de cada bairro. Fonte: PRD, Seção 6.3. */
const REGIAO_POR_BAIRRO = {
  "SÃO JOÃO": "R2",
  CENTRO: "R1",
  "CAMPO REDONDO": "R2",
  "BALNEÁRIO SÃO PEDRO": "R3",
  "SÃO JOSÉ": "R1",
  "NOVA SÃO PEDRO": "R1",
  FLUMINENSE: "R1",
  "ESTAÇÃO": "R1",
  "BAIXO GRANDE": "R2",
  "PORTO DA ALDEIA": "R1",
  "JARDIM SOLEDADE": "R1",
  "RUA DO FOGO": "R3",
  "PORTO DO CARRO": "R2",
  VINHATEIRO: "R2",
  "PRAIA LINDA": "R3",
  "POÇO FUNDO": "R1",
  ALECRIM: "R2",
  "BALNEÁRIO DAS CONCHAS": "R3",
  "PONTA DO AMBRÓSIO": "R2",
  "BOQUEIRÃO": "R1",
  "RECANTO DO SOL": "R1",
  "MOSSORÓ": "R1",
  CRUZ: "R3",
  "SÃO MATEUS": "R1",
  BOTAFOGO: "R1",
  RETIRO: "R2",
  BALEIA: "R1",
  "MORRO DO MILAGRE": "R1",
  "PARQUE ARRUDA": "R2",
  "TRÊS VENDAS": "R3",
  "SAPEATIBA MIRIM": "R3",
};

const MINUSCULAS = new Set(["de", "do", "da", "dos", "das", "e"]);
const SIGLAS = new Set(["CIEP", "FAETEC", "CEDERJ", "RJ", "S/N", "II", "III"]);

/** O TSE grava tudo em caixa alta. Isto devolve a grafia de exibição. */
function titulo(texto) {
  return texto
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((palavra, i) => {
      const semPontuacao = palavra.replace(/[.,()]/g, "").toUpperCase();
      if (SIGLAS.has(semPontuacao)) return palavra.toUpperCase();

      const minuscula = palavra.toLowerCase();
      if (i > 0 && MINUSCULAS.has(minuscula)) return minuscula;

      // Capitaliza a primeira letra de verdade, pulando parêntese e aspas,
      // e também a que vem depois de hífen ("Horto-Escola").
      return minuscula
        .replace(/^([^\p{L}]*)(\p{L})/u, (_, antes, letra) => antes + letra.toUpperCase())
        .replace(/-(\p{L})/gu, (_, letra) => `-${letra.toUpperCase()}`);
    })
    .join(" ");
}

const caminhoCsv = process.argv[2];
if (!caminhoCsv) {
  console.error("uso: node scripts/extrai-tse.mjs <caminho-do-csv>");
  process.exit(1);
}

const COL = {};
const porLocal = new Map();
let primeira = true;

const rl = createInterface({
  input: createReadStream(caminhoCsv, { encoding: "latin1" }),
  crlfDelay: Infinity,
});

for await (const linha of rl) {
  const c = linha.split(";").map((x) => x.replace(/^"|"$/g, ""));

  if (primeira) {
    c.forEach((nome, i) => (COL[nome] = i));
    primeira = false;
    continue;
  }

  if (c[COL.SG_UF] !== UF) continue;
  if (!c[COL.NM_MUNICIPIO]?.toUpperCase().includes(MUNICIPIO)) continue;
  if (c[COL.DS_SITU_SECAO] !== "ATIVO") continue;

  const chave = `${c[COL.NR_ZONA]}-${c[COL.NR_LOCAL_VOTACAO]}`;

  if (!porLocal.has(chave)) {
    const bairroBruto = c[COL.NM_BAIRRO].trim().toUpperCase();
    const regiao = REGIAO_POR_BAIRRO[bairroBruto];
    if (!regiao) {
      throw new Error(
        `Bairro "${bairroBruto}" não tem macro-região mapeada. O TSE mudou a base: reveja REGIAO_POR_BAIRRO contra a Seção 6.3 do PRD.`,
      );
    }
    porLocal.set(chave, {
      zona: Number(c[COL.NR_ZONA]),
      numero: Number(c[COL.NR_LOCAL_VOTACAO]),
      nome: titulo(c[COL.NM_LOCAL_VOTACAO]),
      bairro: titulo(bairroBruto),
      regiao,
      endereco: titulo(c[COL.DS_ENDERECO]),
      latitude: c[COL.NR_LATITUDE],
      longitude: c[COL.NR_LONGITUDE],
      secoes: new Set(),
      eleitores: 0,
    });
  }

  const local = porLocal.get(chave);
  local.secoes.add(c[COL.NR_SECAO]);
  local.eleitores += Number(c[COL.QT_ELEITOR_SECAO] || 0);
}

const locais = [...porLocal.values()]
  .map(({ secoes, ...resto }) => ({ ...resto, secoes: secoes.size }))
  .sort((a, b) => b.eleitores - a.eleitores);

const bairros = [...new Set(locais.map((l) => l.bairro))]
  .map((nome) => {
    const doBairro = locais.filter((l) => l.bairro === nome);
    return {
      nome,
      regiao: doBairro[0].regiao,
      eleitores: doBairro.reduce((s, l) => s + l.eleitores, 0),
      secoes: doBairro.reduce((s, l) => s + l.secoes, 0),
    };
  })
  .sort((a, b) => b.eleitores - a.eleitores);

const fonte = {
  gerado_em: new Date().toISOString(),
  origem:
    "TSE · Dados Abertos · Eleitorado Atual · eleitorado_local_votacao_ATUAL.csv",
  municipio: "São Pedro da Aldeia",
  uf: UF,
  zona: 59,
  totais: {
    bairros: bairros.length,
    locais: locais.length,
    secoes: locais.reduce((s, l) => s + l.secoes, 0),
    eleitores: locais.reduce((s, l) => s + l.eleitores, 0),
  },
  bairros,
  locais,
};

const destino = join(RAIZ, "supabase", "seed", "fonte");
mkdirSync(destino, { recursive: true });
writeFileSync(
  join(destino, "territorio-tse.json"),
  `${JSON.stringify(fonte, null, 2)}\n`,
  "utf8",
);

console.log(`bairros   : ${fonte.totais.bairros}`);
console.log(`locais    : ${fonte.totais.locais}`);
console.log(`seções    : ${fonte.totais.secoes}`);
console.log(`eleitores : ${fonte.totais.eleitores}`);
console.log(`\n→ supabase/seed/fonte/territorio-tse.json`);
