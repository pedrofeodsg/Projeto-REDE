-- Bloco 1 · Fundação · RF-02
-- Autenticação da coordenação. Liderança e apoiador nunca autenticam.
--
-- Escrita de forma idempotente: no Bloco 1 a aplicação ainda é manual, pelo SQL
-- Editor, e rodar duas vezes tem que ser inofensivo.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'papel_operador' and n.nspname = 'public'
  ) then
    create type public.papel_operador as enum ('coordenacao', 'operador');
  end if;
end
$$;

create table if not exists public.operadores (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  papel      public.papel_operador not null default 'operador',
  criado_em  timestamptz not null default now()
);

comment on table public.operadores is
  'Quem tem login. coordenacao = acesso total. operador = sem exportação e sem edição de meta.';

alter table public.operadores enable row level security;

-- Cada operador enxerga apenas o próprio registro. As telas que precisarem
-- listar a equipe ganham policy própria no bloco que criar a tela.
drop policy if exists "operador_le_o_proprio_registro" on public.operadores;

create policy "operador_le_o_proprio_registro"
  on public.operadores
  for select
  to authenticated
  using (id = auth.uid());

-- Nenhuma policy de insert, update ou delete: a equipe é gerida pelo painel do
-- Supabase, e nenhum operador se promove sozinho.
