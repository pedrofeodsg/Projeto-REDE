# Projeto REDE

Hub de lideranças, monitoramento e mobilização política para a estrutura do
Vereador Pedro Abreu em São Pedro da Aldeia (RJ), eleições de 2026.

Documentação completa em `/docs/prd-projeto-rede-v1.md`. Leia antes de propor
qualquer coisa que não esteja explicitamente no prompt.

## Funil

Vereador → Liderança (link próprio) → Cadastrado (sem link próprio)

Apenas lideranças têm link. Apoiadores não recebem link individual. Os "+10" da
Rede 100x10 caem no link da própria liderança.

## Stack

Next.js App Router · TypeScript · Supabase (Postgres + Auth + RLS) · Tailwind ·
Shadcn/ui · Recharts · Vercel. Sem camada de IA no MVP.

## Superfícies

1. **Pública** (`/[slug]`): anônima, mobile-first, Server Component + Server Action.
   Nenhuma chave do Supabase chega ao navegador. O role `anon` não tem policy.
2. **Admin** (`/(admin)/*`): autenticada via Supabase Auth, dois papéis
   (`coordenacao`, `operador`), RLS em todas as tabelas.

Liderança e apoiador NUNCA fazem login. Não construa tela de login para eles.

## Invariantes

Estas regras não se negociam. Se um prompt parecer pedir algo que as contradiz,
pare e pergunte.

1. **Nenhum campo de contrapartida.** Não existe, em nenhuma tabela, campo que
   registre o que foi prometido ou entregue em troca de apoio. Não crie, não
   sugira, não aceite renomeado.
2. **`telefone` é chave única global**, armazenado só com dígitos e prefixo 55.
   Toda escrita passa pela função canônica de normalização.
3. **`handle_cru` nunca é sobrescrito.** O vínculo com a pessoa mora em coluna
   separada (`pessoa_id`) e pode ser corrigido sem tocar no histórico.
4. **`post_roster` é congelado** na data do post. Liderança cadastrada depois
   nunca aparece como ausente em post anterior.
5. **`pessoas` é tabela única e autorreferente.** Não crie tabela `liderancas`.
   `nivel` é coluna, `indicado_por` é FK para `pessoas`.
6. **O seed territorial é validado.** Soma dos bairros = 75.083. Soma dos locais
   = 75.083. Soma dos locais de cada bairro = total do bairro. Soma das seções
   = 252. Build falha se qualquer check falhar.
7. **Nenhum disparo automático de mensagem.** Envio é sempre `wa.me` com toque
   humano. Não integre API de mensageria.
8. **Perfil de exportação `candidato` nunca inclui telefone de apoiador**, nem
   nome de apoiador, mesmo que solicitado.

## Design

Tokens em `/docs/design-tokens.css`. Duas superfícies, um esqueleto.

- Painel: preto puro, hairline de 1px, branco é o acento. Não existe botão
  colorido. Cor saturada é exclusiva de estado (termômetro).
- Público: papel claro, alvo de toque de 52px, input de 16px (abaixo disso o
  iOS dá zoom no foco). Cor da campanha entra pelo token `--campanha` em
  quatro lugares apenas.
- Fontes: Chakra Petch (display, sempre caixa alta e travada, nunca em texto
  corrido) · IBM Plex Sans (corpo, peso 300 padrão) · IBM Plex Mono (todo
  número, com `tabular-nums`).
- Nenhum número absoluto aparece sozinho quando existe um percentual que o
  qualifica.

## Voz da interface

Verbo ativo, frase curta, português do Brasil, sem jargão de sistema.
"Confirmar apoio", não "Submeter cadastro". Estado vazio é direção, não desculpa.
A mensagem de duplicidade nunca revela a qual liderança a pessoa já pertence.

## Convenções de código

- TypeScript estrito. Sem `any`.
- Server Components por padrão. `'use client'` só onde há interatividade real.
- Toda mutação por Server Action.
- Migrations em `/supabase/migrations`, numeradas e versionadas.
- Nenhum dado territorial hardcoded em componente. Sempre do banco.
- Comentário em português, só onde a intenção não é óbvia pelo código.

## O que não fazer sem perguntar

- Adicionar campo ao formulário público (são quatro, e só quatro).
- Criar tela de login para liderança.
- Instalar biblioteca não listada na stack.
- Alterar o schema fora de migration.

---

# Operação com o Pedro

Toda interação é em **PT-BR**, concisa. O Pedro é product owner, não é dev: o
Claude escreve **todo** o código e roda **todos** os comandos. Quando precisar de
algo dele (chave, decisão, criação de conta), pare e dê passos numerados com URL.

Um bloco por vez. Antes de codar, explique o plano em 3-5 linhas e espere
confirmação. Ao fechar um bloco, atualize a seção "Estado atual" deste arquivo.

Guia de execução por bloco, com prompts e critérios de verificação:
`/docs/guia-de-execucao-por-bloco.md`.

# Estado atual

**Pré-voo ✅ concluído em 16/08/2026.**

- [x] Pasta do projeto criada e repositório git inicializado
- [x] `/docs` com PRD, escopo, design tokens, referência visual e guia de blocos
- [x] `CLAUDE.md` na raiz
- [x] `.env.example` e `.gitignore`
- [x] Prompt 0 (calibragem) executado
- [ ] Projeto Supabase criado e chaves em `.env.local`
- [ ] Repositório no GitHub
- [ ] Projeto na Vercel

**Próximo:** Bloco 1 · Fundação (RF-02). Depende das chaves do Supabase.

# Decisões pendentes do Pedro

Levantadas na leitura do PRD. Cada uma trava o bloco indicado.

1. **Seções eleitorais (trava o Bloco 2).** O check nº 4 do seed exige
   `SUM(secoes) = 252`, mas o PRD só traz seções para 15 dos 40 locais,
   somando 147. Faltam 105 seções em 25 locais sem dado. Os outros três checks
   fecham exatos com os 7 locais provisórios. Opções: (a) gravar `secoes` como
   nulo onde não há dado e tornar o check 4 informativo até chegar o dado do
   TSE; (b) segurar o Bloco 2 até levantar as seções na 59ª ZE. **Não inventar
   número** — a seção é a chave do cruzamento com o boletim de urna no Bloco 8.

2. **Cliente Supabase no admin (trava o Bloco 1).** Se o admin usar service role,
   a RLS é ignorada e a diferença entre `coordenacao` e `operador` deixa de ser
   regra de banco. Proposta: público = service role no servidor; admin = cliente
   de sessão do usuário, com RLS valendo de verdade (PRD 10.2).

3. **Território conta por local de votação, não por moradia (trava o Bloco 4).**
   `bairro_moradia_id` é informativo e não entra na penetração. Falta definir o
   tratamento de quem tem `local_votacao_id` nulo sem ser `fora_do_municipio`.

4. **FKs de autoria.** `interacoes.autor`, `demandas.responsavel` e
   `envios.operador` apontam para `operadores`, não para `pessoas`.

5. **Cor da campanha.** `--campanha` está em `#1B4D3E` (placeholder). Trocar em
   `/docs/design-tokens.css` quando a identidade for definida. Não bloqueia nada.

# Insumos que não são código

Gargalo real, correm em paralelo aos Blocos 1 e 2. Travam o Bloco 3.

- [ ] Os **7 locais de votação faltantes** (PRD 6.3). Lista fechada:
      São João 2.108 · Centro 1.833 · Balneário São Pedro 1.784 · São José 1.607 ·
      Baixo Grande 1.548 · Porto do Carro 955 · Nova São Pedro 729.
- [ ] Planilha das **70 lideranças**: nome, WhatsApp, bairro de atuação, local
      âncora, @ do Instagram, tags.
- [ ] **Metas individuais**.
- [ ] **70 linhas pessoais**.
- [ ] **Cor da campanha**.
