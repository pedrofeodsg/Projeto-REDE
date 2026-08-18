-- Bloco 3A · Pessoas e Lideranças · RF-03 e RF-04
--
-- Tabela única e autorreferente, por decisão de arquitetura (PRD 6.1): pessoas
-- mudam de nível, e promover apoiador a liderança não pode exigir migração de
-- registro entre tabelas — migrar perderia o `indicado_por` e o histórico.
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'nivel_pessoa' and n.nspname = 'public') then
    create type public.nivel_pessoa as enum ('coordenacao', 'lideranca', 'apoiador');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'origem_pessoa' and n.nspname = 'public') then
    create type public.origem_pessoa as enum ('link', 'admin');
  end if;
end
$$;

-- Papel do operador logado. security definer para não depender de policy de
-- leitura em operadores. As policies dos próximos blocos usam esta função.
create or replace function public.papel_atual()
returns public.papel_operador
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.operadores where id = auth.uid();
$$;

revoke execute on function public.papel_atual() from anon;
grant execute on function public.papel_atual() to authenticated;

create table if not exists public.pessoas (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null check (length(btrim(nome)) >= 2),

  -- Invariante 2: chave única global, só dígitos, com 55 na frente.
  -- Toda escrita passa por normalizarTelefone() em lib/pessoas/telefone.ts;
  -- este CHECK é a rede embaixo, para o caso de alguém escrever direto na tabela.
  telefone           text not null unique check (telefone ~ '^55[0-9]{10,11}$'),

  nivel              public.nivel_pessoa not null default 'apoiador',
  indicado_por       uuid references public.pessoas (id) on delete set null,
  bairro_moradia_id  uuid references public.bairros (id) on delete restrict,
  local_votacao_id   uuid references public.locais_votacao (id) on delete restrict,
  fora_do_municipio  boolean not null default false,
  instagram_handle   text check (instagram_handle ~ '^[a-z0-9._]{1,30}$'),

  -- Só liderança tem link. Apoiador nunca recebe link individual.
  slug               text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  meta               integer not null default 10 check (meta >= 0),
  linha_pessoal      text,

  -- Enriquecimento pós-eleição (Bloco 8). Nunca pedido no formulário público.
  secao              text,

  origem             public.origem_pessoa not null default 'admin',
  ativo              boolean not null default true,
  criado_em          timestamptz not null default now(),

  constraint slug_apenas_de_lideranca
    check (slug is null or nivel = 'lideranca'),

  -- Quem vota fora do município não tem colégio daqui, e fica fora de todo
  -- cálculo territorial (PRD 7.4).
  constraint fora_do_municipio_sem_local
    check (not fora_do_municipio or local_votacao_id is null),

  constraint nao_indica_a_si_mesma
    check (indicado_por is null or indicado_por <> id)
);

comment on table public.pessoas is
  'Base inteira: coordenação, lideranças e apoiadores. nivel é coluna, não tabela.';
comment on column public.pessoas.telefone is
  'Somente dígitos, com 55. Chave única global. Primeiro cadastro prevalece.';
comment on column public.pessoas.indicado_por is
  'Quem trouxe a pessoa. É a razão de o sistema existir.';
comment on column public.pessoas.local_votacao_id is
  'Onde a pessoa vota. Para liderança, é o local âncora: onde ela ATUA, que pode não ser onde mora.';

-- RNF-08: índices obrigatórios.
create index if not exists pessoas_indicado_por_idx     on public.pessoas (indicado_por);
create index if not exists pessoas_local_votacao_id_idx on public.pessoas (local_votacao_id);
create index if not exists pessoas_bairro_moradia_idx   on public.pessoas (bairro_moradia_id);
create index if not exists pessoas_criado_em_idx        on public.pessoas (criado_em desc);
create index if not exists pessoas_nivel_idx            on public.pessoas (nivel) where ativo;
create index if not exists pessoas_instagram_handle_idx on public.pessoas (instagram_handle);

-- ── tags ───────────────────────────────────────────────────────────────────
-- Atributo declarado pela coordenação. Não é temperatura (que é calculada) e
-- não é território (que é derivado do local de votação).
create table if not exists public.tags (
  id    uuid primary key default gen_random_uuid(),
  nome  text not null unique check (length(btrim(nome)) >= 2),
  cor   text
);

create table if not exists public.pessoa_tags (
  pessoa_id  uuid not null references public.pessoas (id) on delete cascade,
  tag_id     uuid not null references public.tags (id)    on delete cascade,
  primary key (pessoa_id, tag_id)
);

create index if not exists pessoa_tags_tag_id_idx on public.pessoa_tags (tag_id);

insert into public.tags (nome) values
  ('Igreja'), ('Comércio'), ('Mototáxi'), ('Saúde'), ('Educação'),
  ('Associação de moradores'), ('Esporte'), ('Família'), ('Servidor público')
on conflict (nome) do nothing;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.pessoas     enable row level security;
alter table public.tags        enable row level security;
alter table public.pessoa_tags enable row level security;

drop policy if exists "pessoas_leitura" on public.pessoas;
create policy "pessoas_leitura"
  on public.pessoas for select to authenticated using (true);

drop policy if exists "pessoas_insercao" on public.pessoas;
create policy "pessoas_insercao"
  on public.pessoas for insert to authenticated with check (true);

drop policy if exists "pessoas_edicao" on public.pessoas;
create policy "pessoas_edicao"
  on public.pessoas for update to authenticated using (true) with check (true);

-- Excluir pessoa apaga histórico de atribuição. Só a coordenação.
drop policy if exists "pessoas_exclusao" on public.pessoas;
create policy "pessoas_exclusao"
  on public.pessoas for delete to authenticated
  using (public.papel_atual() = 'coordenacao');

drop policy if exists "tags_leitura" on public.tags;
create policy "tags_leitura" on public.tags for select to authenticated using (true);

drop policy if exists "tags_escrita" on public.tags;
create policy "tags_escrita" on public.tags for all to authenticated
  using (true) with check (true);

drop policy if exists "pessoa_tags_leitura" on public.pessoa_tags;
create policy "pessoa_tags_leitura" on public.pessoa_tags for select to authenticated using (true);

drop policy if exists "pessoa_tags_escrita" on public.pessoa_tags;
create policy "pessoa_tags_escrita" on public.pessoa_tags for all to authenticated
  using (true) with check (true);

-- RF-02: operador não edita meta. Como RLS não distingue coluna, a regra é
-- trigger — e continua sendo regra de banco, não de tela.
create or replace function public.bloquear_edicao_de_meta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.meta is distinct from old.meta and public.papel_atual() = 'operador' then
    raise exception 'Apenas a coordenação altera a meta de uma liderança.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists pessoas_bloqueia_meta on public.pessoas;
create trigger pessoas_bloqueia_meta
  before update on public.pessoas
  for each row execute function public.bloquear_edicao_de_meta();

-- RF-04: o slug trava depois do primeiro cadastro recebido, porque o link já
-- circulou. Trocar depois disso quebra o que está no WhatsApp de terceiros.
create or replace function public.travar_slug_apos_primeiro_cadastro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is distinct from old.slug
     and exists (select 1 from public.pessoas where indicado_por = old.id) then
    raise exception 'O link desta liderança já circulou e já trouxe cadastro. O endereço não muda mais.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists pessoas_trava_slug on public.pessoas;
create trigger pessoas_trava_slug
  before update on public.pessoas
  for each row execute function public.travar_slug_apos_primeiro_cadastro();
