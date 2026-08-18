-- Bloco 2 · Base Territorial · RF-01
--
-- O denominador do sistema. Sem ele o painel mostra volume, e volume mente:
-- 50 cadastros em São João (8.384 eleitores) e 50 em Três Vendas (136) parecem
-- iguais em qualquer planilha, sendo que o segundo é 61 vezes mais penetração.
--
-- Idempotente: no Bloco 2 a aplicação ainda é manual, pelo SQL Editor.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'macro_regiao' and n.nspname = 'public'
  ) then
    create type public.macro_regiao as enum ('R1', 'R2', 'R3');
  end if;
end
$$;

comment on type public.macro_regiao is
  'R1 Central (Sede) · R2 Leste · R3 Balneários/Noroeste. Agrupamento geográfico dos 40 locais, nenhum bairro dividido entre regiões.';

create table if not exists public.bairros (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  eleitores  integer not null check (eleitores >= 0),
  regiao     public.macro_regiao not null
);

create table if not exists public.locais_votacao (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  endereco   text,
  bairro_id  uuid not null references public.bairros (id) on delete restrict,
  eleitores  integer not null check (eleitores >= 0),
  secoes     integer not null check (secoes >= 0),
  regiao     public.macro_regiao not null,
  unique (bairro_id, nome)
);

create index if not exists locais_votacao_bairro_id_idx
  on public.locais_votacao (bairro_id);

comment on table public.bairros is
  'Seed imutável em produção. Fonte: TSE, eleitorado por local de votação, extração de 03/08/2026, 59ª ZE.';
comment on table public.locais_votacao is
  'Os 40 colégios eleitorais. O eleitor é contado no bairro do seu local de votação, que pode diferir do bairro onde mora.';

alter table public.bairros enable row level security;
alter table public.locais_votacao enable row level security;

-- Território é referência: quem está logado lê, ninguém escreve pela aplicação.
-- A superfície pública lê pelo cliente de service role, que não passa por RLS.
drop policy if exists "territorio_leitura_autenticada" on public.bairros;
create policy "territorio_leitura_autenticada"
  on public.bairros for select to authenticated using (true);

drop policy if exists "territorio_leitura_autenticada" on public.locais_votacao;
create policy "territorio_leitura_autenticada"
  on public.locais_votacao for select to authenticated using (true);

-- Nenhuma policy de insert, update ou delete. O seed entra por service role e
-- não existe tela de edição de território, por decisão.
