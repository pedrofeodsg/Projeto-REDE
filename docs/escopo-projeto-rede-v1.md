# Núcleo de Inteligência e Dados · Gabinete do Vereador Pedro Abreu

**DOCUMENTO DE ESCOPO**

# Projeto REDE

### Hub de lideranças, monitoramento e mobilização política

Escopo preliminar · v1.0
São Pedro da Aldeia · Agosto de 2026

*Nome de trabalho. Substituir se houver definição de marca.*

---

## 1. Resumo Executivo

O Projeto REDE é o sistema de controle da estrutura política do grupo em São Pedro da Aldeia para as eleições de 2026, com apoio a um candidato a deputado federal e um a deputado estadual. Ele transforma uma rede de 70 lideranças informais em uma operação medida: cada liderança recebe uma página de cadastro exclusiva, cada apoiador cadastrado fica atribuído a quem o trouxe, e a coordenação enxerga em tempo real quem está entregando, quem parou e onde o território está descoberto.

O valor central está em substituir a percepção pela medição. Hoje a coordenação sabe quem "trabalha muito" por impressão. Com o sistema, sabe por número, por bairro e por colégio eleitoral, e consegue agir sobre quem parou antes que a campanha acabe.

### Problema

- A força da rede é declarada, não verificada. Ninguém sabe quanto cada liderança realmente entrega.
- Não existe registro de quem indicou quem. Cadastro em papel e grupo de WhatsApp não geram atribuição.
- A cobrança é manual e desorganizada, e a liderança que esfria não avisa que esfriou.
- O relacionamento com o eleitor não deixa histórico. Demanda atendida hoje se perde e não vira memória de mandato.
- A operação digital (Instagram) exige engajamento das lideranças, mas ninguém confere quem cumpriu.
- Sem base territorial, volume absoluto engana: 50 cadastros em São João (8.384 eleitores) e 50 em Três Vendas (136 eleitores) aparecem iguais no relatório.

### Solução

- Página de cadastro individual por liderança, com atribuição automática pelo link.
- Prontuário unificado de cada pessoa da base, com histórico de interações e demandas.
- Termômetro automático de temperatura das lideranças, calculado por volume e recência.
- Dashboard de coordenação com penetração real contra o eleitorado de cada bairro e local de votação.
- Envio de mensagem individual por WhatsApp em um clique, com link e nome já preenchidos.
- Módulo de monitoramento de engajamento no Instagram por importação de dados e cruzamento por @.
- Exportação agregada para os candidatos, sem exposição da base nominal.

### Os três pilares

| Pilar | O que significa no sistema |
|---|---|
| **MONITORAMENTO** | Quem cadastrou quanto, onde, quando parou, quem engajou no digital, qual a penetração por território. |
| **INTERAÇÃO** | Prontuário, registro de contatos, demandas com ciclo de status, mensagens individuais por WhatsApp. |
| **MOBILIZAÇÃO** | Rede 100x10, metas por liderança, filas de cobrança, obrigação de engajamento digital, kit de conteúdo centralizado. |

---

## 2. Objetivos do Produto

### Objetivo político

Organizar e medir a Rede 100x10 descrita no relatório de inteligência eleitoral, garantindo que a estrutura de 70 lideranças produza volume rastreável de apoiadores e cobertura territorial proporcional ao eleitorado, e deixando ao final da campanha uma base de relacionamento que sobrevive à eleição e alimenta o mandato.

### Objetivos funcionais

1. Atribuir cada apoiador cadastrado à liderança que o trouxe, de forma automática e inequívoca.
2. Classificar automaticamente a temperatura de cada liderança e expor a lista dos que precisam de cobrança.
3. Medir penetração por bairro, por local de votação e por macro-região contra o eleitorado real.
4. Registrar o histórico de relacionamento de cada pessoa da base (interações e demandas).
5. Reduzir a zero o esforço de montar e enviar mensagem individual para liderança.
6. Cruzar engajamento no Instagram com o cadastro de lideranças e apontar ausências acumuladas.
7. Produzir relatório agregado para os candidatos sem entregar a base nominal com contato.

### Métricas de sucesso

| Métrica | Alvo |
|---|---|
| **Cobertura de ativação** | 100% das 70 lideranças com link enviado e envio registrado. |
| **Piso de entrega** | 700 cadastrados (70 × meta mínima de 10). |
| **Lideranças em "afastado"** | Abaixo de 10% da rede após a segunda rodada de cobrança. |
| **Cobertura de colégios âncora** | Ao menos uma liderança ativa em cada um dos 15 maiores locais de votação (59,6% do eleitorado). |
| **Equilíbrio regional** | Distribuição de cadastros dentro de 10 pontos percentuais da proporção do eleitorado (R1 48,3% · R2 35,1% · R3 16,6%). |
| **Casamento de handle** | Acima de 80% dos @ importados do Instagram vinculados a uma pessoa da base. |
| **Projeção de trabalho** | Cerca de 15.000 pessoas alcançadas pela rede, aproximadamente 20% do eleitorado de 75.083. |

**Nota sobre a projeção.** O relatório de mobilização projeta 1.000 pessoas por liderança, o que em 70 lideranças daria 70.000, ou 93% da cidade. O número não se sustenta e usá-lo como meta faz uma campanha bem-sucedida parecer fracasso. A projeção defensável assume entrega integral dos 100 por liderança e multiplicação parcial (cerca de um terço dos recrutados trazendo 4 em vez de 10). O sistema devolve a taxa real na primeira semana e a meta deve ser recalibrada sobre o observado.

---

## 3. Público-Alvo

### Perfil primário: Coordenação

Quem opera o sistema por dentro. Cadastra lideranças, dispara mensagens, acompanha o dashboard, registra demandas e decide onde investir tempo. Acesso total, com login.

**Dor central:** sabe que a rede tem 70 pessoas, mas não sabe quais estão trabalhando de verdade.

### Perfil secundário: Liderança

As 70 pessoas da estrutura. Não fazem login e não acessam o sistema. Recebem um link, cadastram apoiadores por ele e recebem cobrança e reconhecimento por WhatsApp.

**Dor central:** quer reconhecimento pelo que traz e não quer aprender ferramenta nova.

**Restrição de projeto:** qualquer coisa que exija login, senha ou aprendizado da liderança está fora. O contato dela com o sistema é uma URL e um formulário.

### Perfil terciário: Apoiador

Quem preenche o formulário público. Contato único com o sistema, em geral pelo celular, em geral em pé, em geral em menos de um minuto.

**Dor central:** nenhuma. Está fazendo um favor para alguém que conhece. Cada campo a mais é motivo para desistir.

### Anti-persona

O Projeto REDE não é:

- Ferramenta de disparo em massa de WhatsApp.
- Registro de promessas, benefícios ou contrapartidas oferecidas a eleitores.
- Base construída por importação de lista comprada ou raspagem de cadastro público.
- Placar público entre lideranças.

---

## 4. Escopo Funcional

### 4.1 Módulo de Lideranças (admin)

- Cadastro manual, uma a uma, pela coordenação. Não existe autocadastro de liderança.
- Campos: nome, WhatsApp, bairro de atuação, local de votação âncora, @ do Instagram, meta assumida (padrão 10), linha pessoal para a mensagem, tags.
- Geração automática de slug único para a página de cadastro.
- Macro-região derivada automaticamente do local de votação âncora.
- O local de votação âncora é onde a liderança **atua**, que pode não ser onde ela mora.
- Promoção: qualquer pessoa da base pode ser elevada a liderança sem migração de registro. Basta mudar o nível e gerar o slug.

### 4.2 Página Pública de Cadastro

Uma página por liderança, em `/[slug]`. Mobile-first, carregamento rápido, sem login.

**Campos, e nada além disso:**

1. Nome completo
2. WhatsApp (chave única do sistema)
3. Bairro onde mora (select com os 31 bairros + "outro município")
4. Onde vota (select em cascata, filtrado pelo bairro escolhido)

**Regras de comportamento:**

- O select de local de votação vem pré-filtrado pelo bairro e ordenado com o local do próprio bairro em primeiro. Objetivo: um toque, não uma digitação.
- Bairros com mais de um local (São João, Campo Redondo, Baixo Grande, Porto do Carro) mostram todas as opções. Não assumir um local por bairro.
- "Outro município" é obrigatório na lista. Os candidatos são federal e estadual, votados no estado inteiro, e contato em Cabo Frio ou Araruama vale o mesmo voto. Ele apenas não entra no cruzamento territorial.
- Tela de confirmação com botão "cadastrar mais um", para a liderança que cadastra várias pessoas seguidas no próprio celular.
- Tela de confirmação com botão de compartilhar o link **da liderança**, com texto pronto. É assim que a Fase 3 da Rede 100x10 (os +10) acontece sem dar link individual a cada apoiador.
- Meta tags Open Graph configuradas (`og:image`, `og:title`, `og:description`). Link sem preview no WhatsApp parece golpe e derruba clique.

**Fora do formulário, por decisão:** título de eleitor, CPF, seção eleitoral, data de nascimento, e-mail, endereço completo.

### 4.3 Prontuário

Ficha única, mesma estrutura para liderança e apoiador. Apoiador tem prontuário magro, liderança tem prontuário cheio.

**Camada 1: identificação.** Dados do formulário, mais origem automática (qual link, data e hora, dispositivo).

**Camada 2: linha do tempo.** Interações e demandas em ordem cronológica reversa.

- **Interação:** registro simples de contato (ligação, visita, conversa na rua, mensagem). Tipo, canal, descrição livre, autor, data.
- **Demanda:** tem ciclo de status (aberta, em andamento, resolvida, sem solução), categoria, responsável e data de resolução.

**Camada 3: bloco da liderança.** Visível apenas para nível liderança. Árvore de indicados, meta, progresso, histórico de temperatura por semana, tags, histórico de mensagens enviadas, histórico de engajamento no Instagram.

**Regra de projeto:** ninguém preenche prontuário proativamente para milhares de pessoas. Ele se preenche por evento. A tela precisa de estado vazio limpo e botão de "registrar contato" sempre visível. Prontuário que cobra preenchimento vira prontuário abandonado.

**Regra dura:** não existe campo, em nenhuma tela, para registrar o que foi prometido ou entregue em troca de apoio. Atendimento de demanda de morador é trabalho de mandato e é legítimo. Um registro de contrapartida transforma o banco em prova documental. Isso vale também para o campo de observação livre, e exige orientação verbal às 70 lideranças.

### 4.4 Termômetro de Lideranças

Estado calculado automaticamente, nunca marcado à mão, recalculado diariamente e a cada novo cadastro.

| Estado | Critério |
|---|---|
| **Aguardando** | Link enviado há menos de 5 dias e ainda sem cadastros. |
| **Afastado** | Zero cadastros, com link enviado há 5 dias ou mais. |
| **Frio** | 1 a 4 cadastros, ou qualquer volume sem cadastro novo há 10 dias ou mais. |
| **Quente** | 5 a 9 cadastros, com atividade nos últimos 10 dias. |
| **Muito quente** | 10 ou mais cadastros (meta batida), com atividade nos últimos 10 dias. |
| **Engajado** | 20 ou mais cadastros, distribuídos em 3 semanas distintas ou mais, ativo. |

**Por que volume e recência juntos.** Volume puro engana. Liderança que trouxe 12 pessoas há três semanas e sumiu apareceria como "muito quente" estando morta. Sem o componente de recência, o termômetro vira placar histórico e para de indicar ação.

**Por que "aguardando" existe.** No dia em que o sistema sobe, as 70 lideranças têm zero cadastros. Sem esse estado, o painel abre com 70 alertas vermelhos e o alerta perde significado na estreia.

**Por que "engajado" exige constância.** Quem despeja 25 contatos da agenda num sábado esvaziou a lista. Quem traz 4 por semana durante um mês está trabalhando a rede, e é quem vai chegar aos 100. Os dois não podem receber o mesmo selo.

**Selos adicionais:** 50+ e 100+ cadastros. Marcam quem entrou em outra categoria, alinhado à meta da Rede 100x10.

**Segundo eixo: temperatura digital.** Calculada pelo módulo de Instagram, independente da temperatura de cadastro. Quem cadastra 20 e nunca comenta é um problema diferente de quem comenta em tudo e cadastra zero. Dois termômetros, nunca combinados em um número só.

### 4.5 Tags e Segmentação

Tag é **atributo declarado**, marcado pela coordenação: igreja, comércio, mototáxi, saúde, educação, associação de moradores, esporte, família, servidor público.

**Tag não é temperatura e não é território.** Temperatura é estado calculado. Território (bairro e macro-região) é derivado do local de votação. Se as três coisas virarem o mesmo campo, perde-se a pergunta que mais importa: "das minhas lideranças de igreja, quantas estão frias em R2?".

### 4.6 Dashboard de Coordenação

Tela inicial. Ordem de leitura decrescente por urgência de ação.

**Faixa de números (4 cartões):** total de cadastrados · lideranças ativas sobre total · percentual da meta agregada (piso 700) · cadastros nas últimas 24 horas.

**Termômetro da rede:** barra horizontal com as seis faixas e contagem. Cada faixa é clicável e filtra a lista de lideranças.

**Bloco de cobrança (quem não cadastrou ninguém):** lista nominal, dias desde o envio do link, botão de WhatsApp que abre a conversa já com o template de cutucada. É o bloco mais valioso da tela. Não é relatório, é fila de trabalho.

**Quem está engajando:** ranking por **novos cadastros na semana**, não por total acumulado. Total acumulado premia quem tem agenda grande e cristaliza o ranking em duas semanas. Novos na semana mostra quem está trabalhando agora e muda toda segunda.

**Bairros:** cadastros absolutos e **penetração percentual** lado a lado, contra o eleitorado de cada bairro. Ordenável por qualquer um dos dois.

**Cobertura por macro-região:** realizado contra a proporção do eleitorado (R1 48,3% · R2 35,1% · R3 16,6%).

**Locais de votação:** penetração por local, com destaque para locais grandes sem liderança atribuída (buraco) e locais com duas ou mais lideranças (sobreposição).

**Sobre ranking público:** o ranking completo fica apenas na visão da coordenação. Divulgação no grupo principal, se houver, limitada ao top 5, sem a tabela inteira. Ranking público motiva os dez primeiros e desmotiva os quarenta últimos.

### 4.7 Motor de Mensagens (WhatsApp)

Envio individual via `wa.me` com texto pré-preenchido. Sem API, sem custo, sem integração. O sistema monta a mensagem e abre a conversa. **O envio é sempre um toque humano.**

```
https://wa.me/55<numero_digitos>?text=<mensagem_urlencoded>
```

**Requisitos técnicos:**

- Telefone armazenado normalizado (somente dígitos, com 55) desde o cadastro. Sem isso, DDD com parêntese e hífen quebra metade dos links.
- `encodeURIComponent` na mensagem inteira. Quebra de linha como `%0A`.

**Templates como registro no banco, não hardcoded.** Variáveis disponíveis: `{nome}`, `{link_cadastro}`, `{cadastrados}`, `{meta}`, `{faltam}`, `{linha_pessoal}`.

**Templates iniciais:**

| Template | Uso |
|---|---|
| **Boas-vindas** | Primeiro contato, entrega do link. |
| **Cutucada** | Liderança em "afastado". |
| **Reconhecimento** | Meta batida. Usa `{cadastrados}`. |
| **Reativação** | Liderança que parou. Usa `{faltam}`. |

**Linha pessoal.** Campo editável por liderança, opcional, inserido no corpo da mensagem de boas-vindas. Uma frase que só serve para aquela pessoa ("depois do que você fez na Rua do Fogo em 2024, não tinha como não te chamar"). É a diferença entre a liderança sentir que foi escolhida e sentir que foi incluída numa lista. Se vazio, o texto flui sem ele.

**Registro de envio.** Ao clicar, o sistema grava data, hora, template e operador. Isso alimenta três coisas: evita envio duplicado, mostra quantas lideranças ainda não receberam o link, e faz o cálculo de "afastado" contar dias **desde o envio**, não desde o cadastro no admin.

**Limitação conhecida:** o clique registra a abertura do WhatsApp, não a confirmação de envio. Necessário um botão de "marcar como não enviado" no admin para correção manual.

**Ação em lote com trava:** na lista filtrada por temperatura, botão que abre as conversas em sequência, uma por vez, com envio manual em cada uma. Nada dispara em segundo plano.

**Mensagem de boas-vindas aprovada:**

> Olá [NOME], aqui é o Pedro Abreu.
>
> Vou ser direto: eu não mandei essa mensagem para a cidade inteira. Essa mensagem é privada, e se você recebeu é porque vai fazer diferença nessa eleição e eu reconheço a sua importância para o nosso grupo.
>
> A campanha começou e o tempo é curto. São menos de 50 dias até 4 de outubro, e eleição aqui se decide por margem apertada. Você sabe disso melhor do que ninguém.
>
> Esta página de cadastro é exclusivamente sua. Todo apoiador que você cadastrar por ela fica registrado como seu:
> [LINK_CADASTRO]
>
> Nosso grupo sempre bateu recorde em toda eleição que disputou, e essa não vai ser diferente. Comece hoje com 10 nomes: família, vizinho, quem você conversa todo dia. Depois disso vem sozinho.
>
> Não estou pedindo favor. Estou chamando você para dentro. Posso contar com você?

### 4.8 Módulo de Monitoramento de Instagram

**Obrigação da rede:** toda liderança curte, comenta e compartilha todo post oficial. 70 lideranças, 70 interações.

**Restrição de plataforma que define a arquitetura:**

| Sinal | Disponibilidade |
|---|---|
| **Comentários** | Lista nominal de @ disponível via API oficial em posts próprios. |
| **Curtidas** | Apenas contagem agregada. A lista de quem curtiu não é exposta por nenhuma via oficial. |
| **Compartilhamento em story com menção** | Rastreável via menções. |
| **Compartilhamento por DM / envio direto** | Não rastreável. |

**Consequência de produto:** o **comentário vira a exigência principal**, porque é o sinal mensurável e o que mais pesa no alcance. A curtida vira piso, conferida por contagem agregada e por verificação manual quando necessário.

**Arquitetura de ingestão desacoplada.** O sistema não conversa com o Instagram. Ele recebe dados. A entrada é sempre a mesma, independente da origem: lista de @ + qual post + qual ação. Isso permite que um extrator externo (a construir, fora deste escopo) alimente o sistema por importação manual sem que o hub dependa da plataforma. Se o extrator quebrar ou mudar de método, o hub não sente.

**Regras de dados:**

- O @ é a chave de ligação. Armazenado normalizado (minúsculo, sem @, sem espaço) no cadastro da liderança.
- O registro de engajamento guarda o **handle cru** vindo da importação, com o vínculo à pessoa em campo separado. Nunca sobrescrever. Se a liderança trocar de @ no meio da campanha, corrige-se o vínculo sem perder histórico.
- O extrator deve devolver **handle**, não nome de exibição. Nome muda e se repete, handle é único.

**Handles não casados são fila de recrutamento.** @ que engajou e não bate com ninguém da base não é erro de importação. É gente engajada que você não tem cadastrada, e em campanha municipal quem comenta em post político por vontade própria é liderança em potencial. Tela dedicada, com ação de "convidar".

**Relatório de ausência, não de presença.** A tela útil lista quem faltou, com botão de WhatsApp ao lado. Mesma lógica do bloco de cobrança.

**Sempre acumulado, nunca post a post.** Faltar em um post não significa nada. Faltar em 5 dos últimos 6 é diagnóstico. O alerta dispara na janela, não no evento.

**Roster congelado por post.** Cada post guarda quem era liderança **naquela data**. Liderança cadastrada em setembro não pode aparecer como ausente nos posts de agosto.

### 4.9 Exportação e Relatório para Candidatos

Os candidatos federal e estadual vão exigir prestação de contas da estrutura. O relatório para eles é um produto diferente do dashboard interno: a coordenação usa o painel para trabalhar, o candidato usa o relatório para decidir onde põe recurso e palanque.

**Regra central: não exportar base nominal de apoiadores com contato.** A base é o ativo de negociação da estrutura. No momento em que o candidato tem os telefones, ele fala direto e a liderança local vira intermediário dispensável. Isso não é desconfiança, é como a relação funciona, e estrutura que entrega dado bruto perde o assento na mesa na eleição seguinte.

**Perfis de exportação, como configuração e não como código:**

| Perfil | Conteúdo |
|---|---|
| **Interno** | Tudo, nominal, com contato. Uso da coordenação. |
| **Candidato** | Agregados: total, distribuição por macro-região contra o eleitorado, penetração por local de votação, curva semanal, lideranças ativas, cobertura dos colégios âncora. Lideranças nominais **sem telefone**. Nenhum apoiador nominal. |
| **Público** | Apenas números-síntese, sem nomes. |

**Requisitos:**

- Todo export é snapshot com data de extração carimbada. Número muda todo dia, e comparação sem data de corte faz a estrutura parecer desorganizada.
- Preferência por link com token de leitura, revogável, atualizando sozinho, em vez de arquivo. Arquivo circula, link se revoga, e o dado nunca sai do servidor.

### 4.10 Base Territorial (seed)

Carga inicial obrigatória, extraída do relatório de inteligência eleitoral (TSE, extração de 03/08/2026, 59ª Zona Eleitoral).

- **31 bairros** com eleitorado e macro-região.
- **40 locais de votação** com bairro, eleitorado, número de seções e macro-região. **33 estão confirmados no relatório.** Os demais (Polo Cederj, Horto-Escola, E.M. Dulce Jotta e os restantes) precisam ser completados na base do TSE antes da carga.
- **3 macro-regiões** com totais de referência: R1 Central 36.252 (48,3%) · R2 Leste 26.357 (35,1%) · R3 Balneários/Noroeste 12.474 (16,6%).
- **Total de referência:** 75.083 eleitores aptos, 252 seções.

Esse seed é o que transforma contagem em penetração. Sem ele, o dashboard mostra volume e volume mente.

---

## 5. Fluxo Principal

### Fluxo da liderança

| Etapa | Ação | Detalhamento |
|---|---|---|
| 1 | **Cadastro** | Coordenação cadastra a liderança no admin, define meta e linha pessoal. |
| 2 | **Ativação** | Coordenação clica em enviar, revisa a mensagem no WhatsApp e envia. Sistema registra o envio. |
| 3 | **Operação** | Liderança compartilha o link com sua rede ou cadastra pessoas no próprio celular. |
| 4 | **Medição** | Sistema atribui cada cadastro, recalcula temperatura e atualiza o dashboard. |
| 5 | **Cobrança** | Liderança em "afastado" ou "frio" entra na fila e recebe cutucada ou reativação. |
| 6 | **Reconhecimento** | Meta batida dispara a fila de reconhecimento, com o número dentro da mensagem. |

### Fluxo do apoiador

| Etapa | Ação | Detalhamento |
|---|---|---|
| 1 | **Chegada** | Abre o link da liderança pelo WhatsApp. |
| 2 | **Preenchimento** | Quatro campos. Bairro e local de votação em select. |
| 3 | **Validação** | Telefone verificado contra a base. Duplicata recebe mensagem neutra. |
| 4 | **Confirmação** | Tela com agradecimento, botão de compartilhar o link da liderança e botão de cadastrar mais um. |
| 5 | **Relacionamento** | Prontuário criado. Interações e demandas passam a ser registradas conforme acontecem. |

---

## 6. Arquitetura Técnica (preliminar)

### Stack recomendada

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind |
| Backend / API | Next.js API Routes + Server Actions |
| Banco de Dados | Supabase (PostgreSQL + Auth + RLS) |
| Autenticação | Supabase Auth, apenas para coordenação. Liderança e apoiador não fazem login. |
| Hospedagem | Vercel + Supabase |
| Envio de mensagem | `wa.me` com texto pré-preenchido, sem API |

**Por que Supabase e não WordPress.** Row Level Security. A coordenação tem múltiplos operadores com escopos diferentes, e política de segurança escrita no banco é impossível de furar pelo frontend. Postgres também entrega as agregações territoriais e as consultas recursivas sem malabarismo.

### Modelo de dados (núcleo)

**`pessoas`** (tabela única, autorreferente)
`id` · `nome` · `telefone` (normalizado, único) · `nivel` (coordenacao | lideranca | apoiador) · `indicado_por` (FK → pessoas) · `bairro_moradia_id` · `local_votacao_id` · `instagram_handle` · `slug` (apenas liderança) · `meta` (padrão 10) · `linha_pessoal` · `origem` (link | admin) · `criado_em` · `ativo`

Tabela única e autorreferente por decisão: pessoas mudam de nível, e promoção de apoiador a liderança não pode exigir migração de registro.

**`bairros`** · `id` · `nome` · `eleitores` · `regiao`

**`locais_votacao`** · `id` · `nome` · `endereco` · `bairro_id` · `eleitores` · `secoes` · `regiao`

**`tags`** e **`pessoa_tags`** · relação N para N

**`interacoes`** · `id` · `pessoa_id` · `tipo` · `canal` · `descricao` · `autor` · `criado_em`

**`demandas`** · `id` · `pessoa_id` · `titulo` · `descricao` · `categoria` · `status` · `responsavel` · `aberta_em` · `resolvida_em`

**`templates_mensagem`** · `id` · `nome` · `corpo` · `ativo`

**`envios`** · `id` · `pessoa_id` · `template_id` · `enviado_em` · `operador` · `confirmado`

**`conflitos_cadastro`** · `id` · `telefone` · `nome_tentado` · `lideranca_tentou_id` · `pessoa_existente_id` · `criado_em` · `resolvido`

**`posts`** · `id` · `url` · `publicado_em` · `legenda` · `curtidas_total` · `comentarios_total`

**`post_roster`** · `post_id` · `pessoa_id` (congelado na data do post)

**`engajamentos`** · `id` · `post_id` · `handle_cru` · `pessoa_id` (nulável) · `tipo` (curtida | comentario | story_mention) · `texto` · `origem` (api | importacao_manual) · `capturado_em`

**`temperatura_historico`** · `id` · `pessoa_id` · `estado` · `calculado_em`

**`exportacoes`** · `id` · `perfil` · `gerado_em` · `operador` · `token` · `revogado`

### Regras críticas de integridade

1. **Telefone é chave única global.** Segundo cadastro do mesmo número não cria registro, grava em `conflitos_cadastro` e devolve mensagem neutra ("esse contato já faz parte"). A tela **nunca revela** de quem é. Duas lideranças descobrindo que disputam o mesmo contato é briga que chega na coordenação no pior momento.
2. **`indicado_por` sempre aponta para uma liderança** no MVP. O campo é autorreferente para suportar atribuição manual do terceiro nível: quando a liderança informa que fulana trouxe 12, a coordenação pode reatribuir esses 12 a ela no admin sem que ela tenha link próprio.
3. **Handle de Instagram nunca sobrescreve o registro histórico de engajamento.**
4. **Nenhum campo, em nenhuma tabela, registra contrapartida oferecida.**

---

## 7. Fora de Escopo (MVP)

Itens explicitamente fora da primeira versão:

- **Painel individual da liderança.** Cancelado do MVP. Ver seção 9 para a razão e o momento de reintrodução.
- **Link individual para apoiadores.** Apenas lideranças têm link. Os +10 da Rede 100x10 caem no link da própria liderança.
- **Login para lideranças.** Nenhuma tela autenticada fora da coordenação.
- **Disparo em massa ou automatizado de WhatsApp.** Todo envio é individual e com toque humano.
- **Extrator de curtidas e comentários do Instagram.** Sistema separado, a construir. O hub apenas recebe importação.
- **Captura de seção eleitoral no formulário público.** Ver pendências.
- **Coleta de CPF, título de eleitor, e-mail ou endereço completo.**
- **App mobile nativo.** Web responsivo apenas.
- **Integração com dados de urna ao vivo.** Cruzamento é pós-eleição.

---

## 8. Roadmap Proposto

Sequência de entrega, sem estimativa de prazo. Cada fase depende da anterior estar no ar.

| Fase | Entregas |
|---|---|
| **Fase 0 · Base** | Seed territorial (31 bairros, 40 locais, 3 regiões). Cadastro das 70 lideranças no admin. Geração dos slugs. |
| **Fase 1 · Captura** | Página pública de cadastro no ar. Motor de mensagens com template de boas-vindas. Envio dos 70 links. Dashboard mínimo (contagem, termômetro, bloco de cobrança). |
| **Fase 2 · Território** | Penetração por bairro, local e macro-região. Detecção de buracos e sobreposição. Ranking semanal. |
| **Fase 3 · Relacionamento** | Prontuário completo, interações, demandas com ciclo de status. Templates de cutucada, reativação e reconhecimento. |
| **Fase 4 · Digital** | Cadastro de posts, importação manual de engajamento, cruzamento por handle, relatório de ausência acumulada, fila de recrutamento de não casados. |
| **Fase 5 · Prestação de contas** | Perfis de exportação, snapshot datado, link com token para os candidatos. |
| **Fase 6 · Pós-eleição** | Cruzamento de cadastros por seção contra o boletim de urna. Migração da base para a operação de mandato. |

**A Fase 1 é a única urgente.** Cada dia com a página fora do ar é uma conversa que a liderança teve e não foi registrada. Tudo que não é captura pode esperar.

---

## 9. Modelo Operacional

### Papéis

| Papel | Acesso | Responsabilidade |
|---|---|---|
| **Coordenação geral** | Total | Cadastro de lideranças, cobrança, decisão territorial, exportação. |
| **Operador** | Sem exportação e sem edição de meta | Registro de interações e demandas, envio de mensagens. |
| **Liderança** | Nenhum | Cadastrar apoiadores pelo link, engajar no Instagram, distribuir conteúdo oficial. |

### Rotina de uso da coordenação

1. Abre o dashboard pela manhã.
2. Lê o bloco de cobrança. Dispara as mensagens da fila.
3. Confere o ranking semanal e o reconhecimento de quem bateu meta.
4. Após cada post oficial, importa o engajamento e checa a ausência acumulada.
5. Registra no prontuário as demandas que chegaram pelo gabinete.

### Sobre o painel individual da liderança

Foi projetado e retirado do MVP por uma razão de campo: entregar dois links na primeira mensagem divide a atenção e a liderança abre o errado. Um link, uma ação.

Ele permanece no desenho para uma segunda leva, entregue depois que a liderança já cadastrou os primeiros e quer saber o número. Nesse momento o link chega como recompensa, não como tarefa, e funciona muito melhor.

**Enquanto isso, o número vai dentro da mensagem.** O template de reconhecimento usa `{cadastrados}` no corpo do texto. Resolve a motivação sem link, e ainda gera contato direto com a pessoa.

### Sobre a distribuição de conteúdo

O sistema **não** distribui conteúdo. A Rede 100x10 opera por grupo principal no WhatsApp, com conteúdo centralizado pela coordenação e repasse pessoal das lideranças. O sistema monitora o resultado desse repasse (engajamento no Instagram), não executa a distribuição.

---

## 10. Riscos e Premissas

### Principais riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| **Liderança não usa o link e cadastra no papel** | Perda total de atribuição, sistema vira teatro. | Formulário de 4 campos, botão de cadastrar mais um, mensagem que enfatiza "fica registrado como seu". Reforço na reunião de largada. |
| **Duplicidade entre lideranças** | Número total inflado, decisão errada, atrito interno. | Telefone como chave única, primeiro cadastro leva, mensagem neutra na tela, fila de conflitos para arbitragem privada. |
| **Erro no campo de local de votação** | Penetração territorial fica errada e o cruzamento pós-eleição não fecha. | Select em cascata pré-filtrado pelo bairro, com o local do próprio bairro em primeiro. Nunca campo livre. |
| **Rede esfria após a primeira semana** | Curva morre e a meta não é atingida. | Termômetro com componente de recência, bloco de cobrança diário, template de reativação, reconhecimento automático de meta batida. |
| **Conta oficial do Instagram restringida por raspagem** | Perda do canal digital em plena campanha. | Ingestão desacoplada. O hub nunca conversa com a plataforma. Extração fica em sistema separado, sob decisão consciente de risco. |
| **Meta irreal desmotiva a rede** | Liderança olha 100 e desiste antes de tentar. | Piso de 10 na comunicação, com 100 como horizonte. Recalibração da projeção agregada sobre a taxa observada na primeira semana. |
| **Base exportada para candidato com contato** | Perda do ativo de negociação da estrutura. | Perfis de exportação travados por configuração. Perfil candidato nunca inclui telefone de apoiador. |
| **Registro de contrapartida no campo livre** | Exposição jurídica grave. | Ausência de campo dedicado, orientação verbal às 70 lideranças, revisão periódica dos campos de observação. |

### Premissas

- A coordenação cadastra as 70 lideranças manualmente e conhece cada uma o suficiente para escrever uma linha pessoal.
- As lideranças têm WhatsApp ativo e perfil no Instagram.
- O apoiador sabe o nome da escola onde vota, mesmo sem saber a seção.
- A base nasce inteiramente de cadastro consentido. Nenhuma lista comprada, nenhuma importação de cadastro público.
- O extrator de Instagram será construído em separado e alimentará o sistema por importação manual.

---

## 11. Pendências Registradas

Itens conscientemente adiados, registrados para tratamento posterior.

### 11.1 LGPD

Filiação e opinião política são dados pessoais sensíveis (Lei 13.709/2018, art. 5º, II), com exigência de consentimento específico e destacado. A tratar antes ou logo após a entrada em produção:

- Texto de consentimento no formulário público, específico e destacado, não checkbox escondido.
- Finalidade declarada do tratamento.
- Política de retenção definida: o que acontece com a base após novembro. Descarte, ou migração para a base de mandato com novo consentimento. A decisão vira campo no banco (`consentimento_versao`, `consentimento_em`, `finalidade`).
- Canal de exclusão a pedido do titular.
- Criptografia em repouso e política de acesso por operador.

### 11.2 Seção eleitoral

O formulário captura o local de votação, não a seção. A seção é o que permite o cruzamento com o resultado oficial, que é publicado por seção.

Solução prevista: campo `secao` na tabela de pessoas, preenchido por enriquecimento posterior (equipe, contato telefônico ou no dia da votação), nunca pedido ao eleitor no formulário. Pedir seção no cadastro derruba a taxa de conclusão, porque a pessoa não sabe de cabeça e precisa procurar o título.

### 11.3 Cruzamento com boletim de urna

Após a apuração, cruzar cadastros por seção contra votos apurados por seção. É o único documento que prova que a rede virou voto, e é a base da conversa de 2028.

Depende de 11.2 estar resolvido para uma parcela relevante da base.

### 11.4 Disparo em massa

Automação de envio massivo de mensagens contratada de terceiro é vedada pela legislação eleitoral. Mensagem individual e orgânica para quem consentiu é outra coisa. Antes de qualquer integração com API de mensageria, verificar o texto vigente da resolução do TSE aplicável ao pleito.

### 11.5 Completar o seed de locais de votação

33 dos 40 locais estão confirmados no relatório de inteligência. Os demais precisam ser levantados na base do TSE (59ª ZE) antes da carga inicial.

---

## 12. Próximos Passos

1. Validar este escopo e priorizar ajustes.
2. Completar o seed dos 40 locais de votação na base do TSE.
3. Levantar os dados das 70 lideranças: nome, WhatsApp, bairro de atuação, local âncora, @ do Instagram, tags.
4. Definir a meta individual de cada liderança na reunião de largada.
5. Escrever as 70 linhas pessoais.
6. Subir Fase 0 e Fase 1 com Claude Code.
7. Testar o link e o preview do WhatsApp com uma liderança antes de disparar as 70.
8. Reunião de largada com a rede, incluindo os 10 minutos de orientação sobre o que não se registra no sistema.

---

*Fim do documento*
