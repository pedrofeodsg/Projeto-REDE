/**
 * Verificação de integridade contra o banco real.
 *
 * Cobre o item 5 dos Critérios de Pronto (PRD 11.4): provar que a RLS
 * bloqueia leitura sem sessão, em vez de confiar em que o frontend não pede.
 *
 *   npm run verifica                        → só as checagens que não exigem senha
 *   npm run verifica -- <chave> <senha>     → inclui login ponta a ponta
 *
 * A senha nunca fica no repositório: vem por argumento.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = Object.fromEntries(
  readFileSync(join(raiz, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const [chave, senha] = process.argv.slice(2);

let falhas = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const falha = (msg) => {
  falhas += 1;
  console.log(`  FALHA ${msg}`);
};

const semSessao = () =>
  createClient(URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

console.log("\nBloco 1 · operadores\n");

const service = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: todos, error: erroTodos } = await service
  .from("operadores")
  .select("id, nome, papel");

if (erroTodos) {
  falha(`tabela operadores inacessível pela service role: ${erroTodos.message}`);
} else if (todos.length === 0) {
  falha("tabela operadores existe mas está vazia — falta criar a chave de acesso");
} else {
  ok(
    `${todos.length} operador(es): ${todos
      .map((o) => `${o.nome} [${o.papel}]`)
      .join(", ")}`,
  );
}

console.log("\nRLS · leitura sem sessão\n");

const { data: anon, error: erroAnon } = await semSessao()
  .from("operadores")
  .select("id");

if (erroAnon) {
  ok(`operadores bloqueada sem sessão (${erroAnon.message})`);
} else if (anon.length === 0) {
  ok("operadores devolve zero linhas sem sessão");
} else {
  falha(`operadores VAZOU ${anon.length} linha(s) sem sessão`);
}

// A rota pública circula em milhares de conversas de WhatsApp. Se `pessoas`
// vazar sem sessão, a URL vira vetor de leitura da base inteira — nome,
// telefone e a quem cada apoiador está atribuído.
const { data: pessoasAnon, error: erroPessoas } = await semSessao()
  .from("pessoas")
  .select("id, nome, telefone");

if (erroPessoas) {
  ok(`pessoas bloqueada sem sessão (${erroPessoas.message})`);
} else if (pessoasAnon.length === 0) {
  ok("pessoas devolve zero linhas sem sessão");
} else {
  falha(`pessoas VAZOU ${pessoasAnon.length} linha(s) com telefone`);
}

if (chave && senha) {
  console.log("\nLogin ponta a ponta\n");

  const { DOMINIO_INTERNO } = { DOMINIO_INTERNO: "rede.local" };
  const email = chave.includes("@") ? chave : `${chave}@${DOMINIO_INTERNO}`;

  const { data: sessao, error: erroLogin } = await semSessao().auth.signInWithPassword({
    email,
    password: senha,
  });

  if (erroLogin) {
    falha(`login com a chave "${chave}" falhou: ${erroLogin.message}`);
  } else {
    ok(`login com a chave "${chave}" autenticou`);

    const comSessao = createClient(URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${sessao.session.access_token}` },
      },
    });

    const { data: meu, error: erroMeu } = await comSessao
      .from("operadores")
      .select("id, nome, papel");

    if (erroMeu) {
      falha(`sessão não consegue ler o próprio registro: ${erroMeu.message}`);
    } else if (meu.length === 1 && meu[0].id === sessao.user.id) {
      ok(`sessão vê só o próprio registro: ${meu[0].nome} [${meu[0].papel}]`);
    } else {
      falha(
        `policy de leitura errada: sessão vê ${meu.length} linha(s), esperado 1`,
      );
    }
  }
} else {
  console.log("\n  (login não testado — rode com: npm run verifica -- <chave> <senha>)");
}

console.log(falhas === 0 ? "\nTudo verde.\n" : `\n${falhas} falha(s).\n`);
process.exit(falhas === 0 ? 0 : 1);
