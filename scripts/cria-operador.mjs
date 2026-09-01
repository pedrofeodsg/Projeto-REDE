/**
 * Cria (ou atualiza) uma chave de acesso ao painel.
 *
 *   npm run operador:criar -- <chave> <senha> "<nome>" [coordenacao|operador]
 *
 * Exemplo:
 *   npm run operador:criar -- teste teste123 "Acesso de teste" coordenacao
 *
 * A senha entra por argumento e nunca fica no repositório. O e-mail interno
 * (<chave>@rede.local) existe só porque o Supabase Auth exige um campo de
 * e-mail — ele nunca aparece na tela e nunca recebe mensagem.
 */
import { createClient } from "@supabase/supabase-js";

import { env } from "./env.mjs";

const DOMINIO_INTERNO = "rede.local";

const [chave, senha, nome, papel = "coordenacao"] = process.argv.slice(2);

if (!chave || !senha) {
  console.error(
    'uso: npm run operador:criar -- <chave> <senha> "<nome>" [coordenacao|operador]',
  );
  process.exit(1);
}

if (papel !== "coordenacao" && papel !== "operador") {
  console.error(`papel inválido: ${papel}. Use coordenacao ou operador.`);
  process.exit(1);
}

const email = `${chave.trim().toLowerCase()}@${DOMINIO_INTERNO}`;

const svc = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

// Já existe? Então é troca de senha, não criação.
const { data: lista } = await svc.auth.admin.listUsers({ perPage: 1000 });
const existente = lista?.users.find((u) => u.email === email);

let userId;

if (existente) {
  const { error } = await svc.auth.admin.updateUserById(existente.id, {
    password: senha,
  });
  if (error) {
    console.error(`não deu para atualizar a senha: ${error.message}`);
    process.exit(1);
  }
  userId = existente.id;
  console.log(`chave "${chave}" já existia — senha atualizada`);
} else {
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error) {
    console.error(`não deu para criar: ${error.message}`);
    if (/password/i.test(error.message)) {
      console.error(
        "\nO Supabase recusou a senha. O mínimo padrão é 6 caracteres — ajuste em\nAuthentication → Providers → Email, ou escolha uma senha mais longa.",
      );
    }
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`chave "${chave}" criada`);
}

const { error: erroOperador } = await svc
  .from("operadores")
  .upsert({ id: userId, nome: nome || chave, papel }, { onConflict: "id" });

if (erroOperador) {
  console.error(`o login existe mas o vínculo falhou: ${erroOperador.message}`);
  process.exit(1);
}

console.log(`vinculada como ${papel}, com o nome "${nome || chave}"`);
console.log(`\nentre em /login com  ${chave}  /  ${"•".repeat(senha.length)}`);
