-- Bloco 4 · Território · RF-14, RF-15, RF-20 a RF-23
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.
--
-- REGRA QUE ATRAVESSA TUDO AQUI: quem tem fora_do_municipio = true entra no
-- total geral e no crédito da liderança, e fica FORA de todo cálculo
-- territorial. Como essas pessoas têm local_votacao_id nulo, elas simplesmente
-- não entram nos joins abaixo — mas isso é consequência, não descuido.
--
-- SEGUNDA REGRA: penetração conta APOIADORES, não a base inteira. O
-- local_votacao_id de uma liderança é o colégio onde ela ATUA, que pode não
-- ser onde ela vota; contá-la como cadastro dela mesma inflaria justamente os
-- colégios pequenos, que são os que mais enganam.

-- ── penetração por bairro (RF-21) ──────────────────────────────────────────
create or replace view public.v_penetracao_bairro
with (security_invoker = on)
as
select
  b.id,
  b.nome,
  b.regiao,
  b.eleitores,
  coalesce(a.cadastros, 0)                                  as cadastros,
  round(100.0 * coalesce(a.cadastros, 0) / nullif(b.eleitores, 0), 3) as penetracao_pct,
  coalesce(li.liderancas, 0)                                as liderancas,
  coalesce(lo.locais, 0)                                    as locais
from public.bairros b
left join lateral (
  select count(*) as cadastros
    from public.pessoas p
    join public.locais_votacao l on l.id = p.local_votacao_id
   where l.bairro_id = b.id
     and p.nivel = 'apoiador'
     and p.ativo
     and not p.fora_do_municipio
) a on true
left join lateral (
  select count(*) as liderancas
    from public.pessoas p
    join public.locais_votacao l on l.id = p.local_votacao_id
   where l.bairro_id = b.id
     and p.nivel = 'lideranca'
     and p.ativo
) li on true
left join lateral (
  select count(*) as locais
    from public.locais_votacao l
   where l.bairro_id = b.id
) lo on true;

comment on view public.v_penetracao_bairro is
  'Volume absoluto mente: 50 cadastros em São João é 0,6%; em Três Vendas seria 37%. A tela ordena por penetração CRESCENTE, porque existe para mostrar onde falta.';

-- ── penetração por colégio, com as anomalias (RF-22) ───────────────────────
create or replace view public.v_penetracao_local
with (security_invoker = on)
as
select
  l.id,
  l.nome,
  l.endereco,
  l.regiao,
  l.eleitores,
  l.secoes,
  b.id   as bairro_id,
  b.nome as bairro_nome,
  coalesce(a.cadastros, 0)                                  as cadastros,
  round(100.0 * coalesce(a.cadastros, 0) / nullif(l.eleitores, 0), 3) as penetracao_pct,
  coalesce(anc.liderancas, 0)                               as liderancas_ancora,
  -- Buraco e sobreposição não são erros, são informação. Sobreposição em São
  -- João (8.384 eleitores) é adequada; em Sapeatiba Mirim (55) é desperdício
  -- de duas lideranças. A tela mostra o dado, a decisão é humana.
  (l.eleitores >= 2000 and coalesce(anc.liderancas, 0) = 0) as buraco,
  (coalesce(anc.liderancas, 0) >= 2)                        as sobreposicao
from public.locais_votacao l
join public.bairros b on b.id = l.bairro_id
left join lateral (
  select count(*) as cadastros
    from public.pessoas p
   where p.local_votacao_id = l.id
     and p.nivel = 'apoiador'
     and p.ativo
     and not p.fora_do_municipio
) a on true
left join lateral (
  select count(*) as liderancas
    from public.pessoas p
   where p.local_votacao_id = l.id
     and p.nivel = 'lideranca'
     and p.ativo
) anc on true;

-- ── cobertura por macro-região (RF-23) ─────────────────────────────────────
create or replace view public.v_cobertura_regiao
with (security_invoker = on)
as
with totais as (
  select
    sum(eleitores)::numeric                                     as eleitorado_total,
    (select count(*) from public.pessoas
      where nivel = 'apoiador' and ativo and not fora_do_municipio
        and local_votacao_id is not null)::numeric              as cadastros_total
  from public.bairros
)
select
  b.regiao,
  sum(b.eleitores)                                              as eleitores,
  round(100.0 * sum(b.eleitores) / nullif(t.eleitorado_total, 0), 1) as eleitorado_pct,
  coalesce(sum(a.cadastros), 0)                                 as cadastros,
  round(100.0 * coalesce(sum(a.cadastros), 0) / nullif(t.cadastros_total, 0), 1) as cadastros_pct,
  round(
    100.0 * coalesce(sum(a.cadastros), 0) / nullif(t.cadastros_total, 0)
    - 100.0 * sum(b.eleitores) / nullif(t.eleitorado_total, 0)
  , 1)                                                          as desvio_pp
from public.bairros b
cross join totais t
left join lateral (
  select count(*) as cadastros
    from public.pessoas p
    join public.locais_votacao l on l.id = p.local_votacao_id
   where l.bairro_id = b.id
     and p.nivel = 'apoiador'
     and p.ativo
     and not p.fora_do_municipio
) a on true
group by b.regiao, t.eleitorado_total, t.cadastros_total
order by b.regiao;

comment on view public.v_cobertura_regiao is
  'Realizado contra a proporção real do eleitorado. Desvio acima de 10 pontos percentuais é desequilíbrio (PRD 9.4).';

-- ── ranking semanal (RF-20) ────────────────────────────────────────────────
-- Por NOVOS na semana, não por total acumulado. Total acumulado premia quem
-- tem agenda grande e cristaliza o ranking em duas semanas; novos na semana
-- muda toda segunda e mantém a disputa viva.
create or replace view public.v_ranking_semanal
with (security_invoker = on)
as
select
  p.id,
  p.nome,
  coalesce(s.novos, 0) as novos_na_semana,
  coalesce(tot.cadastros, 0) as cadastros
from public.pessoas p
left join lateral (
  select count(*) as novos
    from public.pessoas i
   where i.indicado_por = p.id
     and i.ativo
     and i.criado_em > now() - interval '7 days'
) s on true
left join lateral (
  select count(*) as cadastros
    from public.pessoas i
   where i.indicado_por = p.id and i.ativo
) tot on true
where p.nivel = 'lideranca' and p.ativo
order by novos_na_semana desc, cadastros desc;

-- ── selos de volume (RF-15) ────────────────────────────────────────────────
-- Recria v_liderancas acrescentando a coluna `selo` no fim.
drop view if exists public.v_liderancas;

create view public.v_liderancas
with (security_invoker = on)
as
select
  p.id,
  p.nome,
  p.telefone,
  p.slug,
  p.meta,
  p.ativo,
  p.linha_pessoal,
  p.instagram_handle,
  p.local_votacao_id,
  l.nome  as local_nome,
  l.regiao,
  b.id    as bairro_id,
  b.nome  as bairro_nome,
  coalesce(c.cadastros, 0)                              as cadastros,
  c.ultimo_cadastro,
  e.enviado_em,
  greatest(coalesce(p.meta, 0) - coalesce(c.cadastros, 0), 0) as faltam,
  case
    when e.enviado_em is null then null
    else floor(extract(epoch from (now() - coalesce(c.ultimo_cadastro, e.enviado_em))) / 86400)::integer
  end as dias_parada,
  public.calcular_temperatura(p.id) as estado,
  -- 10 é a meta, 50 e 100 são os patamares da Rede 100x10.
  case
    when coalesce(c.cadastros, 0) >= 100 then 100
    when coalesce(c.cadastros, 0) >= 50  then 50
    when coalesce(c.cadastros, 0) >= 10  then 10
    else 0
  end as selo
from public.pessoas p
left join public.locais_votacao l on l.id = p.local_votacao_id
left join public.bairros b        on b.id = l.bairro_id
left join lateral (
  select count(*) as cadastros, max(criado_em) as ultimo_cadastro
    from public.pessoas i
   where i.indicado_por = p.id and i.ativo
) c on true
left join lateral (
  select min(enviado_em) as enviado_em
    from public.envios v
   where v.pessoa_id = p.id and v.confirmado
) e on true
where p.nivel = 'lideranca';

comment on view public.v_liderancas is
  'Lista de trabalho: quem entregou, quem parou e há quantos dias. Nenhuma tela recalcula temperatura por conta própria.';

-- ── histórico de temperatura (RF-14) ───────────────────────────────────────
-- Permite ver quem está subindo e quem está caindo, não só onde está.
create table if not exists public.temperatura_historico (
  id            uuid primary key default gen_random_uuid(),
  pessoa_id     uuid not null references public.pessoas (id) on delete cascade,
  estado        public.temperatura_cadastro not null,
  cadastros     integer not null default 0,
  calculado_em  timestamptz not null default now()
);

create index if not exists temperatura_historico_pessoa_idx
  on public.temperatura_historico (pessoa_id, calculado_em desc);

alter table public.temperatura_historico enable row level security;

drop policy if exists "temperatura_historico_leitura" on public.temperatura_historico;
create policy "temperatura_historico_leitura"
  on public.temperatura_historico for select to authenticated using (true);

-- Nenhuma policy de escrita: quem grava é o job semanal, por service role.

/*
 * Grava o snapshot de todas as lideranças ativas.
 *
 * Chamada pela rota /api/cron/temperatura, disparada semanalmente pelo cron da
 * Vercel. Idempotente por dia: rodar duas vezes no mesmo dia não duplica linha,
 * porque o histórico é semanal e uma segunda escrita só sujaria a série.
 */
create or replace function public.gravar_snapshot_temperatura()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gravados integer;
begin
  insert into public.temperatura_historico (pessoa_id, estado, cadastros)
  select v.id, v.estado, v.cadastros
    from public.v_liderancas v
   where v.ativo
     and not exists (
       select 1 from public.temperatura_historico h
        where h.pessoa_id = v.id
          and h.calculado_em > date_trunc('day', now())
     );

  get diagnostics v_gravados = row_count;
  return v_gravados;
end;
$$;

revoke execute on function public.gravar_snapshot_temperatura() from anon, authenticated;
