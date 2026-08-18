-- Bloco 3B · Captura Pública · RF-10 e RNF-17
--
-- Duas tabelas que só a superfície pública alimenta, e que nenhum apoiador
-- jamais enxerga.
--
-- Idempotente: a aplicação ainda é manual, pelo SQL Editor.

-- ── conflitos de cadastro ──────────────────────────────────────────────────
-- Telefone é chave única global. O segundo cadastro do mesmo número não cria
-- registro e não altera a atribuição existente: cai aqui, para arbitragem
-- privada e assíncrona da coordenação.
--
-- Duas lideranças descobrindo que disputam o mesmo contato geram um atrito que
-- chega na coordenação no pior momento possível. Por isso a tela devolve
-- sucesso neutro e a briga nunca acontece.
create table if not exists public.conflitos_cadastro (
  id                   uuid primary key default gen_random_uuid(),
  telefone             text not null check (telefone ~ '^55[0-9]{10,11}$'),
  nome_tentado         text not null,
  lideranca_tentou_id  uuid references public.pessoas (id) on delete set null,
  pessoa_existente_id  uuid references public.pessoas (id) on delete set null,
  resolvido            boolean not null default false,
  criado_em            timestamptz not null default now()
);

create index if not exists conflitos_cadastro_criado_em_idx
  on public.conflitos_cadastro (criado_em desc);
create index if not exists conflitos_cadastro_abertos_idx
  on public.conflitos_cadastro (resolvido) where not resolvido;

comment on table public.conflitos_cadastro is
  'Tentativas de recadastrar um telefone que já está na base. O primeiro cadastro prevalece; isto aqui é a fila de arbitragem.';

alter table public.conflitos_cadastro enable row level security;

drop policy if exists "conflitos_leitura" on public.conflitos_cadastro;
create policy "conflitos_leitura"
  on public.conflitos_cadastro for select to authenticated using (true);

drop policy if exists "conflitos_arbitragem" on public.conflitos_cadastro;
create policy "conflitos_arbitragem"
  on public.conflitos_cadastro for update to authenticated
  using (true) with check (true);

-- Nenhuma policy de insert: quem grava é a Server Action, por service role.

-- ── rate limit do cadastro público ─────────────────────────────────────────
-- RNF-17. O IP nunca é gravado em claro: chega já como HMAC, porque endereço
-- de IP é dado pessoal e a base inteira é de dado sensível.
create table if not exists public.tentativas_cadastro (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  criado_em  timestamptz not null default now()
);

create index if not exists tentativas_cadastro_ip_idx
  on public.tentativas_cadastro (ip_hash, criado_em desc);

alter table public.tentativas_cadastro enable row level security;
-- Nenhuma policy: só service role toca nesta tabela.

comment on table public.tentativas_cadastro is
  'Janela deslizante do rate limit da página pública. Guarda HMAC do IP, nunca o IP.';

/*
 * Conta, decide e registra em uma transação só.
 *
 * O limite é generoso de propósito: a liderança que cadastra dez pessoas
 * seguidas no próprio celular, numa caminhada, é o comportamento que o sistema
 * mais quer. Quem o limite precisa parar é script, e script não preenche
 * quatro campos em vinte segundos.
 */
create or replace function public.registrar_tentativa_cadastro(
  p_ip_hash text,
  p_limite  integer  default 30,
  p_janela  interval default '15 minutes'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tentativas integer;
begin
  -- Faxina oportunista: a tabela nunca cresce sem limite.
  delete from public.tentativas_cadastro
   where criado_em < now() - interval '2 hours';

  select count(*) into v_tentativas
    from public.tentativas_cadastro
   where ip_hash = p_ip_hash
     and criado_em > now() - p_janela;

  if v_tentativas >= p_limite then
    return false;
  end if;

  insert into public.tentativas_cadastro (ip_hash) values (p_ip_hash);
  return true;
end;
$$;

revoke execute on function public.registrar_tentativa_cadastro(text, integer, interval) from anon, authenticated;
