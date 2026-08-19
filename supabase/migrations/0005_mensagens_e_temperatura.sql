-- Bloco 3C · Mensagens e Temperatura · RF-13, RF-28 a RF-31
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'temperatura_cadastro' and n.nspname = 'public') then
    create type public.temperatura_cadastro as enum
      ('aguardando', 'afastado', 'frio', 'quente', 'muito_quente', 'engajado');
  end if;
end
$$;

-- ── templates ──────────────────────────────────────────────────────────────
-- Template é registro no banco, nunca hardcoded: cada mensagem nova que
-- exigisse deploy viraria copiar e colar no bloco de notas.
--
-- `chave` não está no PRD e foi acrescentada por necessidade: o bloco de
-- cobrança precisa carregar o template de cutucada sem depender do nome, que
-- a coordenação pode reescrever a qualquer momento.
create table if not exists public.templates_mensagem (
  id      uuid primary key default gen_random_uuid(),
  chave   text unique,
  nome    text not null,
  corpo   text not null,
  ativo   boolean not null default true,
  ordem   integer not null default 0
);

comment on column public.templates_mensagem.corpo is
  'Variáveis: {nome} {link_cadastro} {cadastrados} {meta} {faltam} {linha_pessoal}';

-- ── envios ─────────────────────────────────────────────────────────────────
-- O clique registra a ABERTURA do WhatsApp, não a confirmação de envio. Daí o
-- campo `confirmado` e o botão de "marcar como não enviado" no admin.
create table if not exists public.envios (
  id           uuid primary key default gen_random_uuid(),
  pessoa_id    uuid not null references public.pessoas (id) on delete cascade,
  template_id  uuid references public.templates_mensagem (id) on delete set null,
  operador     uuid references public.operadores (id) on delete set null,
  enviado_em   timestamptz not null default now(),
  confirmado   boolean not null default true
);

create index if not exists envios_pessoa_id_idx  on public.envios (pessoa_id, enviado_em desc);
create index if not exists envios_enviado_em_idx on public.envios (enviado_em desc);

comment on table public.envios is
  'Alimenta o contador de quem ainda não recebeu o link e faz os dias de inatividade contarem desde o envio, não desde o cadastro no admin.';

alter table public.templates_mensagem enable row level security;
alter table public.envios enable row level security;

drop policy if exists "templates_leitura" on public.templates_mensagem;
create policy "templates_leitura" on public.templates_mensagem
  for select to authenticated using (true);

drop policy if exists "templates_escrita" on public.templates_mensagem;
create policy "templates_escrita" on public.templates_mensagem
  for all to authenticated using (true) with check (true);

drop policy if exists "envios_leitura" on public.envios;
create policy "envios_leitura" on public.envios
  for select to authenticated using (true);

drop policy if exists "envios_escrita" on public.envios;
create policy "envios_escrita" on public.envios
  for all to authenticated using (true) with check (true);

-- ── os quatro templates iniciais ───────────────────────────────────────────
insert into public.templates_mensagem (chave, nome, corpo, ordem) values
(
  'boas_vindas',
  'Boas-vindas · entrega do link',
  'Olá {nome}, aqui é o Pedro Abreu.

Vou ser direto: eu não mandei essa mensagem para a cidade inteira. Essa mensagem é privada, e se você recebeu é porque vai fazer diferença nessa eleição e eu reconheço a sua importância para o nosso grupo.

{linha_pessoal}

A campanha começou e o tempo é curto. São menos de 50 dias até 4 de outubro, e eleição aqui se decide por margem apertada. Você sabe disso melhor do que ninguém.

Esta página de cadastro é exclusivamente sua. Todo apoiador que você cadastrar por ela fica registrado como seu:
{link_cadastro}

Nosso grupo sempre bateu recorde em toda eleição que disputou, e essa não vai ser diferente. Comece hoje com 10 nomes: família, vizinho, quem você conversa todo dia. Depois disso vem sozinho.

Não estou pedindo favor. Estou chamando você para dentro. Posso contar com você?',
  1
),
(
  'cutucada',
  'Cutucada · quem ainda não começou',
  '{nome}, tudo certo?

Te mandei sua página de cadastro há alguns dias e ela ainda não recebeu ninguém. Sei que a correria é grande, então vim lembrar.

Comece com 10 nomes que você conversa todo dia. Leva menos de um minuto por pessoa:
{link_cadastro}

Qualquer dúvida, me chama.',
  2
),
(
  'reconhecimento',
  'Reconhecimento · meta batida',
  '{nome}, passei aqui só para dizer uma coisa: você já trouxe {cadastrados} pessoas.

Isso não é pouco, e não passou despercebido. Obrigado de verdade.

Quem chegou até aqui costuma ir muito além. Seu link continua o mesmo:
{link_cadastro}',
  3
),
(
  'reativacao',
  'Reativação · parou no meio',
  '{nome}, você começou forte e parou.

Você já trouxe {cadastrados} e faltam {faltam} para a sua meta. Dá para fechar essa semana com duas ou três conversas.

Seu link:
{link_cadastro}

Conto com você.',
  4
)
on conflict (chave) do nothing;

-- ── motor de temperatura ───────────────────────────────────────────────────
/*
 * Lógica exata da Seção 9.2 do PRD.
 *
 * Três decisões embutidas, e a ordem entre elas é o que importa:
 *
 * 1. A checagem de ATIVA vem antes de qualquer faixa de volume. Uma liderança
 *    que trouxe 12 pessoas há três semanas e sumiu apareceria como "muito
 *    quente" estando morta. Volume sem recência é placar histórico.
 *
 * 2. "Aguardando" existe para a estreia: no dia em que o sistema sobe, as 70
 *    lideranças têm zero cadastros, e sem esse estado o painel abre com 70
 *    linhas vermelhas justamente na semana em que o alerta precisa funcionar.
 *
 * 3. "Engajado" exige constância, não pico. Quem despeja 25 contatos da agenda
 *    num sábado esvaziou a lista; quem traz 4 por semana durante um mês está
 *    trabalhando a rede. Só o segundo justifica investir tempo de coordenação.
 *
 * Os dias contam desde o ENVIO do link, não desde o cadastro no admin: a
 * liderança que foi cadastrada há duas semanas e recebeu o link ontem não está
 * atrasada.
 */
create or replace function public.calcular_temperatura(p_pessoa_id uuid)
returns public.temperatura_cadastro
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_cadastros   integer;
  v_enviado_em  timestamptz;
  v_ultimo      timestamptz;
  v_dias_envio  numeric;
  v_dias_parada numeric;
  v_ativa       boolean;
  v_semanas     integer;
begin
  select count(*), max(criado_em)
    into v_cadastros, v_ultimo
    from public.pessoas
   where indicado_por = p_pessoa_id and ativo;

  select min(enviado_em) into v_enviado_em
    from public.envios
   where pessoa_id = p_pessoa_id and confirmado;

  if v_enviado_em is null then
    return 'aguardando';
  end if;

  v_dias_envio  := extract(epoch from (now() - v_enviado_em)) / 86400;
  v_dias_parada := coalesce(extract(epoch from (now() - v_ultimo)) / 86400, v_dias_envio);
  v_ativa       := v_dias_parada <= 10;

  if v_cadastros = 0 then
    return case when v_dias_envio < 5 then 'aguardando'::public.temperatura_cadastro
                else 'afastado'::public.temperatura_cadastro end;
  end if;

  if not v_ativa then
    return 'frio';
  end if;

  select count(distinct date_trunc('week', criado_em)) into v_semanas
    from public.pessoas
   where indicado_por = p_pessoa_id and ativo;

  if v_cadastros >= 20 and v_semanas >= 3 then return 'engajado';     end if;
  if v_cadastros >= 10                    then return 'muito_quente'; end if;
  if v_cadastros >= 5                     then return 'quente';       end if;

  return 'frio';
end;
$$;

-- ── a lista de trabalho da coordenação ─────────────────────────────────────
create or replace view public.v_liderancas
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
  public.calcular_temperatura(p.id) as estado
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
