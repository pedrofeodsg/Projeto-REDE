-- Bloco 7 · Prestação de Contas · RF-39 a RF-41
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- INVARIANTE 8:
--
-- O perfil `candidato` NUNCA inclui telefone de apoiador, nem nome de
-- apoiador, mesmo que solicitado.
--
-- A base é o ativo de negociação da estrutura. No momento em que o candidato
-- tem os telefones, ele fala direto e a liderança local vira intermediário
-- dispensável. Isso não é desconfiança: é como a relação funciona, e estrutura
-- que entrega dado bruto perde o assento na mesa na eleição seguinte.
--
-- A trava real está no tipo, em lib/exportacao/perfis.ts, e num teste que
-- varre o payload inteiro atrás de qualquer coisa que pareça contato.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'perfil_exportacao' and n.nspname = 'public') then
    create type public.perfil_exportacao as enum ('interno', 'candidato', 'publico');
  end if;
end
$$;

create table if not exists public.exportacoes (
  id         uuid primary key default gen_random_uuid(),
  perfil     public.perfil_exportacao not null,
  operador   uuid references public.operadores (id) on delete set null,

  -- Não adivinhável: 32 bytes aleatórios em base64url, gerados no servidor.
  token      text not null unique,

  -- Arquivo circula e não volta. Link se revoga, e o dado nunca sai do
  -- servidor: o que o candidato recebe é uma janela, não uma cópia.
  revogado   boolean not null default false,

  rotulo     text,
  gerado_em  timestamptz not null default now(),
  visto_em   timestamptz,
  visitas    integer not null default 0
);

create index if not exists exportacoes_token_idx
  on public.exportacoes (token) where not revogado;
create index if not exists exportacoes_gerado_em_idx
  on public.exportacoes (gerado_em desc);

comment on table public.exportacoes is
  'Auditoria de todo link de prestação de contas gerado, e o interruptor para desligar cada um.';

alter table public.exportacoes enable row level security;

-- RF-02: operador não exporta. Só a coordenação.
drop policy if exists "exportacoes_coordenacao" on public.exportacoes;
create policy "exportacoes_coordenacao" on public.exportacoes
  for all to authenticated
  using (public.papel_atual() = 'coordenacao')
  with check (public.papel_atual() = 'coordenacao');

-- Nenhuma policy para anon: a rota /r/[token] lê por service role, no
-- servidor, e nada do Supabase chega ao navegador.

-- ── curva semanal (PRD 8.4) ────────────────────────────────────────────────
create or replace view public.v_curva_semanal
with (security_invoker = on)
as
select
  date_trunc('week', criado_em)::date                              as semana,
  count(*)                                                          as novos,
  sum(count(*)) over (order by date_trunc('week', criado_em))       as acumulado
from public.pessoas
where nivel = 'apoiador' and ativo
group by date_trunc('week', criado_em)
order by 1;

comment on view public.v_curva_semanal is
  'Evolução do volume por semana. Alimenta a projeção até 4 de outubro no relatório.';
