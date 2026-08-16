# Núcleo de Inteligência e Dados · Gabinete do Vereador Pedro Abreu

**PRODUCT REQUIREMENTS DOCUMENT (PRD)**

# Projeto REDE

### Hub de lideranças, monitoramento e mobilização política
*De uma rede informal de 70 lideranças a uma operação medida por território.*

Versão 1.0 · PRD Completo
Desenvolvimento guiado via Claude Code
São Pedro da Aldeia · Agosto de 2026

---

## Como usar este PRD

Este documento descreve o sistema por inteiro, do banco de dados à tela. A estrutura é sequencial: as seções 1 a 4 explicam o produto e as decisões, e a partir da seção 5 o documento vira referência de consulta durante o desenvolvimento.

O sistema é construído em uma janela curta de campanha. Isso significa que a ordem de execução importa mais do que a completude: a Seção 11 divide a entrega em blocos autocontidos, e o Bloco 3 é o único que precisa estar no ar com urgência. Tudo antes dele é fundação, tudo depois é ganho incremental.

> **Leitura recomendada:** seções 1 a 4 em ordem, mais a Seção 9 (Motor de Regras), que é onde mora a inteligência do produto. As demais como referência.

### Estrutura do documento

1. **Visão do Produto** — o que é, para quem e por quê.
2. **Personas e Jobs to be Done** — quem usa e o que quer resolver.
3. **Requisitos Funcionais** — o que o sistema precisa fazer.
4. **Requisitos Não-Funcionais** — como o sistema precisa se comportar.
5. **Especificações Técnicas** — stack, arquitetura, estrutura de pastas.
6. **Modelo de Dados** — estrutura do banco e base territorial de referência.
7. **Fluxos Detalhados** — passo a passo de cada operação.
8. **Design e Interface** — identidade visual e componentes.
9. **Motor de Regras e Cálculos** — temperatura, penetração, casamento de dados.
10. **Segurança e LGPD** — proteção de dados e pendências registradas.
11. **Plano de Execução** — blocos, entregáveis e dependências.
12. **Glossário** — termos técnicos explicados.

---

## 1. Visão do Produto

### 1.1 Elevator Pitch

O **Projeto REDE** transforma uma estrutura política informal de 70 lideranças em uma operação medida. Cada liderança recebe uma página de cadastro exclusiva; cada apoiador que entra por ela fica atribuído a quem o trouxe; e a coordenação vê em tempo real quem está entregando, quem parou e quais bairros estão descobertos, sempre contra o eleitorado real de cada território. Nenhuma liderança precisa fazer login, aprender ferramenta ou instalar nada: o contato dela com o sistema é um link no WhatsApp.

### 1.2 Problema que Resolve

A estrutura política de uma cidade opera por percepção. A coordenação sabe quem "trabalha muito" por impressão, e descobre no dia da apuração que metade da rede não entregou nada. Não existe registro de quem indicou quem, a cobrança é manual e desorganizada, e a liderança que esfria nunca avisa que esfriou.

O problema é agravado pela ausência de denominador. Sem saber quantos eleitores existem em cada bairro, volume absoluto engana: 50 cadastros em São João (8.384 eleitores) e 50 em Três Vendas (136 eleitores) aparecem iguais em qualquer planilha, sendo que o segundo é uma penetração 61 vezes maior.

O resultado é uma campanha que descobre onde estava fraca depois que a urna fechou, e que chega na eleição seguinte sem nenhum dado para negociar com candidatos.

### 1.3 Proposta de Valor

Para **a coordenação de uma estrutura política municipal** que precisa mobilizar dezenas de lideranças em uma janela curta e não tem como medir quem entrega, **o Projeto REDE** é um hub de controle que **atribui cada apoiador à liderança que o trouxe e mede a penetração real por território**, diferente de planilhas e grupos de WhatsApp, que registram volume sem atribuição, e de CRMs genéricos, que exigem login e treinamento de gente que não vai fazer nem uma coisa nem outra.

### 1.4 Diferenciação Competitiva

| Solução | Atribuição | Base territorial | Esforço da liderança |
|---|---|---|---|
| Grupo de WhatsApp | Nenhuma | Nenhuma | Baixo |
| Planilha compartilhada | Manual e frágil | Nenhuma | Médio (precisa preencher) |
| CRM genérico | Sim | Nenhuma | Alto (login e treinamento) |
| **Projeto REDE** | **Automática, pelo link** | **75.083 eleitores em 31 bairros e 40 locais** | **Nenhum (só compartilhar link)** |

### 1.5 Objetivos e Métricas

#### Objetivo 1 — Ativar a rede inteira

- **KR1:** 100% das 70 lideranças cadastradas com link gerado.
- **KR2:** 100% com envio de link registrado no sistema.
- **KR3:** Menos de 10% da rede no estado "afastado" após a segunda rodada de cobrança.

#### Objetivo 2 — Produzir volume rastreável

- **KR1:** 700 apoiadores cadastrados (piso: 70 lideranças × meta mínima de 10).
- **KR2:** 100% dos cadastros com liderança atribuída e local de votação preenchido.
- **KR3:** Taxa de conclusão do formulário público acima de 80% (quem abre, termina).

#### Objetivo 3 — Cobrir o território de forma proporcional

- **KR1:** Ao menos uma liderança ativa em cada um dos 15 maiores locais de votação (59,6% do eleitorado).
- **KR2:** Distribuição de cadastros dentro de 10 pontos percentuais da proporção real do eleitorado (R1 48,3% · R2 35,1% · R3 16,6%).
- **KR3:** Nenhum local de votação acima de 2.000 eleitores sem liderança atribuída.

#### Objetivo 4 — Medir a operação digital

- **KR1:** Acima de 80% dos handles importados do Instagram vinculados a uma pessoa da base.
- **KR2:** Presença de comentário de ao menos 70% da rede nos posts oficiais.

#### Projeção de trabalho (não é meta)

Cerca de **15.000 pessoas alcançadas**, aproximadamente 20% do eleitorado de 75.083.

> **Nota crítica.** O relatório de mobilização projeta 1.000 pessoas por liderança, o que em 70 lideranças daria 70.000, ou 93% da cidade. O número não se sustenta, e adotá-lo como meta faz uma campanha bem-sucedida parecer fracasso. A projeção de 15.000 assume entrega integral dos 100 por liderança e multiplicação parcial (cerca de um terço dos recrutados trazendo 4 em vez de 10). O sistema devolve a taxa real na primeira semana, e a meta agregada deve ser recalibrada sobre o observado, nunca sobre a projeção.

---

## 2. Personas e Jobs to be Done

### 2.1 Persona Primária — A Coordenação

| | |
|---|---|
| **Perfil** | Operador do gabinete, com acesso total ao sistema. Uma a três pessoas. |
| **Contexto** | Acumula comunicação, atendimento de demanda e articulação política. Conhece as 70 lideranças pelo nome e pela história. |
| **Dor principal** | Sabe que a rede tem 70 pessoas, mas não sabe quais estão trabalhando de verdade, e só descobre tarde demais. |
| **Nível técnico** | Médio. Usa WhatsApp, planilha, Instagram. Não vai aprender ferramenta complexa em plena campanha. |
| **Ganho esperado** | Abrir uma tela de manhã, ver quem parou, e resolver em cinco mensagens. |

### 2.2 Persona Secundária — A Liderança

| | |
|---|---|
| **Perfil** | 70 pessoas com influência local: comerciante, líder de igreja, agente de saúde, mototaxista, presidente de associação. |
| **Contexto** | Tem uma rede de relacionamento real no bairro. Trabalha, tem outra vida, e ajuda a campanha nas brechas. |
| **Dor principal** | Quer reconhecimento pelo que traz, e não quer aprender ferramenta nenhuma. |
| **Nível técnico** | Variado, do baixo ao médio. O denominador comum é WhatsApp no celular. |
| **Ganho esperado** | Que o esforço dela seja visível e creditado a ela, não diluído no "trabalho do grupo". |

> **Restrição de projeto que decorre desta persona:** qualquer funcionalidade que exija login, senha, aplicativo ou treinamento da liderança está fora do escopo. O contato dela com o sistema é uma URL e um formulário de quatro campos.

### 2.3 Persona Terciária — O Apoiador

| | |
|---|---|
| **Perfil** | Eleitor de São Pedro da Aldeia. O retrato mediano do município é mulher, 25 a 54 anos, ensino médio. |
| **Contexto** | Recebeu um link de alguém que conhece. Está em pé, no celular, com pouca paciência. |
| **Dor principal** | Nenhuma. Está fazendo um favor. Cada campo a mais é motivo para desistir. |
| **Ganho esperado** | Terminar rápido e sentir que participou de algo. |

### 2.4 Jobs to be Done

**Job 1 — Quando preciso saber se a rede está funcionando**
*Quando* eu abro o sistema de manhã, *eu quero* ver imediatamente quem parou de cadastrar, *para que* eu cobre hoje em vez de descobrir em outubro.

**Job 2 — Quando decido onde investir tempo e recurso**
*Quando* eu preciso escolher em qual bairro fazer reunião ou caminhada, *eu quero* ver penetração real contra o eleitorado de cada território, *para que* eu vá onde há espaço e não onde já estou forte.

**Job 3 — Quando recruto ou cobro uma liderança**
*Quando* eu falo com uma liderança, *eu quero* ter o número dela e o histórico na mão, *para que* a conversa seja concreta e não uma cobrança genérica.

**Job 4 — Quando uma pessoa da base me procura**
*Quando* alguém traz uma demanda, *eu quero* registrar e acompanhar até a resolução, *para que* o atendimento vire memória de relacionamento e não se perca.

**Job 5 — Quando presto contas aos candidatos**
*Quando* o federal ou o estadual pede números, *eu quero* mandar um relatório que prove a força da estrutura, *para que* eu negocie de posição forte sem entregar minha base.

**Job 6 (liderança) — Quando alguém topa apoiar**
*Quando* eu converso com alguém que topa, *eu quero* cadastrar na hora em 30 segundos, *para que* o nome não se perca e fique registrado como meu.

---

## 3. Requisitos Funcionais

Os requisitos estão organizados em épicos. Cada requisito tem critérios de aceitação: as condições que precisam ser verdade para considerá-lo pronto.

> **Convenção:** RF = Requisito Funcional. Críticos são marcados com **[P0]**, importantes com **[P1]**, desejáveis com **[P2]**.

### 3.1 Épico: Fundação e Base Territorial

#### RF-01 [P0] — Seed da Base Territorial
- **Descrição:** carga inicial dos bairros, locais de votação e macro-regiões de São Pedro da Aldeia.
- **Critérios:**
  - 31 bairros com nome, eleitorado e macro-região.
  - 40 locais de votação com nome, endereço, bairro, eleitorado, número de seções e macro-região.
  - 3 macro-regiões com totais de referência.
  - Validação obrigatória: a soma do eleitorado dos 31 bairros deve fechar em 75.083.
  - Validação obrigatória: a soma do eleitorado dos locais de cada bairro deve fechar com o total do bairro.
  - O sistema não sobe para produção com a validação falhando.

#### RF-02 [P0] — Autenticação da Coordenação
- **Descrição:** login apenas para operadores. Liderança e apoiador nunca autenticam.
- **Critérios:**
  - E-mail e senha via Supabase Auth.
  - Dois papéis: `coordenacao` (total) e `operador` (sem exportação e sem edição de meta).
  - Row Level Security ativa em todas as tabelas.
  - Sessão persistente.

### 3.2 Épico: Gestão de Lideranças

#### RF-03 [P0] — Cadastro de Liderança
- **Descrição:** a coordenação cadastra as lideranças manualmente, uma a uma. Não existe autocadastro de liderança.
- **Critérios:**
  - Campos: nome, WhatsApp, bairro de atuação, local de votação âncora, @ do Instagram, meta (padrão 10), linha pessoal, tags.
  - Telefone normalizado na gravação (somente dígitos, com 55 na frente).
  - Handle do Instagram normalizado (minúsculo, sem @, sem espaço).
  - Macro-região derivada automaticamente do local de votação âncora.
  - O local âncora é onde a liderança **atua**, que pode ser diferente de onde mora.
  - Validação de telefone duplicado contra toda a base.

#### RF-04 [P0] — Geração de Slug e Link Único
- **Descrição:** cada liderança recebe uma URL exclusiva de captação.
- **Critérios:**
  - Slug gerado a partir do nome, normalizado (sem acento, minúsculo, hífen).
  - Colisão resolvida com sufixo numérico.
  - Slug editável manualmente pela coordenação.
  - Slug imutável depois do primeiro cadastro recebido (o link já circulou).

#### RF-05 [P1] — Tags de Liderança
- **Descrição:** atributo declarado, marcado pela coordenação.
- **Critérios:**
  - Relação N para N. Uma liderança pode ter várias tags.
  - Tags iniciais sugeridas: igreja, comércio, mototáxi, saúde, educação, associação de moradores, esporte, família, servidor público.
  - Criação de tag nova pela interface.
  - Filtro cruzado com temperatura e território (exemplo: lideranças de igreja, frias, em R2).
  - **Tag não é temperatura e não é território.** Temperatura é calculada, território é derivado do local de votação.

#### RF-06 [P1] — Promoção de Apoiador a Liderança
- **Descrição:** qualquer pessoa da base pode ser elevada a liderança sem migração de registro.
- **Critérios:**
  - Alteração do campo `nivel` na mesma linha da tabela `pessoas`.
  - Geração de slug no ato da promoção.
  - Solicitação dos campos que faltam (local âncora, meta, @).
  - Histórico preservado: a pessoa continua atribuída a quem a trouxe.

#### RF-07 [P2] — Reatribuição Manual de Indicação
- **Descrição:** permite creditar internamente o terceiro nível da Rede 100x10 sem dar link individual.
- **Critérios:**
  - A coordenação pode alterar o `indicado_por` de um ou vários cadastros em lote.
  - O `indicado_por` pode apontar para qualquer pessoa da base, não só para liderança.
  - Registro de auditoria de toda reatribuição (quem mudou, quando, de quem para quem).

### 3.3 Épico: Captura Pública

#### RF-08 [P0] — Página Pública de Cadastro
- **Descrição:** uma página por liderança, em `/[slug]`, sem login.
- **Critérios:**
  - Exatamente quatro campos: nome completo, WhatsApp, bairro onde mora, onde vota.
  - Mobile-first. A tela precisa funcionar com uma mão, em pé, em 4G.
  - Nome da liderança visível na página ("indicado por Fulano").
  - Identidade visual da campanha.
  - **Fora do formulário, por decisão:** título de eleitor, CPF, seção eleitoral, data de nascimento, e-mail, endereço.

#### RF-09 [P0] — Select em Cascata de Local de Votação
- **Descrição:** o campo "onde vota" é filtrado pelo bairro escolhido.
- **Critérios:**
  - Ao escolher o bairro, a lista de locais vem filtrada e ordenada com o local daquele bairro em primeiro.
  - Bairros com mais de um local mostram todas as opções. Confirmados: São João, Campo Redondo, Centro, Balneário São Pedro, São José, Nova São Pedro, Baixo Grande, Porto do Carro.
  - Opção "voto em outro bairro" abre a lista completa.
  - Opção "outro município" no select de bairro, obrigatória, que dispensa o campo de local.
  - Objetivo de interação: um toque, nunca uma digitação.

#### RF-10 [P0] — Tratamento de Duplicidade
- **Descrição:** telefone é chave única global da base.
- **Critérios:**
  - Segundo cadastro do mesmo número não cria registro novo.
  - A tela devolve mensagem neutra: "esse contato já faz parte da rede".
  - A tela **nunca revela** a qual liderança a pessoa já está atribuída.
  - A tentativa é gravada em `conflitos_cadastro` para arbitragem privada da coordenação.
  - Primeiro cadastro prevalece.

#### RF-11 [P0] — Tela de Confirmação
- **Descrição:** o que acontece depois do envio decide o volume.
- **Critérios:**
  - Agradecimento com o nome da pessoa.
  - Botão **"cadastrar mais um"**, para a liderança que cadastra várias pessoas seguidas no próprio celular.
  - Botão **"compartilhar"** com o link da própria liderança e texto pronto para WhatsApp. É o mecanismo que faz a Fase 3 da Rede 100x10 (os +10) acontecer sem dar link individual a cada apoiador.

#### RF-12 [P1] — Preview de Link no WhatsApp
- **Descrição:** meta tags Open Graph configuradas na página pública.
- **Critérios:**
  - `og:title`, `og:description` e `og:image` definidos.
  - Imagem com a identidade da campanha, testada no WhatsApp antes do disparo.
  - Justificativa: link sem preview parece golpe e derruba a taxa de clique de forma perceptível.

### 3.4 Épico: Termômetro

#### RF-13 [P0] — Cálculo de Temperatura de Cadastro
- **Descrição:** estado calculado automaticamente, nunca marcado à mão.
- **Critérios:**
  - Seis estados: aguardando, afastado, frio, quente, muito quente, engajado.
  - Recalculado diariamente e a cada novo cadastro atribuído.
  - Regras completas na Seção 9.2.
  - O componente de recência é obrigatório: volume sem recência transforma o termômetro em placar histórico.

#### RF-14 [P1] — Histórico de Temperatura
- **Descrição:** registro semanal do estado de cada liderança.
- **Critérios:**
  - Snapshot gravado em `temperatura_historico`.
  - Visualização em linha do tempo no prontuário da liderança.
  - Permite ver quem está subindo e quem está caindo, não só onde está.

#### RF-15 [P1] — Selos de Volume
- **Descrição:** marcadores para quem passa de patamares.
- **Critérios:**
  - Selos em 10 (meta), 50 e 100 (alvo da Rede 100x10).
  - Selo visível na lista e no prontuário.
  - Dispara a fila de reconhecimento (RF-30).

#### RF-16 [P1] — Temperatura Digital
- **Descrição:** segundo eixo, independente da temperatura de cadastro.
- **Critérios:**
  - Três estados: ativo, irregular, ausente.
  - Calculado sobre presença em posts, na janela dos últimos 6 posts.
  - **Nunca combinado em um número único com a temperatura de cadastro.** Quem cadastra 20 e não comenta é um problema diferente de quem comenta em tudo e cadastra zero.

### 3.5 Épico: Dashboard de Coordenação

#### RF-17 [P0] — Faixa de Indicadores
- **Descrição:** quatro cartões no topo da tela inicial.
- **Critérios:**
  - Total de cadastrados.
  - Lideranças ativas sobre total.
  - Percentual da meta agregada (piso 700).
  - Cadastros nas últimas 24 horas.

#### RF-18 [P0] — Termômetro da Rede
- **Descrição:** distribuição das 70 lideranças pelos seis estados.
- **Critérios:**
  - Barra horizontal segmentada, com contagem por faixa.
  - Cada faixa é clicável e filtra a lista de lideranças.

#### RF-19 [P0] — Bloco de Cobrança
- **Descrição:** lista de quem não cadastrou ninguém. É o bloco mais valioso da tela.
- **Critérios:**
  - Lista nominal, ordenada por dias desde o envio do link.
  - Botão de WhatsApp por linha, que abre a conversa já com o template de cutucada.
  - Não é relatório, é fila de trabalho: a coordenação abre, dispara e fecha.

#### RF-20 [P1] — Ranking de Engajamento
- **Descrição:** quem está trabalhando agora.
- **Critérios:**
  - Ordenado por **novos cadastros na semana**, não por total acumulado.
  - Justificativa: total acumulado premia quem tem agenda grande e cristaliza o ranking em duas semanas. Novos na semana muda toda segunda e mantém a disputa viva.
  - Ranking completo visível apenas para a coordenação.

#### RF-21 [P1] — Penetração por Bairro
- **Descrição:** cadastros absolutos e percentuais lado a lado.
- **Critérios:**
  - Colunas: bairro, eleitores, cadastros, penetração %, lideranças atuando.
  - Ordenável por qualquer coluna.
  - Justificativa: volume absoluto mente. 50 cadastros em São João é 0,6%; em Três Vendas seria 37%.

#### RF-22 [P1] — Penetração por Local de Votação
- **Descrição:** mesma lógica no nível do colégio eleitoral, com detecção de anomalias.
- **Critérios:**
  - **Buraco:** local acima de 2.000 eleitores sem liderança atribuída, destacado.
  - **Sobreposição:** local com duas ou mais lideranças âncora, destacado.
  - Destaque dos 15 maiores locais (59,6% do eleitorado).

#### RF-23 [P1] — Cobertura por Macro-Região
- **Descrição:** realizado contra a proporção real do eleitorado.
- **Critérios:**
  - R1 Central 48,3% · R2 Leste 35,1% · R3 Balneários/Noroeste 16,6%.
  - Desvio destacado quando ultrapassa 10 pontos percentuais.

### 3.6 Épico: Prontuário

#### RF-24 [P1] — Ficha da Pessoa
- **Descrição:** mesma estrutura para liderança e apoiador. Apoiador tem ficha magra, liderança tem ficha cheia.
- **Critérios:**
  - Camada de identificação: dados do formulário e origem automática (qual link, data, hora).
  - Estado vazio limpo, com botão de "registrar contato" sempre visível.
  - Justificativa: ninguém preenche prontuário proativamente para milhares de pessoas. Ele se preenche por evento.

#### RF-25 [P1] — Interações
- **Descrição:** registro simples de contato.
- **Critérios:**
  - Campos: tipo (ligação, visita, conversa, mensagem), canal, descrição livre, autor, data.
  - Ordem cronológica reversa na linha do tempo.

#### RF-26 [P1] — Demandas
- **Descrição:** pedido de morador com ciclo de vida.
- **Critérios:**
  - Status: aberta, em andamento, resolvida, sem solução.
  - Campos: título, descrição, categoria, responsável, data de abertura, data de resolução.
  - Filtro global de demandas abertas, fora do prontuário.
  - **Regra dura:** não existe campo para registrar contrapartida oferecida ou entregue. Atendimento de demanda de morador é trabalho de mandato e é legítimo. Registro de troca não existe no schema, e isso vale também para o campo de descrição livre.

#### RF-27 [P1] — Bloco de Liderança no Prontuário
- **Descrição:** seção extra visível apenas para nível liderança.
- **Critérios:**
  - Árvore de indicados, com contagem e lista.
  - Meta e progresso.
  - Histórico de temperatura por semana.
  - Histórico de mensagens enviadas.
  - Histórico de engajamento no Instagram.

### 3.7 Épico: Motor de Mensagens

#### RF-28 [P0] — Motor de Templates
- **Descrição:** templates como registro no banco, nunca hardcoded.
- **Critérios:**
  - Variáveis: `{nome}`, `{link_cadastro}`, `{cadastrados}`, `{meta}`, `{faltam}`, `{linha_pessoal}`.
  - Quatro templates iniciais: boas-vindas, cutucada, reconhecimento, reativação.
  - CRUD de templates pela interface.
  - Justificativa: cada mensagem nova que exigir deploy vai virar copiar e colar no bloco de notas.

#### RF-29 [P0] — Envio via wa.me
- **Descrição:** abertura do WhatsApp com número e mensagem pré-preenchidos.
- **Critérios:**
  - URL no formato `https://wa.me/55<digitos>?text=<mensagem_urlencoded>`.
  - `encodeURIComponent` na mensagem inteira; quebra de linha como `%0A`.
  - Telefone lido do campo já normalizado.
  - Seletor de template no card da liderança.
  - **O envio é sempre um toque humano.** Nada dispara em segundo plano.

#### RF-30 [P0] — Registro de Envio
- **Descrição:** o clique grava a tentativa de envio.
- **Critérios:**
  - Grava pessoa, template, operador, data e hora.
  - Alimenta o contador de "lideranças que ainda não receberam o link".
  - **Alimenta o cálculo de temperatura:** dias de inatividade contam desde o envio, não desde o cadastro no admin.
  - Limitação conhecida: o clique registra a abertura do WhatsApp, não a confirmação de envio. Exige botão de "marcar como não enviado" para correção manual.

#### RF-31 [P1] — Linha Pessoal
- **Descrição:** frase personalizada inserida na mensagem de boas-vindas.
- **Critérios:**
  - Campo opcional por liderança, editável no admin.
  - Se vazio, o texto flui sem ele.
  - Coluna na lista indicando quem recebeu com linha personalizada e quem recebeu a versão padrão.
  - Justificativa: é a diferença entre a liderança sentir que foi escolhida e sentir que foi incluída numa lista.

#### RF-32 [P2] — Fila de Envio em Lote
- **Descrição:** despachar várias cobranças em sequência.
- **Critérios:**
  - Na lista filtrada por temperatura, botão que abre as conversas uma por vez.
  - Envio manual em cada uma, com avanço para a próxima.
  - Nenhum disparo automático em segundo plano.

### 3.8 Épico: Monitoramento de Instagram

#### RF-33 [P1] — Cadastro de Posts
- **Descrição:** registro dos posts oficiais que a rede deve engajar.
- **Critérios:**
  - Campos: URL, data de publicação, legenda, curtidas totais, comentários totais.
  - Cadastro manual pela coordenação.

#### RF-34 [P1] — Importação de Engajamento
- **Descrição:** ingestão desacoplada. O sistema recebe dados, não conversa com o Instagram.
- **Critérios:**
  - Entrada padronizada: lista de handles + post + tipo de ação.
  - Formatos aceitos: colagem de texto e upload de CSV.
  - Tipos: comentário, curtida, menção em story.
  - Guarda o **handle cru** vindo da importação, sem transformação.
  - Marca a origem (`api` ou `importacao_manual`).

#### RF-35 [P1] — Casamento por Handle
- **Descrição:** vínculo entre handle importado e pessoa da base.
- **Critérios:**
  - Comparação por handle normalizado.
  - O vínculo (`pessoa_id`) fica em campo separado do handle cru, e **nunca sobrescreve** o handle cru.
  - Se a liderança trocar de @ no meio da campanha, o vínculo é corrigido sem perda de histórico.
  - Correção manual de vínculo pela interface.

#### RF-36 [P1] — Roster Congelado
- **Descrição:** cada post guarda quem era liderança na data da publicação.
- **Critérios:**
  - Snapshot de lideranças ativas gravado no cadastro do post.
  - Liderança cadastrada depois não aparece como ausente em posts anteriores.

#### RF-37 [P1] — Relatório de Ausência Acumulada
- **Descrição:** a tela útil lista quem faltou, não quem esteve presente.
- **Critérios:**
  - Janela dos últimos 6 posts.
  - Alerta quando a liderança falta em 5 dos últimos 6.
  - Lista nominal com botão de WhatsApp.
  - **Sempre acumulado, nunca post a post.** Faltar em um post não significa nada; faltar em cinco é diagnóstico.

#### RF-38 [P2] — Fila de Recrutamento
- **Descrição:** handles que engajaram e não casaram com ninguém da base.
- **Critérios:**
  - Lista ordenada por frequência de engajamento.
  - Ação de "vincular a pessoa existente" ou "marcar para convidar".
  - Justificativa: quem comenta em post político por vontade própria é liderança em potencial.

### 3.9 Épico: Exportação

#### RF-39 [P1] — Perfis de Exportação
- **Descrição:** conteúdo do relatório varia por destinatário, como configuração e não como código.
- **Critérios:**
  - **Interno:** tudo, nominal, com contato.
  - **Candidato:** agregados territoriais, curva semanal, lideranças nominais **sem telefone**, nenhum apoiador nominal.
  - **Público:** apenas números-síntese, sem nomes.
  - **Regra travada no código:** o perfil candidato nunca inclui telefone de apoiador, mesmo por solicitação.
  - Justificativa: a base é o ativo de negociação da estrutura. Entregue o contato, o candidato fala direto e a estrutura local vira intermediário dispensável.

#### RF-40 [P1] — Snapshot Datado
- **Descrição:** todo export carrega a data de extração.
- **Critérios:**
  - Carimbo de data e hora no cabeçalho do documento.
  - Registro na tabela `exportacoes`.
  - Justificativa: número muda todo dia, e comparação sem data de corte faz a estrutura parecer desorganizada.

#### RF-41 [P2] — Link com Token Revogável
- **Descrição:** visão de leitura para o candidato, em vez de arquivo.
- **Critérios:**
  - Token não adivinhável na URL, sem login.
  - Conteúdo limitado ao perfil candidato.
  - Revogação a qualquer momento.
  - Justificativa: arquivo circula, link se revoga, e o dado nunca sai do servidor.

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance

- **RNF-01:** a página pública carrega em menos de 2 segundos em 4G (LCP).
- **RNF-02:** o formulário público envia e confirma em menos de 1,5 segundo.
- **RNF-03:** o dashboard carrega em menos de 3 segundos com a base cheia.
- **RNF-04:** o recálculo de temperatura de 70 lideranças roda em menos de 5 segundos.
- **RNF-05:** peso total da página pública abaixo de 300 KB.

### 4.2 Escalabilidade

- **RNF-06:** suporte a 100.000 pessoas na tabela `pessoas` sem degradação das consultas de agregação.
- **RNF-07:** suporte a picos de cadastro simultâneo em dia de evento ou caminhada.
- **RNF-08:** índices obrigatórios em `telefone`, `indicado_por`, `local_votacao_id`, `criado_em` e `slug`.

### 4.3 Disponibilidade

- **RNF-09:** a página pública é o componente crítico. Indisponibilidade dela é perda direta de cadastro.
- **RNF-10:** o admin pode ficar fora por minutos sem prejuízo operacional.
- **RNF-11:** monitoramento com alerta de queda da rota pública.

### 4.4 Segurança

- **RNF-12:** HTTPS obrigatório em todos os endpoints.
- **RNF-13:** Row Level Security ativa em todas as tabelas.
- **RNF-14:** liderança e apoiador nunca autenticam; não existe superfície de login pública além do admin.
- **RNF-15:** a página pública é write-only. Nenhuma rota pública lê ou lista dados da base.
- **RNF-16:** tokens de exportação não adivinháveis, com revogação.
- **RNF-17:** rate limiting no endpoint de cadastro público, para evitar flood.
- **RNF-18:** auditoria de reatribuição de indicação e de exportação.

### 4.5 Usabilidade

- **RNF-19:** interface e formulário em português brasileiro, sem jargão.
- **RNF-20:** a página pública é mobile-first. Desktop é secundário.
- **RNF-21:** o formulário público é operável com uma mão, em pé.
- **RNF-22:** linguagem calibrada para o eleitorado real: 48,3% com ensino médio, 31% com fundamental.
- **RNF-23:** alvos de toque com no mínimo 44 pixels.
- **RNF-24:** nenhum campo do formulário público exige digitação além de nome e telefone.

### 4.6 Compliance

- **RNF-25 [PENDENTE]:** consentimento específico e destacado para dado de opinião política. Ver Seção 10.3.
- **RNF-26 [PENDENTE]:** política de retenção definida antes de novembro. Ver Seção 10.3.
- **RNF-27 [PENDENTE]:** canal de exclusão a pedido do titular.
- **RNF-28:** nenhum registro de contrapartida em nenhuma tabela ou campo livre. **Vigente desde o MVP.**
- **RNF-29:** a base nasce inteiramente de cadastro consentido. Nenhuma importação de lista comprada ou de cadastro público.

### 4.7 Observabilidade

- **RNF-30:** log de todo cadastro público com origem, timestamp e resultado.
- **RNF-31:** métrica de funil da página pública: aberturas, inícios de preenchimento, conclusões, duplicatas.
- **RNF-32:** log estruturado de envio de mensagem e de importação de engajamento.
- **RNF-33:** alerta quando a taxa de conclusão do formulário cai abaixo de 70%.

---

## 5. Especificações Técnicas

> **Decisão de stack:** Next.js + Supabase + Vercel, TypeScript como linguagem única. Sem camada de IA no MVP (ver Seção 9.6).

### 5.1 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js (App Router) | Server Components para a página pública, que precisa ser leve e rápida. |
| Linguagem | TypeScript | Type safety no modelo de dados territorial, que é o coração do sistema. |
| Estilização | Tailwind CSS + Shadcn/ui | Produtividade e componentes acessíveis. |
| Banco de Dados | Supabase (PostgreSQL) | Agregações territoriais e RLS no banco. |
| Autenticação | Supabase Auth | Apenas coordenação. Liderança e apoiador não autenticam. |
| Gráficos | Recharts | Barras de penetração e curva semanal. |
| Mensageria | `wa.me` (link direto) | Sem API, sem custo, sem risco regulatório. |
| Hospedagem | Vercel | Deploy automático, CDN global, rota pública rápida. |
| Monitoramento | Sentry + Vercel Analytics | Erros e funil da página pública. |

**Por que Supabase e não WordPress.** Row Level Security. A coordenação tem múltiplos operadores com escopos diferentes, e política escrita no banco é impossível de furar pelo frontend. Postgres também entrega as agregações territoriais e as consultas de árvore sem malabarismo.

### 5.2 Arquitetura de Alto Nível

**Camada 1 — Captura pública (crítica)**
Rota `/[slug]` servida como Server Component, com peso mínimo e cache agressivo do seed territorial. Write-only: aceita `POST` de cadastro e não expõe nenhuma leitura da base. É o único componente cuja indisponibilidade custa dado.

**Camada 2 — Admin autenticado**
Dashboard, prontuário, gestão de lideranças, motor de mensagens e importação. Protegido por Supabase Auth com RLS. Toda a complexidade mora aqui, e nada aqui é crítico em tempo real.

**Camada 3 — Dados e cálculo**
PostgreSQL como fonte única. Temperatura e agregações territoriais calculadas no banco (views materializadas e funções), não no frontend. O seed territorial é imutável em produção.

### 5.3 Diagrama de Fluxo Principal

```
[Coordenação]
    │
    │ 1. Cadastra liderança + meta + linha pessoal
    ▼
[Admin] ──► [pessoas: nivel=lideranca, slug gerado]
    │
    │ 2. Clica em enviar
    ▼
[wa.me?text=...] ──► [WhatsApp da coordenação] ──► envio manual
    │                                                    │
    │ 3. Grava envio                                     │
    ▼                                                    ▼
[envios]                                          [Liderança]
                                                         │
                                                         │ 4. Compartilha o link
                                                         ▼
                                                   [Apoiador]
                                                         │
                                                         │ 5. Abre /[slug]
                                                         ▼
                                            [Página pública: 4 campos]
                                                         │
                                     ┌───────────────────┤
                                     │                   │
                          telefone duplicado?      cadastro novo
                                     │                   │
                                     ▼                   ▼
                          [conflitos_cadastro]      [pessoas:
                          mensagem neutra            indicado_por,
                                                     local_votacao_id]
                                                         │
                                                         │ 6. Dispara recálculo
                                                         ▼
                                            [temperatura + agregações]
                                                         │
                                                         ▼
                                                   [Dashboard]
                                                         │
                                     ┌───────────────────┼───────────────────┐
                                     ▼                   ▼                   ▼
                            [Bloco de cobrança]  [Penetração]      [Ranking semanal]
                                     │
                                     │ 7. Fecha o ciclo
                                     ▼
                            [wa.me: cutucada]
```

**Fluxo paralelo (Instagram):**

```
[Extrator externo]  ──►  [CSV / colagem]  ──►  [Importação no admin]
   (fora deste escopo)                                │
                                                      ▼
                                          [engajamentos: handle_cru]
                                                      │
                                                      │ casamento por handle
                                          ┌───────────┴───────────┐
                                          ▼                       ▼
                                   [pessoa_id vinculado]   [não casado]
                                          │                       │
                                          ▼                       ▼
                              [Ausência acumulada]      [Fila de recrutamento]
```

### 5.4 Estrutura de Pastas do Projeto

```
projeto-rede/
├── app/
│   ├── [slug]/                    # Página pública de cadastro (CRÍTICA)
│   │   ├── page.tsx
│   │   └── obrigado/page.tsx      # Confirmação + compartilhar + mais um
│   ├── (admin)/                   # Área autenticada
│   │   ├── painel/                # Dashboard
│   │   ├── liderancas/
│   │   │   ├── page.tsx           # Lista + filtros
│   │   │   ├── nova/
│   │   │   └── [id]/              # Prontuário
│   │   ├── pessoas/               # Base completa + busca
│   │   ├── demandas/              # Fila global de demandas abertas
│   │   ├── instagram/
│   │   │   ├── posts/
│   │   │   ├── importar/
│   │   │   └── ausencias/
│   │   ├── mensagens/             # Templates
│   │   ├── conflitos/             # Duplicidades para arbitragem
│   │   └── exportar/
│   ├── r/[token]/                 # Visão de leitura para candidato
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/                        # Shadcn base
│   ├── publico/                   # Componentes da página pública
│   ├── termometro/
│   └── charts/
├── lib/
│   ├── supabase/
│   ├── territorio/                # Seed, lookup bairro→local, penetração
│   ├── temperatura/               # Motor de cálculo
│   ├── whatsapp/                  # Montagem de wa.me e templates
│   └── instagram/                 # Normalização e casamento de handle
├── supabase/
│   ├── migrations/
│   └── seed/
│       ├── bairros.sql
│       ├── locais_votacao.sql
│       └── validacao.sql          # Checagem de integridade do seed
├── types/
└── CLAUDE.md
```

---

## 6. Modelo de Dados

PostgreSQL no Supabase. Row Level Security em todas as tabelas. A página pública escreve através de uma policy específica de `INSERT`, sem nenhuma permissão de leitura.

### 6.1 Tabelas Principais

**pessoas** (tabela única e autorreferente)

```
id                  UUID
nome                TEXT
telefone            TEXT UNIQUE  -- normalizado: somente dígitos, com 55
nivel               TEXT   -- 'coordenacao', 'lideranca', 'apoiador'
indicado_por        UUID (FK -> pessoas)
bairro_moradia_id   UUID (FK -> bairros)
local_votacao_id    UUID (FK -> locais_votacao)
fora_do_municipio   BOOLEAN
instagram_handle    TEXT   -- normalizado: minúsculo, sem @
slug                TEXT UNIQUE  -- apenas nivel='lideranca'
meta                INT DEFAULT 10
linha_pessoal       TEXT
secao               TEXT   -- NULL no MVP, enriquecimento posterior
origem              TEXT   -- 'link', 'admin'
ativo               BOOLEAN
criado_em           TIMESTAMPTZ
```

> **Decisão de arquitetura:** tabela única, autorreferente. Pessoas mudam de nível, e promover apoiador a liderança não pode exigir migração de registro entre tabelas. O `indicado_por` aponta para `pessoas`, não para uma tabela `liderancas`, o que também viabiliza a reatribuição manual do terceiro nível (RF-07) sem mudança de schema.

**bairros**
```
id          UUID
nome        TEXT
eleitores   INT
regiao      TEXT   -- 'R1', 'R2', 'R3'
```

**locais_votacao**
```
id          UUID
nome        TEXT
endereco    TEXT
bairro_id   UUID (FK -> bairros)
eleitores   INT
secoes      INT
regiao      TEXT
```

**tags** e **pessoa_tags**
```
tags:        id UUID · nome TEXT · cor TEXT
pessoa_tags: pessoa_id UUID · tag_id UUID
```

**interacoes**
```
id          UUID
pessoa_id   UUID (FK -> pessoas)
tipo        TEXT   -- 'ligacao', 'visita', 'conversa', 'mensagem'
canal       TEXT
descricao   TEXT
autor       UUID
criado_em   TIMESTAMPTZ
```

**demandas**
```
id            UUID
pessoa_id     UUID (FK -> pessoas)
titulo        TEXT
descricao     TEXT
categoria     TEXT
status        TEXT   -- 'aberta', 'em_andamento', 'resolvida', 'sem_solucao'
responsavel   UUID
aberta_em     TIMESTAMPTZ
resolvida_em  TIMESTAMPTZ
```

**templates_mensagem**
```
id       UUID
nome     TEXT
corpo    TEXT   -- com {nome}, {link_cadastro}, {cadastrados}, {meta}, {faltam}, {linha_pessoal}
ativo    BOOLEAN
```

**envios**
```
id            UUID
pessoa_id     UUID (FK -> pessoas)
template_id   UUID (FK -> templates_mensagem)
operador      UUID
enviado_em    TIMESTAMPTZ
confirmado    BOOLEAN DEFAULT true   -- permite marcar como não enviado
```

**conflitos_cadastro**
```
id                    UUID
telefone              TEXT
nome_tentado          TEXT
lideranca_tentou_id   UUID (FK -> pessoas)
pessoa_existente_id   UUID (FK -> pessoas)
resolvido             BOOLEAN
criado_em             TIMESTAMPTZ
```

**posts**
```
id                 UUID
url                TEXT
publicado_em       TIMESTAMPTZ
legenda            TEXT
curtidas_total     INT
comentarios_total  INT
```

**post_roster** (congelado na data do post)
```
post_id     UUID (FK -> posts)
pessoa_id   UUID (FK -> pessoas)
```

**engajamentos**
```
id             UUID
post_id        UUID (FK -> posts)
handle_cru     TEXT   -- exatamente como veio da importação, NUNCA sobrescrito
pessoa_id      UUID (FK -> pessoas, nullable)
tipo           TEXT   -- 'curtida', 'comentario', 'story_mention'
texto          TEXT
origem         TEXT   -- 'api', 'importacao_manual'
capturado_em   TIMESTAMPTZ
```

**temperatura_historico**
```
id             UUID
pessoa_id      UUID (FK -> pessoas)
estado         TEXT
cadastros      INT
calculado_em   TIMESTAMPTZ
```

**exportacoes**
```
id           UUID
perfil       TEXT   -- 'interno', 'candidato', 'publico'
operador     UUID
token        TEXT
revogado     BOOLEAN
gerado_em    TIMESTAMPTZ
```

### 6.2 Políticas de Row Level Security

```sql
-- A página pública insere, mas nunca lê.
CREATE POLICY "cadastro_publico_insert" ON pessoas
FOR INSERT TO anon
WITH CHECK (nivel = 'apoiador' AND origem = 'link');

-- Nenhuma policy de SELECT para anon em pessoas. A rota pública é write-only.

-- Operadores autenticados leem tudo.
CREATE POLICY "admin_leitura" ON pessoas
FOR SELECT TO authenticated
USING (true);

-- Apenas coordenação exporta.
CREATE POLICY "exportacao_coordenacao" ON exportacoes
FOR ALL TO authenticated
USING (
  (SELECT papel FROM operadores WHERE id = auth.uid()) = 'coordenacao'
);

-- O seed territorial é somente leitura em produção.
CREATE POLICY "territorio_readonly" ON locais_votacao
FOR SELECT TO authenticated, anon
USING (true);
```

### 6.3 Base Territorial de Referência

A base territorial é a espinha dorsal do sistema, equivalente ao plano de contas em um sistema financeiro. Sem ela, o dashboard mostra volume, e volume mente.

**Fonte:** TSE, Estatísticas do Eleitorado, extração de 03/08/2026, 59ª Zona Eleitoral.
**Totais:** 75.083 eleitores aptos · 252 seções · 40 locais de votação · 31 bairros.

#### Macro-regiões

| Região | Nome | Eleitores | % | Locais |
|---|---|---|---|---|
| R1 | Central (Sede) | 36.252 | 48,3% | 18 |
| R2 | Leste | 26.357 | 35,1% | 14 |
| R3 | Balneários/Noroeste | 12.474 | 16,6% | 8 |

#### Bairros (31, completo)

| Bairro | Eleitores | Região |
|---|---|---|
| São João | 8.384 | R2 |
| Centro | 5.761 | R1 |
| Campo Redondo | 5.314 | R2 |
| Balneário São Pedro | 4.659 | R3 |
| São José | 4.134 | R1 |
| Nova São Pedro | 4.028 | R1 |
| Fluminense | 3.747 | R1 |
| Estação | 3.571 | R1 |
| Baixo Grande | 3.395 | R2 |
| Porto da Aldeia | 3.365 | R1 |
| Jardim Soledade | 2.692 | R1 |
| Rua do Fogo | 2.654 | R3 |
| Porto do Carro | 2.614 | R2 |
| Vinhateiro | 2.300 | R2 |
| Praia Linda | 2.217 | R3 |
| Poço Fundo | 2.117 | R1 |
| Alecrim | 1.795 | R2 |
| Balneário das Conchas | 1.787 | R3 |
| Ponta do Ambrósio | 1.644 | R2 |
| Boqueirão | 1.477 | R1 |
| Recanto do Sol | 1.460 | R1 |
| Mossoró | 1.447 | R1 |
| Cruz | 966 | R3 |
| São Mateus | 880 | R1 |
| Botafogo | 703 | R1 |
| Retiro | 635 | R2 |
| Baleia | 588 | R1 |
| Morro do Milagre | 282 | R1 |
| Parque Arruda | 276 | R2 |
| Três Vendas | 136 | R3 |
| Sapeatiba Mirim | 55 | R3 |
| **TOTAL** | **75.083** | |

**Validação executada:** a soma dos 31 bairros fecha exatamente em 75.083. A tabela de bairros está completa e íntegra.

#### Locais de votação (33 confirmados de 40)

| # | Local | Bairro | Eleitores | Seções | Região |
|---|---|---|---|---|---|
| 1 | CIEP 272 Gabriel Joaquim dos Santos | São João | 4.047 | 12 | R2 |
| 2 | C.E. Dr. Feliciano Sodré | Centro | 3.928 | 17 | R1 |
| 3 | E.M. Prof.ª Miriam Alves de Macedo Guimarães | Fluminense | 3.747 | 11 | R1 |
| 4 | CIEP 146 Cordelino Teixeira Paulo | Estação | 3.571 | 18 | R1 |
| 5 | E. Municipalizada José Guimarães | Porto da Aldeia | 3.365 | 10 | R1 |
| 6 | FAETEC | Nova São Pedro | 3.299 | 10 | R1 |
| 7 | E. Municipalizada Paineira | Balneário São Pedro | 2.875 | 9 | R3 |
| 8 | E.M. Manoel Moraes da Silva | Campo Redondo | 2.802 | 9 | R2 |
| 9 | E.M. Rubem Arruda Câmara | Jardim Soledade | 2.692 | 8 | R1 |
| 10 | E. Municipalizada Pequiá | Rua do Fogo | 2.654 | 8 | R3 |
| 11 | C.E. José Rascão | São José | 2.527 | 7 | R1 |
| 12 | E.M. Luiza Terra de Andrade | Campo Redondo | 2.512 | 7 | R2 |
| 13 | E.M. Vinhateiro | Vinhateiro | 2.300 | 7 | R2 |
| 14 | E.M. Prof.ª Dulcinda Jotta Mendes | São João | 2.229 | 7 | R2 |
| 15 | E.M. Prof.ª Maria da Glória dos Santos Motta | Praia Linda | 2.217 | 7 | R3 |
| 16 | E.M. Flonete Alexandrino da Silva | Poço Fundo | 2.117 | | R1 |
| 17 | C.E. Almirante Tamandaré | Baixo Grande | 1.847 | | R2 |
| 18 | E.M. Vidal de Negreiros | Alecrim | 1.795 | | R2 |
| 19 | E.M. José Teixeira Paulo | Balneário das Conchas | 1.787 | | R3 |
| 20 | E.M. Antonio Rodrigues dos Santos | Porto do Carro | 1.659 | | R2 |
| 21 | E.M. Vital Brasil | Ponta do Ambrósio | 1.644 | | R2 |
| 22 | E.M. Francisco Paes de Carvalho Filho | Boqueirão | 1.477 | | R1 |
| 23 | E.M. Antônio Vaz da Silva | Recanto do Sol | 1.460 | | R1 |
| 24 | Casa de Apoio Sementes do Amanhã | Mossoró | 1.447 | | R1 |
| 25 | E.M. Capitão Costa | Cruz | 966 | | R3 |
| 26 | E. Municipalizada Paulo Roberto Marinho | São Mateus | 880 | | R1 |
| 27 | E.M. Quilombola Dona Rosa Geralda da Silveira | Botafogo | 703 | | R1 |
| 28 | E. Municipalizada Retiro | Retiro | 635 | | R2 |
| 29 | E.M. Elízio Ignácio Rangel | Baleia | 588 | | R1 |
| 30 | E. Municipalizada Adalgisa da Silva Lobo | Morro do Milagre | 282 | | R1 |
| 31 | E.M. São Francisco de Assis | Parque Arruda | 276 | | R2 |
| 32 | E. Municipalizada Elízio da Costa Moreira | Três Vendas | 136 | | R3 |
| 33 | E.M. Sapeatiba Mirim | Sapeatiba Mirim | 55 | | R3 |
| | **Subtotal confirmado** | | **64.519** | | |

#### Os 7 locais faltantes (checklist fechado)

A diferença entre o total do município (75.083) e os locais confirmados (64.519) é de **10.564 eleitores, 14,1% do eleitorado**. Cruzando o eleitorado de cada bairro contra os locais já conhecidos, a lacuna se distribui em exatamente 7 bairros, o mesmo número de locais que falta. Isso identifica com precisão onde cada local faltante está e quanto ele pesa:

| Bairro | Eleitores do local faltante | Região | Indício |
|---|---|---|---|
| São João | 2.108 | R2 | Provável E.M. Dulce Jotta (citada no relatório, 55,8% feminino) |
| Centro | 1.833 | R1 | Possível Horto-Escola ou Polo Cederj |
| Balneário São Pedro | 1.784 | R3 | A levantar |
| São José | 1.607 | R1 | A levantar |
| Baixo Grande | 1.548 | R2 | A levantar |
| Porto do Carro | 955 | R2 | A levantar |
| Nova São Pedro | 729 | R1 | Possível Polo Cederj (35,1% com superior) |
| **TOTAL** | **10.564** | | |

> **Impacto se não for completado:** o cálculo de penetração desses 7 bairros fica errado por excesso, porque o denominador do local existe mas os cadastros dele não têm onde cair. São João e Centro são o primeiro e o segundo maiores colégios da cidade, então o erro cairia justamente onde a decisão importa mais. **O seed precisa ser fechado antes do Bloco 3.**

#### Script de validação obrigatório

```sql
-- 1. Soma dos bairros deve fechar com o município
SELECT SUM(eleitores) = 75083 AS bairros_ok FROM bairros;

-- 2. Soma dos locais deve fechar com o município
SELECT SUM(eleitores) = 75083 AS locais_ok FROM locais_votacao;

-- 3. Soma dos locais de cada bairro deve fechar com o bairro
SELECT b.nome, b.eleitores, COALESCE(SUM(l.eleitores),0) AS soma_locais
FROM bairros b LEFT JOIN locais_votacao l ON l.bairro_id = b.id
GROUP BY b.id, b.nome, b.eleitores
HAVING b.eleitores <> COALESCE(SUM(l.eleitores),0);
-- Deve retornar zero linhas.

-- 4. Soma das seções deve fechar com o total da zona
SELECT SUM(secoes) = 252 AS secoes_ok FROM locais_votacao;
```

---

## 7. Fluxos Detalhados

### 7.1 Fluxo: Ativação de Liderança (Happy Path)

**Etapa 1 — Cadastro**
1. Coordenação acessa `/liderancas/nova`.
2. Preenche nome, WhatsApp, bairro de atuação, local âncora, @ do Instagram.
3. Define a meta (padrão 10, editável).
4. Escreve a linha pessoal.
5. Marca as tags.
6. Sistema normaliza telefone e handle, gera o slug, deriva a macro-região.

**Etapa 2 — Envio do link**
7. No card da liderança, coordenação seleciona o template "boas-vindas".
8. Sistema monta a mensagem com `{nome}`, `{linha_pessoal}` e `{link_cadastro}`.
9. Coordenação clica em enviar. O WhatsApp abre com número e texto prontos.
10. Coordenação revisa e envia manualmente.
11. Sistema grava em `envios`. A liderança entra no estado **aguardando**.

**Etapa 3 — Operação**
12. Liderança compartilha o link ou cadastra pessoas no próprio celular.
13. Cada cadastro cai atribuído a ela.

**Etapa 4 — Medição**
14. Sistema recalcula a temperatura a cada cadastro.
15. Dashboard atualiza contagem, penetração e ranking semanal.

**Etapa 5 — Cobrança ou reconhecimento**
16. Passados 5 dias do envio sem nenhum cadastro, ela sai de **aguardando** e entra em **afastado**, aparecendo no bloco de cobrança.
17. Batida a meta de 10, ela entra em **muito quente** e aparece na fila de reconhecimento.
18. Coordenação dispara o template correspondente, com `{cadastrados}` preenchido.

### 7.2 Fluxo: Cadastro de Apoiador

1. Apoiador recebe o link no WhatsApp e vê o preview com a identidade da campanha.
2. Abre `/[slug]`. A página mostra "indicado por [nome da liderança]".
3. Preenche nome e WhatsApp.
4. Seleciona o bairro onde mora.
5. O select de local de votação já vem filtrado, com o local do bairro dele em primeiro. Um toque.
6. Envia.
7. Sistema normaliza o telefone e verifica duplicidade.
8. Grava com `indicado_por`, `local_votacao_id` e `origem = 'link'`.
9. Tela de confirmação com o nome dele, botão de compartilhar o link da liderança e botão de cadastrar mais um.

### 7.3 Fluxo: Duplicidade

**Cenário:** a liderança B tenta cadastrar alguém que a liderança A já cadastrou.

1. Sistema detecta o telefone existente.
2. **Não** cria registro novo. **Não** altera a atribuição existente.
3. Tela devolve: "Esse contato já faz parte da rede. Obrigado!"
4. A tela **não revela** de quem é a pessoa.
5. Grava em `conflitos_cadastro` com quem tentou e quem já tinha.
6. A coordenação vê a fila de conflitos no admin e arbitra em privado quando o caso for relevante.

> **Justificativa:** duas lideranças descobrindo que disputam o mesmo contato geram um atrito que chega na coordenação no pior momento possível. A arbitragem tem que ser silenciosa e assíncrona.

### 7.4 Fluxo: Apoiador de Outro Município

1. No select de bairro, o apoiador escolhe "outro município".
2. O campo de local de votação desaparece.
3. Sistema grava com `fora_do_municipio = true` e `local_votacao_id = NULL`.
4. A pessoa entra na contagem total e no crédito da liderança.
5. A pessoa **não entra** nos cálculos de penetração territorial.

> **Justificativa:** os candidatos são federal e estadual, votados no estado inteiro. Contato em Cabo Frio ou Araruama vale o mesmo voto. Formulário que só aceita bairro de São Pedro joga fora contato bom.

### 7.5 Fluxo: Importação de Engajamento do Instagram

1. Coordenação cadastra o post em `/instagram/posts` com URL, data e totais.
2. Sistema congela o roster: grava quem era liderança naquela data.
3. Coordenação roda o extrator externo (fora deste escopo) e obtém a lista de handles.
4. Em `/instagram/importar`, cola a lista ou sobe o CSV, escolhendo o post e o tipo de ação.
5. Sistema normaliza cada handle e grava em `engajamentos`, preservando o handle cru.
6. Sistema tenta casar cada handle com o `instagram_handle` de alguém da base.
7. Casados: vínculo criado, presença registrada.
8. Não casados: entram na fila de recrutamento.
9. Sistema recalcula a temperatura digital na janela dos últimos 6 posts.
10. A tela de ausências lista quem faltou em 5 dos últimos 6, com botão de WhatsApp.

### 7.6 Fluxo: Liderança Trocou de @

1. Coordenação percebe o handle antigo na fila de não casados ou é avisada.
2. Atualiza o `instagram_handle` no cadastro da liderança.
3. Na fila de não casados, vincula manualmente o handle antigo à mesma pessoa.
4. O `handle_cru` de todos os registros históricos **permanece intocado**.
5. O histórico de engajamento continua completo e atribuído à pessoa certa.

### 7.7 Fluxo: Exportação para Candidato

1. Coordenação acessa `/exportar`.
2. Seleciona o perfil "candidato".
3. Sistema monta agregados: total, distribuição por macro-região contra o eleitorado, penetração por local, curva semanal, lideranças ativas, cobertura dos colégios âncora.
4. Lideranças aparecem nominalmente, **sem telefone**.
5. Nenhum apoiador aparece nominalmente.
6. Sistema carimba a data e hora de extração.
7. Gera link com token, registrado em `exportacoes`.
8. O token pode ser revogado a qualquer momento.

---

## 8. Design e Interface

O sistema tem duas superfícies com propósitos opostos. A página pública é **campanha**: emocional, leve, com a cara do grupo. O admin é **ferramenta**: denso, informativo, otimizado para decisão rápida. Não devem parecer o mesmo produto.

### 8.1 Identidade Visual

| Elemento | Especificação |
|---|---|
| Cor primária (pública) | **A definir** com a identidade da campanha. Placeholder até a definição. |
| Cor primária (admin) | Neutra, escura, sem conotação partidária |
| Fonte | Inter (corpo e números). Alta legibilidade em tela pequena e leitura de tabela densa. |
| Números do dashboard | Variante tabular, para alinhamento em coluna |
| Arredondamento | `rounded-lg` padrão, `rounded-xl` em cards |
| Espaçamento | Escala de 4px. Densidade alta no admin, generosa na pública. |

**Cores semânticas do termômetro:**

| Estado | Cor | Significado |
|---|---|---|
| Aguardando | Cinza neutro | Sem informação ainda |
| Afastado | **Vermelho** | Precisa da sua ação agora |
| Frio | Azul | Abaixo do esperado |
| Quente | Âmbar | No caminho |
| Muito quente | Laranja | Meta batida |
| Engajado | Verde | Referência da rede |

> **Decisão de design:** a cor comunica **urgência de ação**, não temperatura literal. Por isso "afastado" é vermelho, embora seja o estado mais frio de todos. Em um dashboard operacional, vermelho significa "abra e resolva", e é exatamente isso que o estado exige. A metáfora térmica fica no rótulo e no ícone.

### 8.2 Princípios de UX

**Da página pública:**

- **Um objetivo por tela.** A página tem uma tarefa: preencher quatro campos. Nada compete com ela.
- **Toque, não digitação.** Bairro e local são select. Só nome e telefone exigem teclado.
- **Pertencimento imediato.** O nome da liderança aparece na tela. A pessoa não está preenchendo formulário, está declarando apoio a alguém que conhece.
- **Linguagem do eleitorado real.** 48,3% do município tem ensino médio e 31% tem fundamental. Frase curta, palavra comum, zero jargão.

**Do admin:**

- **Ação antes de relatório.** O que precisa de ação fica no topo. Números de contexto ficam abaixo.
- **Nenhuma lista sem próxima ação.** Toda linha de liderança tem um botão que faz alguma coisa.
- **Denominador sempre visível.** Nenhum número absoluto aparece sozinho quando existe um percentual que o qualifica.
- **Filtro é navegação.** Clicar numa faixa do termômetro ou numa linha de bairro filtra a lista. A exploração é por clique, não por formulário de busca.

### 8.3 Telas Principais

**Página pública (`/[slug]`)**
- Topo com a identidade da campanha e uma frase curta.
- "Indicado por [Nome]" em destaque.
- Quatro campos, empilhados, com alvo de toque generoso.
- Botão único, largo, fixo na base em telas pequenas.

**Confirmação (`/[slug]/obrigado`)**
- Agradecimento com o nome da pessoa.
- Botão primário: compartilhar o link da liderança.
- Botão secundário: cadastrar mais um.

**Dashboard (`/painel`)**
- Faixa de quatro indicadores.
- Termômetro da rede em barra segmentada e clicável.
- **Bloco de cobrança**, nominal, com botão de WhatsApp por linha.
- Ranking semanal (top 10 por novos na semana).
- Tabela de bairros com penetração.
- Barra de cobertura por macro-região.

**Lista de lideranças (`/liderancas`)**
- Filtros combinados: temperatura, temperatura digital, tag, bairro, macro-região.
- Colunas: nome, bairro, cadastros, meta, temperatura, digital, último cadastro.
- Ações por linha: WhatsApp, abrir prontuário.
- Ação em lote: fila de envio.

**Prontuário (`/liderancas/[id]`)**
- Cabeçalho com identificação e estado atual.
- Progresso contra a meta.
- Linha do tempo de interações e demandas.
- Árvore de indicados.
- Histórico de temperatura, mensagens e engajamento.

**Ausências do Instagram (`/instagram/ausencias`)**
- Lista de quem faltou em 5 dos últimos 6 posts.
- Botão de WhatsApp por linha.

### 8.4 Design do Relatório de Exportação

O relatório para os candidatos é o artefato que sai da organização. Precisa parecer método, não planilha.

- **Capa:** nome da estrutura, período coberto, data de extração em destaque.
- **Página 1:** os quatro números-síntese, grandes.
- **Distribuição territorial:** barras de realizado contra a proporção do eleitorado, com R1, R2 e R3 lado a lado.
- **Penetração por colégio:** tabela dos 15 maiores locais, com eleitores, cadastros e percentual.
- **Curva semanal:** evolução do volume, com projeção até 4 de outubro.
- **Lideranças:** lista nominal, sem telefone, com bairro e volume.
- **Rodapé:** data de extração repetida em toda página.

> **O que nunca entra:** telefone de apoiador, nome de apoiador, prontuário, demanda, conteúdo de interação.

---

## 9. Motor de Regras e Cálculos

> **Princípio central:** a inteligência deste sistema não está em modelo, está em regra bem definida. Toda métrica precisa ser reproduzível na mão, porque a coordenação vai questionar um número em algum momento e a resposta tem que ser explicável em uma frase.

### 9.1 Definições Base

| Termo | Definição |
|---|---|
| **Cadastros de uma liderança** | Contagem de `pessoas` onde `indicado_por` = id da liderança e `ativo = true`. |
| **Último cadastro** | `MAX(criado_em)` dos indicados. |
| **Dias parada** | Dias corridos entre o último cadastro e hoje. Se nunca cadastrou, dias desde o envio do link. |
| **Ativa** | Recebeu ao menos um cadastro nos últimos 10 dias. |
| **Penetração** | Cadastros do território dividido pelo eleitorado do território. |

### 9.2 Cálculo de Temperatura de Cadastro

```
função calcular_temperatura(lideranca):

  cadastros    = total de indicados ativos
  enviado_em   = data do primeiro envio de link registrado
  ultimo       = data do último cadastro recebido
  dias_envio   = dias desde enviado_em
  dias_parada  = dias desde ultimo (ou dias_envio se nunca cadastrou)
  ativa        = dias_parada <= 10
  semanas      = número de semanas distintas com ao menos um cadastro

  se enviado_em é nulo                    -> 'aguardando'
  se cadastros = 0 e dias_envio < 5       -> 'aguardando'
  se cadastros = 0 e dias_envio >= 5      -> 'afastado'
  se não ativa                            -> 'frio'
  se cadastros >= 20 e semanas >= 3       -> 'engajado'
  se cadastros >= 10                      -> 'muito_quente'
  se cadastros >= 5                       -> 'quente'
  senão                                   -> 'frio'
```

**Três decisões embutidas, com a razão de cada uma:**

**Volume sem recência é placar histórico.** Uma liderança que trouxe 12 pessoas há três semanas e sumiu apareceria como "muito quente" estando morta. A checagem de `ativa` vem antes de qualquer faixa de volume, e derruba para "frio" quem parou, independente de quanto trouxe.

**"Aguardando" evita o alerta inútil da estreia.** No dia em que o sistema sobe, as 70 lideranças têm zero cadastros. Sem esse estado, o painel abre com 70 linhas vermelhas e o bloco de cobrança perde significado justamente na semana em que precisa funcionar. Os 5 dias dão tempo do link circular.

**"Engajado" exige constância, não pico.** Quem despeja 25 contatos da agenda num sábado esvaziou a lista. Quem traz 4 por semana durante um mês está trabalhando a rede, e é quem vai chegar aos 100. A condição de 3 semanas distintas separa os dois, e a distinção importa porque só o segundo perfil justifica investir tempo de coordenação.

**Recálculo:** diário, mais gatilho a cada cadastro atribuído. Snapshot semanal em `temperatura_historico`.

### 9.3 Cálculo de Penetração

```sql
-- Penetração por bairro
SELECT
  b.nome,
  b.eleitores,
  COUNT(p.id) AS cadastros,
  ROUND(100.0 * COUNT(p.id) / NULLIF(b.eleitores,0), 2) AS penetracao_pct
FROM bairros b
LEFT JOIN locais_votacao l ON l.bairro_id = b.id
LEFT JOIN pessoas p ON p.local_votacao_id = l.id AND p.ativo
GROUP BY b.id, b.nome, b.eleitores
ORDER BY penetracao_pct ASC;
```

**Regra de exibição:** nenhum número absoluto aparece sozinho quando existe percentual que o qualifica. A ordenação padrão é por penetração **crescente**, porque a tela existe para mostrar onde falta, não onde já está bom.

**Exclusão:** pessoas com `fora_do_municipio = true` entram no total geral e no crédito da liderança, e ficam fora de todo cálculo territorial.

### 9.4 Detecção de Buraco e Sobreposição

```
buraco:        local com eleitores >= 2000
               e zero lideranças com aquele local como âncora

sobreposicao:  local com 2 ou mais lideranças âncora

desequilibrio: |penetração da região - proporção do eleitorado| > 10 pontos
```

Buraco e sobreposição não são erros, são informação. Sobreposição em São João (8.384 eleitores) é adequada. Sobreposição em Sapeatiba Mirim (55 eleitores) é desperdício de duas lideranças. A tela mostra o dado, a decisão é humana.

### 9.5 Casamento de Handle

```
normalizar(handle):
  remove '@', espaços e URL
  converte para minúsculo
  remove parâmetros de query

casar(handle_cru):
  h = normalizar(handle_cru)
  busca pessoa com instagram_handle = h
  se encontrou -> grava pessoa_id no engajamento
  senão        -> deixa pessoa_id nulo e entra na fila de recrutamento
```

**Regras invioláveis:**

1. `handle_cru` é gravado exatamente como veio e **nunca** é sobrescrito.
2. O vínculo (`pessoa_id`) mora em campo separado e pode ser corrigido a qualquer momento.
3. O extrator deve entregar **handle**, nunca nome de exibição. Nome muda e se repete; handle é único.

**Temperatura digital:**

```
janela = últimos 6 posts em que a liderança estava no roster
presencas = posts da janela em que ela comentou

presencas >= 5  -> 'ativo'
presencas >= 2  -> 'irregular'
senão           -> 'ausente'
```

**Por que comentário e não curtida.** A API oficial do Instagram devolve a lista nominal de quem comentou em posts próprios, mas para curtidas devolve apenas a contagem agregada: a lista de quem curtiu não é exposta por nenhuma via oficial. Isso não é limitação de ferramenta, é decisão da plataforma. Como consequência de produto, **o comentário vira a exigência principal da rede**, porque é o sinal mensurável e é também o que mais pesa no alcance. A curtida vira piso, verificada pela contagem agregada.

**Por que janela e não evento.** Faltar em um post não significa nada; a pessoa estava trabalhando. Faltar em 5 dos últimos 6 é diagnóstico. Alerta por evento gera ruído e treina a coordenação a ignorar o alerta.

**Por que roster congelado.** Sem ele, uma liderança cadastrada em setembro apareceria como ausente em todos os posts de agosto, e o painel encheria de falso negativo.

### 9.6 Onde a IA Não Entra (e por quê)

O MVP não tem camada de IA, por decisão. Todas as regras acima são determinísticas, auditáveis e reproduzíveis na mão. Em um sistema onde a coordenação vai questionar um número na frente de uma liderança, "o modelo classificou assim" é uma resposta que destrói confiança, e "trouxe 4 pessoas e parou há 12 dias" é uma que resolve a conversa.

Onde a IA faria sentido depois, se houver volume que justifique:

- Sugestão de linha pessoal a partir do histórico de interações da liderança.
- Categorização automática de demandas a partir da descrição livre.
- Redação do texto analítico do relatório de exportação a partir dos agregados.

Nenhuma dessas entra antes de a captura estar funcionando.

---

## 10. Segurança e LGPD

> **Atenção crítica:** este sistema processa filiação e opinião política, classificadas como dado pessoal sensível pela LGPD (art. 5º, II). O regime de proteção é mais rígido que o de dado pessoal comum.

### 10.1 Proteção de Dados (MVP)

- **Em trânsito:** HTTPS obrigatório em todos os endpoints.
- **Em repouso:** criptografia padrão do Supabase.
- **Rota pública write-only:** nenhuma policy de `SELECT` para `anon`. A página pública insere e não lê. Isso é a defesa mais importante do sistema, porque a URL circula em milhares de conversas de WhatsApp e não pode ser um vetor de leitura.
- **Rate limiting** no endpoint de cadastro público.
- **Tokens de exportação** não adivinháveis, com revogação e registro.
- **Auditoria** de reatribuição de indicação e de geração de exportação.

### 10.2 Autenticação e Autorização

- Supabase Auth apenas para coordenação e operadores.
- Dois papéis com escopo distinto, aplicados por RLS no banco e não no frontend.
- Nenhuma superfície de login pública além do admin.

### 10.3 LGPD — Pendências Registradas

Conscientemente adiadas. Registradas aqui para tratamento antes ou logo após a entrada em produção.

1. **[PENDENTE]** Texto de consentimento no formulário público, específico e destacado, não checkbox escondido.
2. **[PENDENTE]** Finalidade do tratamento declarada de forma clara.
3. **[PENDENTE]** Campos de rastreio do consentimento: `consentimento_versao`, `consentimento_em`, `finalidade`.
4. **[PENDENTE]** Política de retenção. **A decisão precisa ser tomada antes de novembro:** a base é descartada após a eleição, ou migra para a operação de mandato com novo consentimento? A resposta vira campo no banco, então adiar demais custa retrabalho.
5. **[PENDENTE]** Canal de exclusão a pedido do titular.
6. **[PENDENTE]** Política de acesso por operador e log de acesso.

### 10.4 Regras Vigentes Desde o MVP

Estas não são pendências. Valem a partir da primeira linha de código.

- **Nenhum campo de contrapartida.** Não existe, em nenhuma tabela, campo que registre o que foi prometido ou entregue em troca de apoio. Atendimento de demanda de morador é trabalho de mandato e é legítimo. Registro de troca transforma o banco em prova documental. A proibição vale também para o campo de descrição livre de interações e demandas, e exige uma orientação verbal de dez minutos às 70 lideranças na reunião de largada.
- **Origem consentida.** A base nasce inteiramente de cadastro voluntário. Nenhuma lista comprada, nenhuma raspagem de cadastro público. Além do problema legal, base importada contamina a métrica: destrói a capacidade de saber quem a liderança realmente trouxe, que é a razão de o sistema existir.
- **Nada de disparo em massa.** Automação de envio massivo contratada de terceiro é vedada pela legislação eleitoral. Todo envio deste sistema é individual, com toque humano, via `wa.me`. Antes de qualquer integração com API de mensageria, verificar o texto vigente da resolução do TSE aplicável ao pleito.
- **Ingestão de Instagram desacoplada.** O sistema nunca conversa com a plataforma. Extração fica em ferramenta separada, sob decisão consciente de risco. Isso protege a conta oficial da campanha de restrição em plena campanha, que seria uma ferida autoinfligida no pior momento.

### 10.5 Plano de Resposta a Incidentes

1. **Detecção:** monitoramento de queda da rota pública e de erro em massa no cadastro.
2. **Contenção:** rollback via Vercel, rotação de chaves, revogação de tokens de exportação.
3. **Comunicação:** em caso de vazamento de dado pessoal, notificação à ANPD e aos titulares afetados.
4. **Pós-mortem:** causa raiz documentada e ação corretiva.

---

## 11. Plano de Execução

> **Formato:** blocos autocontidos, executados em ordem de dependência. Sem estimativa de duração. Ao final de cada bloco existe algo demonstrável e utilizável.

### 11.1 Pré-requisitos

Antes de escrever a primeira linha:

1. Conta no GitHub.
2. Conta no Supabase.
3. Conta na Vercel.
4. Node.js 20 ou superior.
5. Claude Code instalado.
6. **Seed territorial completo:** os 7 locais de votação faltantes levantados na base do TSE (59ª ZE). Ver Seção 6.3.
7. **Dados das 70 lideranças:** nome, WhatsApp, bairro de atuação, local âncora, @ do Instagram, tags.
8. **Metas individuais** definidas.
9. **70 linhas pessoais** escritas.
10. **Identidade visual da campanha** definida para a página pública.

> Os itens 6 a 10 não são tarefa de desenvolvimento, e são o gargalo real. Podem e devem correr em paralelo aos blocos 1 e 2.

### 11.2 Blocos de Entrega

#### Bloco 1 — Fundação
- **Objetivo:** projeto no ar, com banco e autenticação.
- **Entregas:** Next.js estruturado · Supabase conectado · Auth da coordenação com dois papéis · RLS ativa · deploy na Vercel · `CLAUDE.md` configurado.
- **Requisitos:** RF-02.

#### Bloco 2 — Base Territorial
- **Objetivo:** o denominador dentro do banco, validado.
- **Entregas:** tabelas `bairros` e `locais_votacao` · seed dos 31 bairros e 40 locais · script de validação de integridade rodando verde · lookup em cascata bairro → local.
- **Requisitos:** RF-01.
- **Bloqueio:** não avança sem os 4 checks de validação passando.

#### Bloco 3 — Captura (o bloco urgente)
- **Objetivo:** a rede inteira ativada e cadastrando.
- **Entregas:** tabela `pessoas` autorreferente · cadastro de liderança no admin · geração de slug · página pública `/[slug]` · select em cascata · tratamento de duplicidade · tela de confirmação com compartilhar e cadastrar mais um · Open Graph · motor de templates · envio via `wa.me` · registro de envio · dashboard mínimo (indicadores, termômetro, bloco de cobrança).
- **Requisitos:** RF-03, RF-04, RF-08 a RF-13, RF-17, RF-18, RF-19, RF-28, RF-29, RF-30, RF-31.
- **Critério de saída:** as 70 lideranças cadastradas, com link enviado e envio registrado.

> **Este é o único bloco urgente.** Cada dia com a página fora do ar é uma conversa que a liderança teve e não foi registrada. Tudo depois dele é ganho incremental sobre uma base que já está crescendo.

#### Bloco 4 — Território
- **Objetivo:** enxergar onde falta.
- **Entregas:** penetração por bairro · penetração por local · detecção de buraco e sobreposição · cobertura por macro-região · ranking semanal · histórico e selos de temperatura.
- **Requisitos:** RF-14, RF-15, RF-20, RF-21, RF-22, RF-23.

#### Bloco 5 — Relacionamento
- **Objetivo:** a base vira memória, não só contagem.
- **Entregas:** prontuário completo · interações · demandas com ciclo de status · fila global de demandas abertas · tags · promoção de apoiador a liderança · reatribuição manual · templates de cutucada, reativação e reconhecimento · fila de envio em lote.
- **Requisitos:** RF-05, RF-06, RF-07, RF-24, RF-25, RF-26, RF-27, RF-32.

#### Bloco 6 — Digital
- **Objetivo:** medir a obrigação de engajamento.
- **Entregas:** cadastro de posts · roster congelado · importação de engajamento · casamento por handle · temperatura digital · relatório de ausência acumulada · fila de recrutamento.
- **Requisitos:** RF-16, RF-33 a RF-38.
- **Dependência externa:** o extrator de curtidas e comentários, construído em separado.

#### Bloco 7 — Prestação de Contas
- **Objetivo:** provar a força da estrutura sem entregar o ativo.
- **Entregas:** perfis de exportação · snapshot datado · link com token revogável · layout do relatório.
- **Requisitos:** RF-39, RF-40, RF-41.

#### Bloco 8 — Pós-eleição
- **Objetivo:** transformar a campanha em base de mandato.
- **Entregas:** enriquecimento de seção eleitoral · importação do boletim de urna · cruzamento de cadastros por seção contra votos apurados · decisão e execução da política de retenção LGPD.
- **Requisitos:** pendências 10.3 e Seção 11.4.

### 11.3 Dependências e Riscos de Execução

| Risco | Probabilidade | Mitigação |
|---|---|---|
| **Seed territorial incompleto no Bloco 3** | Alta | Levantar os 7 locais faltantes em paralelo ao Bloco 1. A lista está fechada na Seção 6.3 e cabe numa consulta ao TSE. |
| **Dados das 70 lideranças demorarem** | Alta | O sistema pode subir com 10 lideranças e ir recebendo o resto. Não bloquear o Bloco 3 esperando a lista completa. |
| **Liderança cadastrar no papel e ignorar o link** | Alta | Formulário de 4 campos, botão de cadastrar mais um, mensagem que enfatiza "fica registrado como seu", reforço na reunião de largada. |
| **Rede esfriar após a primeira semana** | Alta | Termômetro com recência, bloco de cobrança diário, reconhecimento automático de meta batida. |
| **Identidade visual da campanha atrasar** | Média | Subir com identidade neutra e trocar depois. Cor não pode bloquear captura. |
| **Extrator de Instagram não ficar pronto** | Média | O Bloco 6 é independente. A ausência dele não afeta nada dos blocos 1 a 5. |

### 11.4 Critérios de Pronto

Um bloco só é considerado pronto quando:

1. Deployado na Vercel sem erro.
2. Fluxo principal testado manualmente **em celular real**, não em emulador.
3. Sem regressão nos blocos anteriores.
4. TypeScript sem erro.
5. Policies de RLS testadas com usuário anônimo (tentar ler a base pela rota pública e falhar).
6. Commit no GitHub com mensagem descritiva.
7. `CLAUDE.md` atualizado.

**Teste obrigatório antes do disparo das 70:** enviar o link para uma liderança real, conferir o preview no WhatsApp, cadastrar uma pessoa de verdade e verificar a atribuição no painel.

---

## 12. Glossário

**Atribuição**
O vínculo entre um apoiador e a liderança que o trouxe. É gerada automaticamente pelo link e é a razão de o sistema existir.

**Colégio eleitoral**
Local de votação. Uma escola onde várias seções funcionam no dia da eleição. São 40 em São Pedro da Aldeia.

**CLAUDE.md**
Arquivo na raiz do projeto que dá contexto ao Claude Code: regras, padrões e decisões. Consultado em cada interação.

**Deploy**
Publicar o código para que fique disponível na internet.

**Handle**
O @ de um perfil no Instagram. É único na plataforma, diferente do nome de exibição, que muda e se repete. Por isso é a chave de ligação do módulo digital.

**Macro-região**
Agrupamento geográfico dos 40 locais em três territórios contíguos (R1 Central, R2 Leste, R3 Balneários), definido no relatório de inteligência eleitoral.

**Open Graph**
Conjunto de meta tags que define como um link aparece quando compartilhado no WhatsApp ou nas redes. Sem elas, o link aparece cru e parece golpe.

**Penetração**
Cadastros de um território divididos pelo eleitorado daquele território. É o número que qualifica o volume absoluto.

**Prontuário**
Ficha completa de uma pessoa da base: identificação, histórico de contatos e demandas.

**Rede 100x10**
Esquema de mobilização em quatro fases descrito no relatório de inteligência: cada liderança recruta 100 pessoas da própria lista, e cada uma delas recruta mais 10.

**RLS (Row Level Security)**
Mecanismo do PostgreSQL que define, no próprio banco, quais linhas cada usuário pode acessar. Segurança que não depende do frontend estar correto.

**Roster**
A lista de quem era liderança na data de um post. Congelada para que ninguém apareça como ausente em post publicado antes de entrar na rede.

**Seção eleitoral**
A menor unidade de apuração. O resultado da urna é publicado por seção, e é por isso que ela é a chave do cruzamento pós-eleição. São 252 no município. Não é capturada no formulário, por decisão.

**Seed**
Carga inicial de dados de referência no banco. Aqui, a base territorial do município.

**Slug**
O trecho final da URL que identifica a liderança. Em `/joao-silva`, o slug é `joao-silva`.

**Temperatura**
Estado calculado de uma liderança, derivado de volume e recência. Nunca marcado à mão.

**wa.me**
Formato de link oficial do WhatsApp que abre uma conversa com número e mensagem já preenchidos. O envio continua sendo manual.

**Write-only**
Rota que aceita gravação e não permite leitura. A página pública é write-only, e essa é a principal defesa do sistema.

---

*Fim do PRD*

**Próximo documento:** Prompt de Inicialização do Claude Code, com o setup guiado e os prompts por bloco.
