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

## Next.js 16 — convenções que mudaram

O projeto roda Next 16, que quebra hábitos de versões anteriores. `@AGENTS.md`
aponta para os guias oficiais em `node_modules/next/dist/docs/`. Leia antes de
escrever código de rota.

- **`middleware.ts` não existe mais.** É `proxy.ts` na raiz, com a função
  exportada chamada `proxy`. Runtime nodejs, não edge.
- **`cookies()`, `headers()`, `params` e `searchParams` são assíncronos.**
  Acesso síncrono foi removido de vez.
- **Tailwind v4.** Não existe `tailwind.config.ts`. O tema mora em
  `@theme inline` dentro de `app/globals.css`.
- **Turbopack é o bundler padrão.**
- Tipos de rota (`LayoutProps<"/">`, `PageProps<"/[slug]">`) são globais e vêm
  de `npx next typegen`. Rode depois de criar rota nova.

## Clientes Supabase

Três arquivos em `/lib/supabase`, com fronteira nítida:

- `server.ts` → `createServerClient()`, service role, **ignora RLS**. Só a
  superfície pública usa. Nenhuma tela do admin.
- `auth.ts` → `createAuthClient()`, sessão do operador. É o cliente do admin
  inteiro, e é ele que faz a RLS valer de verdade.
- `proxy.ts` → renova a sessão e protege as rotas de `/lib/auth/rotas.ts`.

`SUPABASE_ANON_KEY` existe **sem** o prefixo `NEXT_PUBLIC_`. Ela é a `apikey`
que o endpoint de auth exige, e todo o fluxo roda em Server Action, então
nenhuma chave chega ao navegador. O role `anon` continua sem policy nenhuma.
`NEXT_PUBLIC_SUPABASE_ANON_KEY` continua proibida.

O grupo `(admin)` não tem prefixo na URL e `/[slug]` é dinâmico na raiz, então
o proxy não deduz o que é admin. **Tela nova dentro de `(admin)` exige entrada
em `PREFIXOS_ADMIN`**, em `/lib/auth/rotas.ts`. Sem isso ela nasce pública.

## Comandos

```bash
npm run dev            # http://localhost:3000
npm run build          # valida o seed e só então compila
npm run typecheck      # tsc --noEmit

npm run validate:seed  # os checks de integridade territorial
npm run seed:aplicar   # (re)carrega bairros e locais no banco, idempotente
npm run seed:gerar     # regrava os .sql a partir da fonte do TSE
node scripts/extrai-tse.mjs <csv>   # refaz a fonte a partir do arquivo oficial

npm test               # funções canônicas (telefone, handle, slug)
npm run verifica -- painelsistema '<senha>'   # RLS e login contra o banco real
npm run testa:captura  # a regra de captura pública contra o banco real
npm run testa:temperatura   # os seis estados do termômetro contra o banco
npm run testa:territorio    # penetração, buracos, cobertura e selos
npm run testa:relacionamento # promoção, reatribuição, demandas e interações
npm run testa:instagram     # roster congelado, handle_cru e temperatura digital
```

`npm run verifica` é o teste que o item 5 dos Critérios de Pronto (PRD 11.4)
exige: provar que a leitura sem sessão falha, em vez de confiar em que o
frontend não pede. Sem os argumentos, roda só as checagens que não precisam de
senha. A senha nunca entra no repositório.

## Acesso ao painel

Não existe login por e-mail. A coordenação entra por **chave de acesso**, e a
conversão para o endereço interno que o Supabase Auth exige mora em
`/lib/auth/acesso.ts` (`painelsistema` → `painelsistema@rede.local`). O e-mail
interno nunca aparece na tela e nunca recebe mensagem. Toda escrita e leitura de
chave passa por `emailDaChave()` e `chaveDoEmail()`.

Manter o Supabase Auth em vez de inventar sessão própria é o que permite a RLS
continuar sendo regra de banco: o JWT do login é o que faz o Postgres resolver
a role como `authenticated`.

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

**Pré-voo ✅ concluído em 16/08/2026.** Pasta, git, `/docs`, `CLAUDE.md`,
`.env.example`, `.gitignore` e Prompt 0 de calibragem.

**Bloco 1 · Fundação (RF-02) — código concluído em 16/08/2026, aguardando
verificação com o banco.**

- [x] Next.js 16 + App Router + TypeScript estrito + Tailwind v4 + Shadcn/ui
      (base radix, preset nova)
- [x] Estrutura de pastas da Seção 5.4 do PRD
- [x] `app/globals.css` importando `/docs/design-tokens.css` e expondo os tokens
      como utilitários (`bg-void`, `text-ink-2`, `border-line`, `text-t-afastado`,
      `font-display`, `text-kpi`, `tracking-eyebrow`…)
- [x] Superfícies `.admin` e `.paper` remapeando os nomes semânticos do Shadcn,
      então o mesmo `<Button>` nasce certo nos dois mundos
- [x] Chakra Petch, IBM Plex Sans e IBM Plex Mono via `next/font`, self-hosted
- [x] `lib/supabase/server.ts` (service role) e `lib/supabase/auth.ts` (sessão)
- [x] `proxy.ts` na raiz protegendo `PREFIXOS_ADMIN` e renovando a sessão
- [x] Migration `supabase/migrations/0001_operadores.sql` com enum
      `papel_operador`, RLS ativa e policy de leitura só do próprio registro
- [x] `/login` por chave de acesso e senha, sem cadastro público e sem recuperação
- [x] `/(admin)/painel` vazia, com header e nome do operador logado
- [x] Tela de "conta sem vínculo" para quando existir usuário no Auth sem linha
      em `operadores` — evita o laço de redirecionamento com o proxy
- [x] `npm run build` e `npm run typecheck` verdes
- [x] Busca por `NEXT_PUBLIC_SUPABASE_ANON_KEY` retorna zero ocorrências
- [x] `SUPABASE_ANON_KEY` preenchida e validada contra o Supabase
- [x] `/painel` sem sessão devolve 307 para `/login`; `/` devolve 307 para `/painel`
- [x] Migration aplicada no banco (`operadores`, enum, RLS, 1 policy)
- [x] Chave de acesso `painelsistema` criada e vinculada a `coordenacao`
- [x] `npm run verifica` verde: login autentica, sessão vê só o próprio
      registro, leitura sem sessão devolve zero linhas
- [x] Repositório no GitHub
- [x] Deploy na Vercel

**Bloco 2 · Base Territorial (RF-01) ✅ concluído em 17/08/2026.**

- [x] Migration `0002_territorio.sql`: `bairros`, `locais_votacao`, enum
      `macro_regiao`, RLS ativa e leitura só para autenticado. Nenhuma policy de
      escrita: o seed entra por service role e não existe tela de edição.
- [x] Fonte extraída do arquivo oficial do TSE
      (`supabase/seed/fonte/territorio-tse.json`) e seed gerado a partir dela
- [x] 31 bairros · 40 locais · 252 seções · 75.083 eleitores, todos conferidos
- [x] `validar_seed()` em SQL com 5 checks, chamada tanto pelo build quanto pela
      tela — regra escrita uma vez só
- [x] `npm run validate:seed` roda **antes** do `next build`; provado que o build
      aborta quando um check falha
- [x] `lib/territorio` com `getBairros`, `getLocais`, `getLocaisPorBairro`
      (local do próprio bairro primeiro) e `getRegioes`
- [x] Tela `/territorio` só de leitura, com indicadores, estado dos checks,
      macro-regiões e as duas tabelas com somas no rodapé
- [x] Navegação no header do admin

**Bloco 3A · Pessoas e Lideranças (RF-03, RF-04) ✅ concluído em 17/08/2026.**

- [x] Migration `0003_pessoas.sql`: `pessoas` única e autorreferente, `tags`,
      `pessoa_tags`, enums `nivel_pessoa` e `origem_pessoa`, `papel_atual()`
- [x] Invariantes travadas no banco: `CHECK` de telefone `^55[0-9]{10,11}$`,
      slug só para liderança, fora do município sem colégio daqui, ninguém
      indica a si mesma
- [x] Trigger bloqueia edição de `meta` por operador (RF-02) — RLS não
      distingue coluna
- [x] Trigger trava o `slug` depois do primeiro cadastro recebido (RF-04)
- [x] `lib/pessoas`: `normalizarTelefone`, `normalizarHandle`, `gerarSlugUnico`
      com lista de rotas reservadas. **33 testes** em `node:test`, sem
      dependência nova — o Node 24 roda TypeScript direto (`npm test`)
- [x] `/liderancas` com filtros combinados de bairro, macro-região e tag
- [x] `/liderancas/nova` e `/liderancas/[id]` com cascata de colégio, região
      derivada do âncora, tags e o link travando sozinho
- [x] 14 verificações contra o banco real: duplicidade, formato de telefone,
      slug de apoiador, trava do link e RLS de `pessoas` sem sessão

**Bloco 3B · Página Pública (RF-08 a RF-12) ✅ concluído em 17/08/2026.**

- [x] Migration `0004_captura_publica.sql`: `conflitos_cadastro` e
      `tentativas_cadastro`, ambas sem policy de escrita
- [x] `/[slug]` Server Component por service role; slug inexistente ou
      liderança inativa devolve 404
- [x] Quatro campos, e só quatro. Cascata de colégio com os do bairro no topo
      e "Ver escolas de outros bairros" abrindo o resto
- [x] "Moro em outro município" esconde o local e grava `fora_do_municipio`
- [x] Duplicidade resolvida no servidor: não cria, não altera atribuição, grava
      conflito e devolve sucesso neutro
- [x] Rate limit por IP em HMAC, 30 por 15 minutos, contado em TypeScript
- [x] `/[slug]/obrigado` com Web Share API compartilhando o link DA LIDERANÇA e
      "Cadastrar mais um"; primeiro nome viaja por cookie de 10 min
- [x] Open Graph com imagem 1200×630 gerada por liderança, lendo a cor da
      campanha de `docs/design-tokens.css`
- [x] Proxy não valida sessão em rota pública — era uma ida ao Supabase por
      visita no componente com meta de LCP
- [x] **189 KB comprimidos**, medido em produção (limite RNF-05: 300 KB)
- [x] Zero chaves nos bundles do cliente e no HTML servido
- [x] `npm run testa:captura` com 22 verificações contra o banco real

**Bloco 3C · Mensagens e Painel (RF-13, RF-17 a RF-19, RF-28 a RF-31) ✅
concluído em 17/08/2026.**

- [x] Migration `0005_mensagens_e_temperatura.sql`: `templates_mensagem`,
      `envios`, enum `temperatura_cadastro`, `calcular_temperatura()` e a view
      `v_liderancas`
- [x] Os 4 templates semeados com o texto aprovado no escopo
- [x] `lib/whatsapp` sem `server-only` — o botão precisa abrir a janela no
      mesmo gesto do clique. 11 testes
- [x] `/mensagens` com CRUD e prévia ao vivo da mensagem montada
- [x] Botão de envio no painel e na lista: abre o WhatsApp e grava em `envios`
      no mesmo clique; "marcar como não enviado" desfaz
- [x] Painel com indicadores, termômetro clicável e bloco de cobrança
- [x] Filtro por temperatura na lista de lideranças
- [x] `npm run testa:temperatura` com 16 verificações contra o banco

**Deploy ✅ em 18/08/2026.**

- Produção: **https://projeto-rede.vercel.app**
- Repositório: https://github.com/pedrofeodsg/Projeto-REDE — push em `main`
  dispara deploy automático
- Variáveis definidas nos três ambientes da Vercel. `NEXT_PUBLIC_SITE_URL`
  aponta para o domínio de produção, que é o prefixo do link de cada liderança
- Verificado em produção: `/login` 200, `/painel` sem sessão 307, slug
  inexistente 404, página pública 200 sem nenhuma chave no HTML, e a imagem de
  preview gerada com a cor da campanha — prova de que o
  `outputFileTracingIncludes` levou `docs/design-tokens.css` junto no deploy

**Bloco 4 · Território (RF-14, RF-15, RF-20 a RF-23) ✅ concluído em
18/08/2026.**

- [x] Migration `0006_territorio_agregacoes.sql`: `v_penetracao_bairro`,
      `v_penetracao_local` com flags `buraco` e `sobreposicao`,
      `v_cobertura_regiao`, `v_ranking_semanal`, `temperatura_historico` e
      `gravar_snapshot_temperatura()`
- [x] Selos de 10/50/100 na `v_liderancas`
- [x] Silhueta dos 40 colégios em `/territorio`, seguindo a referência de
      `/docs/design-system-projeto-rede.html`
- [x] Painel ganhou ranking semanal, cobertura regional e "onde falta"
- [x] Cron semanal (segunda, 9h) em `vercel.json`, rota protegida por
      `CRON_SECRET` — recusa tudo em produção se o segredo não existir
- [x] `npm run testa:territorio` com 15 verificações contra o banco

**Bloco 5 · Relacionamento (RF-05 a RF-07, RF-24 a RF-27, RF-32) ✅ concluído
em 18/08/2026.**

- [x] Migration `0007_relacionamento.sql`: `interacoes`, `demandas`,
      `reatribuicoes` (append-only) e a view `v_demandas`
- [x] Trigger carimba a data de resolução e a apaga quando a demanda reabre
- [x] `/pessoas` com busca e paginação; `/pessoas/[id]` com linha do tempo
      unificada e bloco extra só para liderança
- [x] "Registrar contato" sempre visível, inclusive no estado vazio
- [x] Promoção de apoiador a liderança sem migrar registro (RF-06)
- [x] Reatribuição individual e em lote com auditoria (RF-07)
- [x] `/demandas` com filtro por status, categoria e responsável
- [x] `/conflitos` para arbitragem privada
- [x] Fila de envio em lote com avanço manual (RF-32)
- [x] `npm run testa:relacionamento` com 17 verificações contra o banco

**Bloco 6 · Digital (RF-16, RF-33 a RF-38) ✅ concluído em 18/08/2026.**

- [x] Migration `0008_instagram.sql`: `posts`, `post_roster`, `engajamentos`,
      `recrutamento`, `calcular_temperatura_digital()`, `v_lideranca_digital` e
      `v_handles_sem_vinculo`
- [x] Roster congela em trigger no cadastro do post — nunca recalculado
- [x] `handle_cru` protegido por trigger contra sobrescrita
- [x] `/instagram/posts`, `/importar`, `/ausencias`, `/vincular`
- [x] Parser de colagem e CSV com 15 testes
- [x] Coluna digital independente na lista de lideranças
- [x] `npm run testa:instagram` com 14 verificações contra o banco

**Próximo:** Bloco 7 · Prestação de Contas (RF-39 a RF-41). Perfis de
exportação, snapshot datado e link com token revogável.

# Regras do módulo digital

- **Presença é comentário, nunca curtida.** A lista nominal de quem curtiu não
  é exposta por nenhuma via oficial — decisão da plataforma, não limitação
  nossa. Por isso o comentário é a exigência da rede e a curtida é piso,
  conferida pela contagem agregada digitada no cadastro do post.
- **A temperatura digital nunca soma com a de cadastro.** São duas colunas
  separadas e vão continuar assim. Quem cadastra 20 e não comenta é um problema
  diferente de quem comenta em tudo e cadastra zero.
- **Quem entrou depois do último post fica "sem janela", não "ausente".**
- **O sistema nunca conversa com o Instagram.** Sem SDK, sem requisição, sem
  integração. A entrada é sempre importação, para não expor a conta oficial a
  restrição em plena campanha.

# Regras de contagem territorial

Duas decisões que mudam o que os números significam, e que nenhuma tela pode
contradizer:

1. **Penetração conta apoiadores, não a base inteira.** O `local_votacao_id` de
   uma liderança é o colégio onde ela ATUA, que pode não ser onde vota. Contá-la
   como cadastro dela mesma inflaria justamente os colégios pequenos, que são os
   que mais enganam. Lideranças aparecem em coluna separada ("Âncoras").
2. **Quem tem `fora_do_municipio` entra no total geral e no crédito de quem o
   trouxe, e fica fora de toda conta territorial.** Contato em Cabo Frio vale o
   mesmo voto para federal e estadual, mas não é penetração em São Pedro da
   Aldeia.

A tabela de bairros ordena por penetração **crescente**: a tela existe para
mostrar onde falta. O ranking ordena por **novos na semana**, nunca por
acumulado.

# O termômetro é fonte única

Temperatura sai sempre da view `v_liderancas`, nunca recalculada em tela. Se
dois lugares discordarem sobre quem está afastado, a coordenação perde a
confiança no número na frente de uma liderança — e o painel morre.

A ordem das checagens em `calcular_temperatura()` não é decorativa: **ativa vem
antes de qualquer faixa de volume**. Sem isso, quem trouxe 12 há três semanas e
sumiu aparece como "muito quente" estando morto.

Os dias contam desde o **envio do link**, não desde o cadastro no admin.

# Onde a regra mora

A regra de captura mora em `lib/pessoas/publico.ts#registrarApoiador`, e não
dentro da Server Action. A ação é só validação de formulário, cookie e
redirecionamento.

O motivo é testabilidade: `npm run testa:captura` exercita a função de verdade
contra o banco, sem simular navegador. Roda com `--conditions=react-server`,
que é a condição que faz o pacote `server-only` resolver para o módulo vazio,
como acontece dentro do Next.

Pelo mesmo motivo, **módulos em `/lib` importam por caminho relativo com
extensão `.ts`**, não pelo alias `@/` — o alias só existe dentro do bundler, e
sem ele o teste não alcança o código real.

# Decisões pendentes do Pedro

Levantadas na leitura do PRD. Cada uma trava o bloco indicado.

1. **Território conta por local de votação, não por moradia (trava o Bloco 4).**
   `bairro_moradia_id` é informativo e não entra na penetração. Falta definir o
   tratamento de quem tem `local_votacao_id` nulo sem ser `fora_do_municipio`.

2. **FKs de autoria.** `interacoes.autor`, `demandas.responsavel` e
   `envios.operador` apontam para `operadores`, não para `pessoas`.

3. **Cor da campanha.** `--campanha` está em `#1B4D3E` (placeholder). Trocar em
   `/docs/design-tokens.css` quando a identidade for definida. Não bloqueia nada.

# Decisões já tomadas

- **Base territorial vem da fonte oficial, não do PDF (Bloco 2).** O PRD listava
  7 locais "a levantar" e só tinha seções de 15 dos 40. O arquivo
  `eleitorado_local_votacao_ATUAL.csv` dos Dados Abertos do TSE, gerado em
  03/08/2026, traz uma linha por seção e fechou as duas lacunas: 40 locais, 252
  seções, 75.083 eleitores, 31 bairros conferidos um a um. Não existe local
  provisório e a coluna `provisorio` que o guia mandava criar não foi criada.
  Detalhes e proveniência em `/docs/base-territorial-tse.md`.
- **Os checks do seed moram em SQL (Bloco 2).** `public.validar_seed()` é
  chamada pelo build e pela tela `/territorio`. Duplicar a regra em JS criaria
  a chance de as duas divergirem, que é a classe de erro que faz painel mentir.
- **Scripts de banco não usam `process.exit()` (Bloco 2).** O cliente do
  Supabase mantém socket keep-alive aberto e o libuv aborta no Windows com
  código 127, o que derrubaria o build com o seed íntegro. Usa-se
  `process.exitCode`. Falha de rede tem retentativa (`comRetentativa`); erro de
  dado ou de permissão não repete.

- **Cliente Supabase no admin (Bloco 1).** Público usa service role no servidor;
  admin usa cliente de sessão, com RLS valendo de verdade, como manda o PRD 10.2.
  Se o admin usasse service role, a diferença entre `coordenacao` e `operador`
  deixaria de ser regra de banco e viraria regra de tela.
- **`SUPABASE_ANON_KEY` server-only (Bloco 1).** O endpoint de auth do Supabase
  exige uma `apikey`, e usar a service role para isso cria um caminho em que uma
  requisição sem sessão cai como service role. A chave `anon` sem prefixo
  `NEXT_PUBLIC_` resolve sem furar o desenho: nada chega ao navegador e o role
  `anon` segue sem policy.

# Insumos que não são código

Gargalo real. Travam o Bloco 3.

- [x] ~~Os 7 locais de votação faltantes~~ — resolvido pela fonte do TSE.
- [ ] Planilha das **70 lideranças**: nome, WhatsApp, bairro de atuação, local
      âncora, @ do Instagram, tags.
- [ ] **Metas individuais**.
- [ ] **70 linhas pessoais**.
- [ ] **Cor da campanha**.
