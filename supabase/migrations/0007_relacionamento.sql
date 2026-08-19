-- Bloco 5 · Relacionamento · RF-05 a RF-07, RF-24 a RF-27
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- INVARIANTE 1, ESCRITA AQUI PARA QUEM LER ESTE ARQUIVO DAQUI A SEIS MESES:
--
-- Não existe, e não vai existir, campo que registre o que foi prometido ou
-- entregue em troca de apoio. Nem com outro nome — "benefício", "retorno",
-- "contrapartida", "acordo", "combinado".
--
-- Atendimento de demanda de morador é trabalho de mandato e é legítimo. O que
-- transforma o banco em prova documental é o REGISTRO DA TROCA. A proibição
-- vale também para os campos de texto livre `descricao`, e por isso ela precisa
-- de orientação verbal à rede, não só de schema.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'tipo_interacao' and n.nspname = 'public') then
    create type public.tipo_interacao as enum
      ('ligacao', 'visita', 'conversa', 'mensagem');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'status_demanda' and n.nspname = 'public') then
    create type public.status_demanda as enum
      ('aberta', 'em_andamento', 'resolvida', 'sem_solucao');
  end if;
end
$$;

-- ── interações ─────────────────────────────────────────────────────────────
-- Registro simples de contato. O prontuário se preenche por evento: ninguém
-- preenche ficha proativamente para milhares de pessoas.
create table if not exists public.interacoes (
  id         uuid primary key default gen_random_uuid(),
  pessoa_id  uuid not null references public.pessoas (id) on delete cascade,
  tipo       public.tipo_interacao not null,
  canal      text,
  descricao  text not null check (length(btrim(descricao)) >= 2),
  autor      uuid references public.operadores (id) on delete set null,
  criado_em  timestamptz not null default now()
);

create index if not exists interacoes_pessoa_idx
  on public.interacoes (pessoa_id, criado_em desc);

-- ── demandas ───────────────────────────────────────────────────────────────
create table if not exists public.demandas (
  id            uuid primary key default gen_random_uuid(),
  pessoa_id     uuid not null references public.pessoas (id) on delete cascade,
  titulo        text not null check (length(btrim(titulo)) >= 3),
  descricao     text,
  categoria     text,
  status        public.status_demanda not null default 'aberta',
  responsavel   uuid references public.operadores (id) on delete set null,
  aberta_em     timestamptz not null default now(),
  resolvida_em  timestamptz,
  -- Fechar sem data de fechamento deixaria a fila mentindo sobre o tempo de
  -- resposta. A data entra sozinha, no trigger abaixo.
  constraint fechada_tem_data
    check (status in ('aberta', 'em_andamento') or resolvida_em is not null)
);

create index if not exists demandas_pessoa_idx  on public.demandas (pessoa_id, aberta_em desc);
create index if not exists demandas_abertas_idx on public.demandas (status, aberta_em desc);

create or replace function public.carimbar_resolucao_demanda()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('resolvida', 'sem_solucao') and new.resolvida_em is null then
    new.resolvida_em := now();
  end if;

  -- Reabrir apaga a data: a demanda voltou a estar em aberto de verdade.
  if new.status in ('aberta', 'em_andamento') then
    new.resolvida_em := null;
  end if;

  return new;
end;
$$;

drop trigger if exists demandas_carimba_resolucao on public.demandas;
create trigger demandas_carimba_resolucao
  before insert or update on public.demandas
  for each row execute function public.carimbar_resolucao_demanda();

-- ── auditoria de reatribuição (RF-07) ──────────────────────────────────────
-- Reatribuir muda a quem o cadastro é creditado. Sem registro, a coordenação
-- não tem como responder "quem mudou isso, e quando" — e essa é exatamente a
-- pergunta que aparece quando duas lideranças discordam.
--
-- Append-only por policy: sem update, sem delete. Log que se edita não é log.
create table if not exists public.reatribuicoes (
  id            uuid primary key default gen_random_uuid(),
  pessoa_id     uuid not null references public.pessoas (id) on delete cascade,
  de_pessoa_id  uuid references public.pessoas (id) on delete set null,
  para_pessoa_id uuid references public.pessoas (id) on delete set null,
  operador      uuid references public.operadores (id) on delete set null,
  motivo        text,
  criado_em     timestamptz not null default now()
);

create index if not exists reatribuicoes_pessoa_idx
  on public.reatribuicoes (pessoa_id, criado_em desc);
create index if not exists reatribuicoes_criado_em_idx
  on public.reatribuicoes (criado_em desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.interacoes     enable row level security;
alter table public.demandas       enable row level security;
alter table public.reatribuicoes  enable row level security;

drop policy if exists "interacoes_leitura" on public.interacoes;
create policy "interacoes_leitura" on public.interacoes
  for select to authenticated using (true);

drop policy if exists "interacoes_insercao" on public.interacoes;
create policy "interacoes_insercao" on public.interacoes
  for insert to authenticated with check (true);

-- Corrigir o próprio registro é conserto de digitação; mexer no dos outros
-- é reescrever memória alheia.
drop policy if exists "interacoes_edicao" on public.interacoes;
create policy "interacoes_edicao" on public.interacoes
  for update to authenticated
  using (autor = auth.uid() or public.papel_atual() = 'coordenacao');

drop policy if exists "interacoes_exclusao" on public.interacoes;
create policy "interacoes_exclusao" on public.interacoes
  for delete to authenticated
  using (autor = auth.uid() or public.papel_atual() = 'coordenacao');

drop policy if exists "demandas_leitura" on public.demandas;
create policy "demandas_leitura" on public.demandas
  for select to authenticated using (true);

drop policy if exists "demandas_escrita" on public.demandas;
create policy "demandas_escrita" on public.demandas
  for insert to authenticated with check (true);

drop policy if exists "demandas_edicao" on public.demandas;
create policy "demandas_edicao" on public.demandas
  for update to authenticated using (true) with check (true);

drop policy if exists "demandas_exclusao" on public.demandas;
create policy "demandas_exclusao" on public.demandas
  for delete to authenticated
  using (public.papel_atual() = 'coordenacao');

drop policy if exists "reatribuicoes_leitura" on public.reatribuicoes;
create policy "reatribuicoes_leitura" on public.reatribuicoes
  for select to authenticated using (true);

drop policy if exists "reatribuicoes_insercao" on public.reatribuicoes;
create policy "reatribuicoes_insercao" on public.reatribuicoes
  for insert to authenticated with check (true);

-- Sem policy de update e sem policy de delete. É proposital.

-- ── fila global de demandas abertas ────────────────────────────────────────
create or replace view public.v_demandas
with (security_invoker = on)
as
select
  d.id,
  d.titulo,
  d.descricao,
  d.categoria,
  d.status,
  d.responsavel,
  d.aberta_em,
  d.resolvida_em,
  floor(extract(epoch from (coalesce(d.resolvida_em, now()) - d.aberta_em)) / 86400)::integer as dias_aberta,
  p.id    as pessoa_id,
  p.nome  as pessoa_nome,
  p.telefone as pessoa_telefone,
  p.nivel as pessoa_nivel,
  b.nome  as bairro_nome,
  o.nome  as responsavel_nome
from public.demandas d
join public.pessoas p on p.id = d.pessoa_id
left join public.locais_votacao l on l.id = p.local_votacao_id
left join public.bairros b        on b.id = l.bairro_id
left join public.operadores o     on o.id = d.responsavel;

comment on view public.v_demandas is
  'Fila de trabalho do gabinete. dias_aberta congela quando a demanda fecha.';
