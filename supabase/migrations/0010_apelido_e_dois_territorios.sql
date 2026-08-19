-- Apelido, e a separação entre território de VOTO e território de TRABALHO
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE MODELO (18/08/2026, decisão do Pedro)
--
-- O PRD tratava `local_votacao_id` da liderança como "colégio âncora", o lugar
-- onde ela ATUA. Na prática esse campo é subjetivo e não se responde com
-- honestidade: a mesma pessoa mora num bairro, vota em outro e trabalha num
-- terceiro.
--
-- As duas perguntas que se respondem sem hesitar, e que decidem coisas
-- diferentes, passam a ser:
--
--   ONDE VOTA  → unidade de VOTO. Quantos votos a rede pode ter naquele
--                colégio eleitoral. É o denominador da penetração.
--   ONDE MORA  → unidade de TRABALHO. Onde a pessoa circula e puxa gente.
--                É o que diz se um bairro tem alguém cuidando dele.
--
-- Estão correlacionadas e não são a mesma coisa. O sistema para de fingir que
-- são.
-- ═══════════════════════════════════════════════════════════════════════════

-- Cidade pequena: muita gente é conhecida só pelo apelido, e o nome de
-- registro não abre porta nenhuma.
alter table public.pessoas
  add column if not exists apelido text;

comment on column public.pessoas.apelido is
  'Como a cidade chama a pessoa. Entra na busca e no convite público.';

create index if not exists pessoas_apelido_idx on public.pessoas (apelido);

comment on column public.pessoas.local_votacao_id is
  'Onde a pessoa VOTA. Unidade de estimativa de voto.';
comment on column public.pessoas.bairro_moradia_id is
  'Onde a pessoa MORA. Unidade de trabalho: é o bairro que ela cobre no dia a dia.';

-- ── as views que mudam de forma ────────────────────────────────────────────
-- `create or replace view` recusa renomear coluna, e v_penetracao_local troca
-- `liderancas_ancora` por dois campos com nomes novos. Derrubar antes é o que
-- permite a troca — e como o Supabase roda o script inteiro numa transação, um
-- erro aqui desfaria até o `add column` lá em cima.
--
-- Nenhuma outra view lê destas, então a ordem não importa.
drop view if exists public.v_penetracao_local;
drop view if exists public.v_penetracao_bairro;
drop view if exists public.v_demandas;

-- ── penetração por bairro ──────────────────────────────────────────────────
-- `cadastros` continua vindo de onde a pessoa VOTA: é estimativa de voto.
-- `liderancas` passa a vir de onde a pessoa MORA: é cobertura de trabalho.
create view public.v_penetracao_bairro
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
  -- Quem MORA aqui. Trabalho de bairro se faz morando no bairro.
  select count(*) as liderancas
    from public.pessoas p
   where p.bairro_moradia_id = b.id
     and p.nivel = 'lideranca'
     and p.ativo
) li on true
left join lateral (
  select count(*) as locais
    from public.locais_votacao l
   where l.bairro_id = b.id
) lo on true;

comment on view public.v_penetracao_bairro is
  'cadastros vem de onde a pessoa vota (estimativa de voto). liderancas vem de onde a pessoa mora (cobertura de trabalho).';

-- ── penetração por colégio ─────────────────────────────────────────────────
-- O colégio é a unidade de VOTO. Duas contagens de liderança, com sentidos
-- diferentes e nomes que dizem qual é qual.
create view public.v_penetracao_local
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
  coalesce(vt.liderancas, 0)                                as liderancas_votam,
  coalesce(mo.liderancas, 0)                                as liderancas_no_bairro,
  -- Buraco: colégio grande num bairro onde ninguém da rede mora. Não é falta
  -- de liderança votando ali — é falta de gente cuidando daquele território.
  (l.eleitores >= 2000 and coalesce(mo.liderancas, 0) = 0)  as buraco,
  (coalesce(mo.liderancas, 0) >= 2)                         as sobreposicao
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
) vt on true
left join lateral (
  select count(*) as liderancas
    from public.pessoas p
   where p.bairro_moradia_id = b.id
     and p.nivel = 'lideranca'
     and p.ativo
) mo on true;

-- ── a lista de trabalho ────────────────────────────────────────────────────
-- Ganha `apelido`. O bairro passa a ser o de MORADIA, e a macro-região vem
-- dele — porque o filtro "minhas lideranças de igreja, frias, em R2" é uma
-- pergunta sobre trabalho, não sobre onde a pessoa vota.
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
  coalesce(bm.regiao, b.regiao) as regiao,
  coalesce(bm.id, b.id)         as bairro_id,
  coalesce(bm.nome, b.nome)     as bairro_nome,
  coalesce(c.cadastros, 0)                              as cadastros,
  c.ultimo_cadastro,
  e.enviado_em,
  greatest(coalesce(p.meta, 0) - coalesce(c.cadastros, 0), 0) as faltam,
  case
    when e.enviado_em is null then null
    else floor(extract(epoch from (now() - coalesce(c.ultimo_cadastro, e.enviado_em))) / 86400)::integer
  end as dias_parada,
  public.calcular_temperatura(p.id) as estado,
  case
    when coalesce(c.cadastros, 0) >= 100 then 100
    when coalesce(c.cadastros, 0) >= 50  then 50
    when coalesce(c.cadastros, 0) >= 10  then 10
    else 0
  end as selo,
  p.apelido
from public.pessoas p
left join public.locais_votacao l on l.id = p.local_votacao_id
left join public.bairros b        on b.id = l.bairro_id
left join public.bairros bm       on bm.id = p.bairro_moradia_id
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
  'bairro e macro-região vêm de onde a pessoa MORA; local_nome é onde ela VOTA.';

-- ── fila de demandas ───────────────────────────────────────────────────────
-- Mesmo raciocínio: o bairro de quem pede é onde ela mora.
create view public.v_demandas
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
  p.id       as pessoa_id,
  p.nome     as pessoa_nome,
  p.telefone as pessoa_telefone,
  p.nivel    as pessoa_nivel,
  coalesce(bm.nome, b.nome) as bairro_nome,
  o.nome     as responsavel_nome
from public.demandas d
join public.pessoas p on p.id = d.pessoa_id
left join public.locais_votacao l on l.id = p.local_votacao_id
left join public.bairros b        on b.id = l.bairro_id
left join public.bairros bm       on bm.id = p.bairro_moradia_id
left join public.operadores o     on o.id = d.responsavel;
