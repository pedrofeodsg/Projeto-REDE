-- Bloco 2 · os 4 checks de integridade do seed (PRD, Seção 6.3)
--
-- Escritos como função para existirem em um lugar só: `npm run validate:seed`
-- chama esta função antes do build, e a tela /territorio mostra o mesmo
-- resultado. Se um dia divergirem, é porque alguém duplicou a regra.
--
-- Penetração é uma divisão. Denominador errado contamina toda decisão
-- territorial, e o erro é silencioso: o número aparece bonito e está errado.

create or replace function public.validar_seed()
returns table (
  verificacao text,
  ok          boolean,
  esperado    text,
  encontrado  text,
  detalhe     text
)
language sql
stable
security invoker
set search_path = public
as $$
  -- 1. A soma dos bairros fecha com o município.
  select
    'soma dos bairros'::text,
    coalesce(sum(eleitores), 0) = 75083,
    '75083'::text,
    coalesce(sum(eleitores), 0)::text,
    format('%s bairros cadastrados', count(*))::text
  from public.bairros

  union all

  -- 2. A soma dos locais fecha com o município.
  select
    'soma dos locais',
    coalesce(sum(eleitores), 0) = 75083,
    '75083',
    coalesce(sum(eleitores), 0)::text,
    format('%s locais cadastrados', count(*))
  from public.locais_votacao

  union all

  -- 3. A soma dos locais de cada bairro fecha com o total do bairro.
  select
    'locais fecham com o bairro',
    count(*) = 0,
    '0 bairros divergentes',
    format('%s divergente(s)', count(*)),
    coalesce(string_agg(nome || ' (' || esperado || ' <> ' || somado || ')', ', '), 'todos conferem')
  from (
    select
      b.nome,
      b.eleitores as esperado,
      coalesce(sum(l.eleitores), 0) as somado
    from public.bairros b
    left join public.locais_votacao l on l.bairro_id = b.id
    group by b.id, b.nome, b.eleitores
    having b.eleitores <> coalesce(sum(l.eleitores), 0)
  ) divergentes

  union all

  -- 4. A soma das seções fecha com o total da zona.
  select
    'soma das seções',
    coalesce(sum(secoes), 0) = 252,
    '252',
    coalesce(sum(secoes), 0)::text,
    format('%s locais sem seção informada', count(*) filter (where secoes = 0))
  from public.locais_votacao

  union all

  -- Extra: a região do local tem que ser a mesma do bairro dele.
  select
    'região do local bate com a do bairro',
    count(*) = 0,
    '0 divergentes',
    format('%s divergente(s)', count(*)),
    coalesce(string_agg(nome, ', '), 'todos conferem')
  from (
    select l.nome
    from public.locais_votacao l
    join public.bairros b on b.id = l.bairro_id
    where l.regiao <> b.regiao
  ) regiao_errada;
$$;

revoke execute on function public.validar_seed() from anon;
grant execute on function public.validar_seed() to authenticated;
