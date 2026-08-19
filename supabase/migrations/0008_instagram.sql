-- Bloco 6 · Digital · RF-16, RF-33 a RF-38
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.
--
-- O sistema NUNCA conversa com o Instagram. Não há integração, SDK ou
-- requisição para a plataforma — a extração fica em ferramenta separada, sob
-- decisão consciente de risco, para não expor a conta oficial da campanha a
-- restrição em plena campanha. A entrada aqui é sempre importação.

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'tipo_engajamento' and n.nspname = 'public') then
    create type public.tipo_engajamento as enum
      ('comentario', 'curtida', 'story_mention');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'origem_engajamento' and n.nspname = 'public') then
    create type public.origem_engajamento as enum ('api', 'importacao_manual');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'temperatura_digital' and n.nspname = 'public') then
    create type public.temperatura_digital as enum ('ativo', 'irregular', 'ausente');
  end if;
end
$$;

-- ── posts ──────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id                 uuid primary key default gen_random_uuid(),
  url                text not null,
  publicado_em       timestamptz not null default now(),
  legenda            text,
  curtidas_total     integer,
  comentarios_total  integer,
  criado_em          timestamptz not null default now()
);

create index if not exists posts_publicado_em_idx on public.posts (publicado_em desc);

-- ── roster congelado (RF-36) ───────────────────────────────────────────────
-- Cada post guarda quem era liderança NAQUELA data. Sem isso, uma liderança
-- cadastrada em setembro apareceria como ausente em todos os posts de agosto,
-- e a tela de ausências encheria de falso negativo até ninguém mais olhar.
create table if not exists public.post_roster (
  post_id    uuid not null references public.posts (id) on delete cascade,
  pessoa_id  uuid not null references public.pessoas (id) on delete cascade,
  primary key (post_id, pessoa_id)
);

create index if not exists post_roster_pessoa_idx on public.post_roster (pessoa_id);

/*
 * Congela o roster no instante em que o post é cadastrado.
 *
 * Em trigger, e não na aplicação, porque "o roster nunca é recalculado depois"
 * é uma promessa que precisa valer mesmo para quem inserir o post por outro
 * caminho.
 */
create or replace function public.congelar_roster_do_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.post_roster (post_id, pessoa_id)
  select new.id, p.id
    from public.pessoas p
   where p.nivel = 'lideranca' and p.ativo
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists posts_congela_roster on public.posts;
create trigger posts_congela_roster
  after insert on public.posts
  for each row execute function public.congelar_roster_do_post();

-- ── engajamentos (RF-34, RF-35) ────────────────────────────────────────────
create table if not exists public.engajamentos (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,

  -- Invariante 3: exatamente como veio da importação. NUNCA sobrescrito.
  handle_cru    text not null,

  -- O vínculo mora em coluna separada e pode ser corrigido a qualquer momento,
  -- sem tocar no histórico. Se a liderança trocar de @ no meio da campanha, o
  -- que muda é isto aqui.
  pessoa_id     uuid references public.pessoas (id) on delete set null,

  tipo          public.tipo_engajamento not null,
  texto         text,
  origem        public.origem_engajamento not null default 'importacao_manual',
  capturado_em  timestamptz not null default now(),

  -- O mesmo @ não conta duas vezes o mesmo tipo de ação no mesmo post.
  unique (post_id, handle_cru, tipo)
);

create index if not exists engajamentos_post_idx    on public.engajamentos (post_id);
create index if not exists engajamentos_pessoa_idx  on public.engajamentos (pessoa_id);
create index if not exists engajamentos_handle_idx  on public.engajamentos (handle_cru);
create index if not exists engajamentos_sem_vinculo_idx
  on public.engajamentos (handle_cru) where pessoa_id is null;

comment on column public.engajamentos.handle_cru is
  'Exatamente como veio da importação. Nunca sobrescrito — o trigger recusa.';

/*
 * Invariante 3, com dente.
 *
 * Corrigir vínculo é rotina; reescrever o registro histórico não é. O extrator
 * entrega handle, não nome de exibição, porque nome muda e se repete — e o
 * handle cru é a única prova do que estava lá no dia.
 */
create or replace function public.proteger_handle_cru()
returns trigger
language plpgsql
as $$
begin
  if new.handle_cru is distinct from old.handle_cru then
    raise exception 'handle_cru não é sobrescrito. Para corrigir o vínculo, altere pessoa_id.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists engajamentos_protege_handle on public.engajamentos;
create trigger engajamentos_protege_handle
  before update on public.engajamentos
  for each row execute function public.proteger_handle_cru();

-- ── fila de recrutamento (RF-38) ───────────────────────────────────────────
-- @ que engajou e não bate com ninguém da base não é erro de importação: é
-- gente engajada que você não tem cadastrada. Em campanha municipal, quem
-- comenta em post político por vontade própria é liderança em potencial.
create table if not exists public.recrutamento (
  handle      text primary key,
  operador    uuid references public.operadores (id) on delete set null,
  criado_em   timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.posts         enable row level security;
alter table public.post_roster   enable row level security;
alter table public.engajamentos  enable row level security;
alter table public.recrutamento  enable row level security;

drop policy if exists "posts_leitura" on public.posts;
create policy "posts_leitura" on public.posts for select to authenticated using (true);
drop policy if exists "posts_escrita" on public.posts;
create policy "posts_escrita" on public.posts for all to authenticated
  using (true) with check (true);

drop policy if exists "roster_leitura" on public.post_roster;
create policy "roster_leitura" on public.post_roster for select to authenticated using (true);
-- Sem policy de escrita: o roster é congelado pelo trigger e não se edita.

drop policy if exists "engajamentos_leitura" on public.engajamentos;
create policy "engajamentos_leitura" on public.engajamentos
  for select to authenticated using (true);
drop policy if exists "engajamentos_insercao" on public.engajamentos;
create policy "engajamentos_insercao" on public.engajamentos
  for insert to authenticated with check (true);
drop policy if exists "engajamentos_vinculo" on public.engajamentos;
create policy "engajamentos_vinculo" on public.engajamentos
  for update to authenticated using (true) with check (true);
drop policy if exists "engajamentos_exclusao" on public.engajamentos;
create policy "engajamentos_exclusao" on public.engajamentos
  for delete to authenticated using (public.papel_atual() = 'coordenacao');

drop policy if exists "recrutamento_leitura" on public.recrutamento;
create policy "recrutamento_leitura" on public.recrutamento
  for select to authenticated using (true);
drop policy if exists "recrutamento_escrita" on public.recrutamento;
create policy "recrutamento_escrita" on public.recrutamento
  for all to authenticated using (true) with check (true);

-- ── temperatura digital (RF-16) ────────────────────────────────────────────
/*
 * Janela dos últimos 6 posts EM QUE A LIDERANÇA ESTAVA NO ROSTER.
 *
 * Presença é comentário, não curtida: a API oficial devolve a lista nominal de
 * quem comentou, mas para curtidas devolve só a contagem agregada. Isso não é
 * limitação de ferramenta, é decisão da plataforma — e a consequência de
 * produto é que o comentário vira a exigência principal da rede.
 *
 * Devolve nulo quando a pessoa não esteve em nenhum post: quem entrou ontem
 * não está ausente, está sem janela.
 *
 * NUNCA é combinada com a temperatura de cadastro num número único. Quem
 * cadastra 20 e não comenta é um problema diferente de quem comenta em tudo e
 * cadastra zero.
 */
create or replace function public.calcular_temperatura_digital(p_pessoa_id uuid)
returns public.temperatura_digital
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_janela    integer;
  v_presencas integer;
begin
  with ultimos as (
    select p.id
      from public.posts p
      join public.post_roster r on r.post_id = p.id and r.pessoa_id = p_pessoa_id
     order by p.publicado_em desc
     limit 6
  )
  select count(*),
         count(*) filter (
           where exists (
             select 1 from public.engajamentos e
              where e.post_id = ultimos.id
                and e.pessoa_id = p_pessoa_id
                and e.tipo = 'comentario'
           )
         )
    into v_janela, v_presencas
    from ultimos;

  if v_janela = 0 then
    return null;
  end if;

  if v_presencas >= 5 then return 'ativo';     end if;
  if v_presencas >= 2 then return 'irregular'; end if;
  return 'ausente';
end;
$$;

create or replace view public.v_lideranca_digital
with (security_invoker = on)
as
with janela as (
  select
    p.id as pessoa_id,
    p.nome,
    p.telefone,
    p.slug,
    p.instagram_handle,
    (select count(*) from (
       select po.id from public.posts po
         join public.post_roster r on r.post_id = po.id and r.pessoa_id = p.id
        order by po.publicado_em desc limit 6
     ) j) as janela,
    (select count(*) from (
       select po.id from public.posts po
         join public.post_roster r on r.post_id = po.id and r.pessoa_id = p.id
        order by po.publicado_em desc limit 6
     ) j
      where exists (
        select 1 from public.engajamentos e
         where e.post_id = j.id and e.pessoa_id = p.id and e.tipo = 'comentario'
      )) as presencas
  from public.pessoas p
  where p.nivel = 'lideranca' and p.ativo
)
select
  pessoa_id,
  nome,
  telefone,
  slug,
  instagram_handle,
  janela,
  presencas,
  (janela - presencas) as faltas,
  case
    when janela = 0        then null
    when presencas >= 5    then 'ativo'::public.temperatura_digital
    when presencas >= 2    then 'irregular'::public.temperatura_digital
    else                        'ausente'::public.temperatura_digital
  end as estado_digital
from janela;

comment on view public.v_lideranca_digital is
  'Segundo eixo, independente. Nunca some com a temperatura de cadastro.';

-- ── fila de recrutamento: @ que engajou e não casou ────────────────────────
create or replace view public.v_handles_sem_vinculo
with (security_invoker = on)
as
select
  e.handle_cru,
  count(*)                                        as engajamentos,
  count(distinct e.post_id)                       as posts,
  max(e.capturado_em)                             as ultimo,
  bool_or(r.handle is not null)                   as marcado
from public.engajamentos e
left join public.recrutamento r on r.handle = e.handle_cru
where e.pessoa_id is null
group by e.handle_cru
order by count(*) desc, max(e.capturado_em) desc;
