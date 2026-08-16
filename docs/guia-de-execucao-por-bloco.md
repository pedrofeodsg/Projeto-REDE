# Núcleo de Inteligência e Dados · Gabinete do Vereador Pedro Abreu

**PROMPT DE INICIALIZAÇÃO · CLAUDE CODE**

# Projeto REDE

### Setup guiado e prompts de execução por bloco

Versão 1.0 · Documento complementar ao PRD
São Pedro da Aldeia · Agosto de 2026

---

## Como usar este documento

Cada bloco tem três partes: o **prompt** para colar no Claude Code, o **critério de verificação** que você checa antes de seguir, e a **armadilha** daquele bloco, que é o erro específico que ele tende a cometer se você não avisar antes.

Não pule a verificação. Blocos posteriores assumem que o anterior está correto, e erro de base territorial no Bloco 2 só aparece no Bloco 4, quando já custou caro.

Os prompts assumem que o PRD está dentro do repositório. Sem isso, o Claude Code vai inventar campos e você vai gastar mais tempo corrigindo do que teria gasto colando o arquivo.

### Correção em relação ao PRD

O PRD descreve a rota pública como write-only com policy de `INSERT` para o role `anon`. Isso está incompleto: a página precisa ler o nome da liderança e as listas de bairros e colégios.

**A solução adotada é melhor:** a página pública é Server Component, a leitura acontece no servidor e a gravação acontece por Server Action, ambas com cliente de service role. O role `anon` **não recebe nenhuma policy**, e a chave anônima não é usada em lugar nenhum. Nada do Supabase chega ao navegador. Os prompts abaixo já refletem essa decisão.

---

## 1. Pré-voo

### 1.1 Contas e chaves

1. **GitHub** com repositório vazio criado.
2. **Supabase**, projeto novo. Anote `Project URL`, `anon key` e `service_role key`.
3. **Vercel**, conectada ao GitHub.
4. **Node.js 20+** e **Claude Code** instalados.

### 1.2 Variáveis de ambiente

`.env.local` na raiz, e as mesmas na Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server-only, NUNCA com prefixo NEXT_PUBLIC_
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com.br
```

> A ausência de `NEXT_PUBLIC_SUPABASE_ANON_KEY` é intencional. Se ela aparecer no projeto em algum momento, alguma coisa saiu do desenho.

### 1.3 Arquivos que entram no repositório antes do primeiro prompt

```
/docs
  ├── prd-projeto-rede-v1.md
  ├── escopo-projeto-rede-v1.md
  └── design-tokens.css
CLAUDE.md            ← conteúdo na Seção 2 deste documento
```

### 1.4 Insumos que não são código

Estes travam o Bloco 3, não o Bloco 1. Levante em paralelo:

- [ ] Os **7 locais de votação faltantes** (PRD, Seção 6.3). A lista está fechada: São João 2.108 · Centro 1.833 · Balneário São Pedro 1.784 · São José 1.607 · Baixo Grande 1.548 · Porto do Carro 955 · Nova São Pedro 729.
- [ ] Planilha das **70 lideranças**: nome, WhatsApp, bairro de atuação, local âncora, @ do Instagram, tags.
- [ ] **Metas individuais**.
- [ ] **70 linhas pessoais**.
- [ ] **Cor da campanha** para o token `--campanha`.

---

## 2. CLAUDE.md

Cole isto na raiz do repositório antes do primeiro prompt. É o arquivo que o Claude Code lê em toda interação, e é o que impede a deriva ao longo de oito blocos.

```markdown
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
```

---

## 3. Prompt 0 · Bootstrap

Rode este antes de tudo. Ele não escreve código, calibra o contexto.

```
Leia /docs/prd-projeto-rede-v1.md por inteiro e o CLAUDE.md da raiz.

Depois me devolva, sem escrever nenhum código:

1. Um resumo de 5 linhas do que é este sistema e de quem usa cada superfície.
2. As 8 invariantes do CLAUDE.md, com uma frase sua explicando por que cada
   uma existe. Se você não conseguir explicar o motivo de alguma, diga qual.
3. Três pontos do PRD que você considera ambíguos ou que vão gerar decisão
   durante a implementação.
4. A ordem dos 8 blocos e qual deles é o urgente.

Não proponha melhorias de arquitetura agora.
```

**Verificação:** se ele errar o funil (achar que apoiador tem link), ou não souber explicar por que não existe campo de contrapartida, releia o CLAUDE.md com ele antes de seguir. Esse erro se propaga por tudo.

---

## 4. Bloco 1 · Fundação

**Objetivo:** projeto no ar, com banco e autenticação.

```
Bloco 1 do PRD: Fundação. Requisito RF-02.

Crie o projeto:

1. Next.js com App Router, TypeScript estrito, Tailwind e Shadcn/ui.
2. Estrutura de pastas exatamente como a Seção 5.4 do PRD.
3. Cliente Supabase em duas variantes em /lib/supabase:
   - `createServerClient()` para Server Components e Server Actions, usando
     SUPABASE_SERVICE_ROLE_KEY.
   - `createAuthClient()` para o fluxo de sessão da coordenação.
   Não crie cliente de browser com chave anônima. O role `anon` não é usado.
4. Migration inicial com a tabela `operadores`:
   id (FK auth.users), nome, papel ('coordenacao' | 'operador'), criado_em.
5. Login em /login com e-mail e senha. Sem cadastro público, sem recuperação
   por enquanto. O primeiro operador é criado por SQL manual.
6. Middleware protegendo todo o grupo (admin), redirecionando para /login.
7. RLS ativa em `operadores`, com policy de leitura só do próprio registro.
8. Importe /docs/design-tokens.css no layout raiz e configure o tailwind.config
   para consumir as variáveis CSS como cores e fontes nomeadas. Carregue as
   três famílias via next/font.
9. Página /(admin)/painel vazia, apenas com o header e o nome do operador logado.

Ao final, me diga exatamente quais comandos eu preciso rodar no SQL Editor do
Supabase para criar o primeiro operador.
```

**Verificação:**
- [ ] `npm run build` sem erro de tipo.
- [ ] `/login` funciona e `/painel` redireciona quando deslogado.
- [ ] Buscar por `NEXT_PUBLIC_SUPABASE_ANON_KEY` no projeto retorna zero ocorrências.
- [ ] Deploy na Vercel verde.

**Armadilha:** ele vai querer usar o boilerplate padrão de auth do Supabase com cliente de browser e chave anônima. Isso quebra o desenho da superfície pública mais adiante. Corrija agora, não no Bloco 3.

---

## 5. Bloco 2 · Base Territorial

**Objetivo:** o denominador dentro do banco, validado.

```
Bloco 2 do PRD: Base Territorial. Requisito RF-01.

1. Migration com as tabelas `bairros` e `locais_votacao` conforme a Seção 6.1
   do PRD.
2. Seed em /supabase/seed/ com os 31 bairros e os 40 locais de votação. Os
   dados estão na Seção 6.3 do PRD.

   ATENÇÃO: o PRD lista 33 locais confirmados. Os 7 restantes estão
   identificados por bairro e eleitorado na tabela "Os 7 locais faltantes".
   Insira os 7 com nome provisório no formato "A LEVANTAR · <Bairro>",
   com o eleitorado correto e uma coluna booleana `provisorio`.
   Sem isso a validação de integridade não passa.

3. Script /supabase/seed/validacao.sql com os 4 checks da Seção 6.3.
4. Um comando `npm run validate:seed` que roda os 4 checks e sai com código
   diferente de zero se qualquer um falhar.
5. Adicione esse comando ao script de build. O deploy não sobe com seed
   inconsistente.
6. Em /lib/territorio, exporte:
   - `getBairros()`
   - `getLocaisPorBairro(bairroId)` ordenado com o local do próprio bairro
     primeiro, depois os demais
   - `getRegioes()` com os totais de referência
7. Uma página /(admin)/territorio listando bairros e locais, com as somas
   visíveis, só para eu conferir a olho.

Não crie nenhuma tela de edição de território. O seed é imutável em produção.
```

**Verificação:**
- [ ] `npm run validate:seed` retorna verde nos 4 checks.
- [ ] A tela `/territorio` mostra 31 bairros somando 75.083 e 40 locais somando 75.083.
- [ ] Os 7 provisórios aparecem marcados.

**Armadilha:** ele vai tentar inserir só os 33 confirmados e a validação vai falhar, ou pior, ele vai relaxar a validação para passar. A instrução dos provisórios existe para isso. Quando você levantar os nomes reais no TSE, é um `UPDATE` no nome e `provisorio = false`, sem tocar em número.

---

## 6. Bloco 3 · Captura

**Objetivo:** a rede inteira ativada e cadastrando. **Este é o único bloco urgente.**

Ele é grande demais para um prompt só. Divida em três.

### 6.1 Prompt 3A · Pessoas e lideranças

```
Bloco 3A do PRD. Requisitos RF-03 e RF-04.

1. Migration da tabela `pessoas` exatamente como a Seção 6.1 do PRD. Tabela
   única e autorreferente. Não crie tabela `liderancas`.
   Índices em: telefone, indicado_por, local_votacao_id, criado_em, slug.

2. Em /lib/pessoas, uma função canônica `normalizarTelefone(input: string)`:
   - remove tudo que não é dígito
   - se tiver 10 ou 11 dígitos, prefixa 55
   - se tiver 12 ou 13 dígitos começando com 55, mantém
   - qualquer outro comprimento retorna erro de validação
   - retorna string só de dígitos
   Escreva testes cobrindo: "(22) 99999-9999", "22999999999", "5522999999999",
   "+55 22 99999-9999", "99999999" (deve falhar).
   TODA escrita de telefone no sistema passa por essa função. Sem exceção.

3. Função `gerarSlug(nome)`: remove acento, minúsculo, hífen entre palavras,
   sufixo numérico em caso de colisão.

4. Tabelas `tags` e `pessoa_tags`.

5. CRUD de liderança em /(admin)/liderancas:
   - lista com filtros combinados por bairro, macro-região e tag
   - formulário de criação com todos os campos da RF-03
   - o campo "local de votação âncora" usa o mesmo select em cascata do
     Bloco 2, mas com opção de escolher qualquer local (a liderança pode
     atuar fora do bairro onde mora)
   - macro-região derivada automaticamente do local âncora
   - slug gerado na criação, editável enquanto a liderança tiver zero
     cadastros, travado depois

6. RLS: leitura para authenticated, escrita conforme papel.
```

### 6.2 Prompt 3B · Página pública

```
Bloco 3B do PRD. Requisitos RF-08 a RF-12. Este é o componente crítico do
sistema inteiro.

Rota /[slug]:

1. Server Component. Busca a liderança pelo slug com o cliente de service role.
   Slug inexistente ou liderança inativa retorna 404.
2. Nenhuma chave do Supabase pode chegar ao navegador. Não crie cliente de
   browser, não use chave anônima, não deixe o role `anon` com policy.
3. Quatro campos, e só quatro:
   - Nome completo (texto)
   - WhatsApp (tel, inputmode numeric, com máscara)
   - Bairro onde mora (select com os 31 bairros + "Moro em outro município")
   - Onde vota (select em cascata, filtrado pelo bairro, com o local do
     próprio bairro em primeiro, mais a opção "Ver escolas de outros bairros"
     que abre a lista completa)
4. Escolher "Moro em outro município" esconde o campo de local de votação e
   grava `fora_do_municipio = true` com `local_votacao_id` nulo.
5. Gravação por Server Action:
   - normaliza o telefone pela função canônica
   - se o telefone já existe: NÃO cria registro, NÃO altera atribuição,
     grava em `conflitos_cadastro` e retorna sucesso com a mensagem
     "Esse contato já faz parte da rede. Obrigado!"
     A resposta NUNCA revela a qual liderança a pessoa pertence.
   - se não existe: cria com indicado_por, origem 'link', nivel 'apoiador'
6. Rate limiting na Server Action por IP.
7. Tela de confirmação /[slug]/obrigado com:
   - agradecimento usando o primeiro nome
   - botão primário "Compartilhar" (Web Share API com fallback de copiar)
     que compartilha o link DA LIDERANÇA, não um link novo
   - botão secundário "Cadastrar mais um"
8. Meta tags Open Graph completas, com imagem.
9. Visual conforme a superfície "paper" de /docs/design-tokens.css:
   alvo de toque de 52px, input de 16px, botão de 56px, cor da campanha
   apenas no topo, no avatar do convite, no botão e no anel de foco.
10. Nome da liderança visível na página, no formato "Convite de <Nome>".

Otimize para peso: alvo abaixo de 300 KB e LCP abaixo de 2s em 4G.
```

### 6.3 Prompt 3C · Mensagens e painel mínimo

```
Bloco 3C do PRD. Requisitos RF-17 a RF-19 e RF-28 a RF-31.

1. Tabelas `templates_mensagem` e `envios` conforme Seção 6.1.
2. Seed dos 4 templates iniciais. O corpo do template de boas-vindas está no
   escopo (/docs/escopo-projeto-rede-v1.md, Seção 4.7). Use exatamente aquele
   texto, com {nome}, {linha_pessoal} e {link_cadastro}.
3. Em /lib/whatsapp:
   - `montarMensagem(template, pessoa)` que interpola as variáveis. Se
     {linha_pessoal} estiver vazia, remove a linha inteira sem deixar quebra
     dupla.
   - `montarLinkWa(telefone, mensagem)` que monta
     https://wa.me/<digitos>?text=<encodeURIComponent(mensagem)>
     com quebra de linha como %0A.
4. No card e na linha de cada liderança, um seletor de template e um botão
   que abre o link em nova aba e grava em `envios` no mesmo clique.
5. Botão "marcar como não enviado" que inverte o campo `confirmado`.
6. CRUD de templates em /(admin)/mensagens.
7. Motor de temperatura: uma função SQL `calcular_temperatura(pessoa_id)` com
   a lógica exata da Seção 9.2 do PRD, e uma view `v_liderancas` que expõe
   nome, cadastros, meta, estado, dias parada e último cadastro.
   Atenção: a checagem de "ativa" vem ANTES de qualquer faixa de volume.
   Os dias de inatividade contam desde o envio do link, não desde o cadastro
   no admin.
8. Painel /(admin)/painel com três blocos, nesta ordem:
   - faixa de 4 indicadores (RF-17)
   - termômetro da rede em barra segmentada e clicável (RF-18)
   - bloco de cobrança: lista nominal de quem está em 'afastado', ordenada
     por dias, com botão de WhatsApp por linha já carregando o template de
     cutucada (RF-19)
9. Estado vazio do bloco de cobrança: "Ninguém parado. Toda a rede cadastrou
   nos últimos 5 dias."

Visual conforme a superfície de painel dos tokens: preto puro, hairline,
branco é o acento, números em IBM Plex Mono tabular.
```

**Verificação do Bloco 3 (faça em celular real, não em emulador):**
- [ ] Abrir `/[slug]` de uma liderança de teste e cadastrar uma pessoa de verdade.
- [ ] Conferir a atribuição no painel.
- [ ] Tentar cadastrar o mesmo telefone de novo e confirmar que a mensagem é neutra e não revela nada.
- [ ] Conferir o preview do link no WhatsApp.
- [ ] Testar "Moro em outro município" e confirmar que o local some.
- [ ] Buscar `anon` no projeto inteiro e confirmar que não há policy nem chave.
- [ ] Clicar em enviar e conferir que `envios` gravou.

**Armadilha:** ele vai tentar validar duplicidade só no frontend, ou vai retornar erro na tela quando o telefone repetir. As duas coisas estão erradas. A duplicidade é resolvida no servidor e a tela responde com sucesso neutro, porque quem está preenchendo é o apoiador e não tem culpa nenhuma.

---

## 7. Bloco 4 · Território

```
Bloco 4 do PRD. Requisitos RF-14, RF-15, RF-20 a RF-23.

1. Views de agregação:
   - `v_penetracao_bairro`: bairro, eleitores, cadastros, penetração %,
     lideranças atuando
   - `v_penetracao_local`: idem no nível do colégio, mais flags `buraco`
     (>= 2000 eleitores e zero lideranças âncora) e `sobreposicao`
     (2 ou mais lideranças âncora)
   - `v_cobertura_regiao`: realizado contra 48,3 / 35,1 / 16,6
   Pessoas com fora_do_municipio = true entram no total geral e ficam FORA
   de todo cálculo territorial.

2. Tabela `temperatura_historico` e um job semanal que grava o snapshot de
   cada liderança. Use pg_cron ou uma rota chamada por cron da Vercel.

3. Selos de volume em 10, 50 e 100, calculados na view de lideranças.

4. No painel, abaixo do bloco de cobrança:
   - ranking semanal por NOVOS cadastros na semana, não por total acumulado
   - tabela de penetração por bairro, ordenada por penetração CRESCENTE
   - barra de cobertura por macro-região

5. Página /(admin)/territorio ganha a silhueta dos 40 colégios: uma coluna
   por local, altura proporcional ao eleitorado, preenchimento pela
   penetração, ordenada do maior para o menor. Colégio com flag `buraco`
   recebe borda superior vermelha. Hover mostra nome, eleitorado e cadastros.
   A referência visual está em /docs/design-system-projeto-rede.html.

Nenhum número absoluto aparece sozinho quando existe um percentual que o
qualifica.
```

**Verificação:** um bairro com 1 cadastro e 136 eleitores tem que aparecer acima de um bairro com 50 cadastros e 8.384 eleitores na ordenação por penetração.

---

## 8. Bloco 5 · Relacionamento

```
Bloco 5 do PRD. Requisitos RF-05 a RF-07 e RF-24 a RF-27, RF-32.

1. Tabelas `interacoes` e `demandas` conforme Seção 6.1.
   NÃO crie nenhum campo que registre contrapartida, benefício, promessa
   ou entrega em troca de apoio. Nem com outro nome.

2. Prontuário em /(admin)/pessoas/[id]:
   - camada de identificação com origem automática
   - linha do tempo unificada de interações e demandas, cronológica reversa
   - botão "Registrar contato" sempre visível, inclusive no estado vazio
   - bloco extra visível só quando nivel = 'lideranca': árvore de indicados,
     meta e progresso, histórico de temperatura, histórico de mensagens

3. Fila global de demandas abertas em /(admin)/demandas, com filtro por
   status, categoria e responsável.

4. Promoção de apoiador a liderança: altera `nivel` na mesma linha, gera
   slug, pede os campos que faltam. Não migra registro entre tabelas e não
   perde o `indicado_por` original.

5. Reatribuição manual de indicação, individual e em lote, com registro de
   auditoria (quem mudou, quando, de quem para quem).

6. Fila de envio em lote: na lista filtrada por temperatura, um botão que
   abre as conversas uma por vez, com avanço manual. Nada dispara sozinho
   em segundo plano.

7. Tela de conflitos de cadastro em /(admin)/conflitos, para arbitragem.

Estado vazio do prontuário: convite para agir, não aviso de ausência.
```

---

## 9. Bloco 6 · Digital

```
Bloco 6 do PRD. Requisitos RF-16 e RF-33 a RF-38.

1. Tabelas `posts`, `post_roster` e `engajamentos` conforme Seção 6.1.

2. Cadastro de post em /(admin)/instagram/posts. Ao salvar, congela o roster:
   grava em `post_roster` todas as pessoas com nivel = 'lideranca' e
   ativo = true naquele instante. O roster nunca é recalculado depois.

3. Importação em /(admin)/instagram/importar:
   - aceita colagem de texto (um handle por linha) e upload de CSV
   - o operador escolhe o post e o tipo (comentario, curtida, story_mention)
   - grava o `handle_cru` exatamente como veio, sem transformação
   - tenta casar com `instagram_handle` normalizado das pessoas
   - casou: preenche `pessoa_id`. Não casou: deixa nulo.
   - `handle_cru` NUNCA é sobrescrito, em nenhuma circunstância

4. Correção manual de vínculo: tela que lista handles não casados e permite
   vincular a uma pessoa existente. Vincular altera `pessoa_id`, jamais
   `handle_cru`.

5. Temperatura digital: janela dos últimos 6 posts em que a liderança estava
   no roster. 5 ou mais presenças = ativo, 2 ou mais = irregular, abaixo
   disso = ausente. Coluna independente na lista de lideranças. NUNCA
   combinada com a temperatura de cadastro num número único.

6. /(admin)/instagram/ausencias: lista de quem faltou em 5 dos últimos 6
   posts, nominal, com botão de WhatsApp. Acumulado, nunca post a post.

7. Fila de recrutamento: handles não casados ordenados por frequência de
   engajamento, com ação de marcar para convidar.

O sistema não conversa com o Instagram. Não crie integração, não instale SDK,
não faça requisição para a plataforma. A entrada é sempre importação.
```

---

## 10. Bloco 7 · Prestação de Contas

```
Bloco 7 do PRD. Requisitos RF-39 a RF-41.

1. Tabela `exportacoes`.

2. Três perfis, definidos em configuração e não espalhados pelo código:
   - interno: tudo, nominal, com contato
   - candidato: agregados territoriais, curva semanal, cobertura dos colégios
     âncora, lideranças nominais SEM TELEFONE, nenhum apoiador nominal
   - publico: só números-síntese, sem nomes

   O perfil `candidato` nunca inclui telefone nem nome de apoiador. Trave
   isso no tipo, não só na query, e escreva um teste que falhe se algum
   campo de contato vazar nesse perfil.

3. Todo export carrega data e hora de extração no cabeçalho e é registrado
   em `exportacoes`.

4. Rota /r/[token]: visão de leitura pública, sem login, limitada ao perfil
   candidato. Token não adivinhável, revogável a qualquer momento.

5. Layout do relatório conforme a Seção 8.4 do PRD.
```

---

## 11. Bloco 8 · Pós-eleição

Não execute agora. O prompt fica registrado.

```
Bloco 8 do PRD.

1. Campo `secao` em `pessoas`, preenchido por enriquecimento posterior.
   Nunca pedido no formulário público.
2. Importação do boletim de urna por seção.
3. Cruzamento: cadastros por seção contra votos apurados por seção.
4. Implementar as pendências de LGPD da Seção 10.3 do PRD, começando pela
   decisão de política de retenção.
```

---

## 12. Prompts de manutenção

### Revisão de bloco

```
Revise o Bloco N contra o PRD e o CLAUDE.md. Liste, sem corrigir ainda:
1. Requisitos do bloco que não foram implementados.
2. Coisas implementadas que não estavam no bloco.
3. Qualquer violação das 8 invariantes.
4. Onde há dado territorial hardcoded em componente.
```

### Quando ele quebrar algo que funcionava

```
Isso funcionava antes do Bloco N. Não reescreva o componente. Encontre a
mudança específica que causou a regressão, me mostre o diff dela e proponha
a correção mínima.
```

### Antes de cada deploy

```
Rode o checklist de pronto da Seção 11.4 do PRD e me diga o que falha.
Inclua o teste de RLS: tente ler a tabela pessoas com o role anon e
confirme que falha.
```

---

## 13. Regras permanentes de conversa

Coisas que você vai precisar repetir. Vale ter à mão.

**Um bloco por vez.** Ele vai querer adiantar o próximo. Não deixe: o critério de verificação existe para pegar erro antes que ele se propague.

**Prompt grande vira código raso.** Foi por isso que o Bloco 3 virou três prompts. Quando um bloco tem mais de sete entregas, quebre.

**"Não reescreva, corrija."** A resposta padrão dele para bug é refazer o arquivo. Em bloco 5 ou 6 isso apaga decisão que você tomou lá atrás.

**Quando ele sugerir simplificar uma invariante, pergunte por quê antes de aceitar.** Às vezes ele tem razão. Na maioria das vezes ele está contornando um erro próprio.

**A cada bloco fechado, atualize o CLAUDE.md** com a decisão nova que tiver aparecido. É o que impede o Bloco 7 de contradizer o Bloco 2.

---

## 14. Ordem de ataque

```
Pré-voo            → contas, env, /docs, CLAUDE.md
Prompt 0           → calibragem de contexto
Bloco 1            → fundação
Bloco 2            → base territorial (trava tudo depois)
Bloco 3A · 3B · 3C → CAPTURA. Único bloco urgente.
                     Critério de saída: 70 lideranças com link enviado.
─────────────────── a partir daqui a base já está crescendo ───────
Bloco 4            → território
Bloco 5            → relacionamento
Bloco 6            → digital
Bloco 7            → prestação de contas
Bloco 8            → pós-eleição
```

Depois do Bloco 3C, teste com uma liderança real antes de disparar as 70. Preview no WhatsApp, cadastro de verdade, atribuição conferida no painel. Só então dispare.

---

*Fim do documento*
