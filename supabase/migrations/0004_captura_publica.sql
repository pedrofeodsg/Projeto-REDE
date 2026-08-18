-- Bloco 3B · Captura Pública · RF-10 e RNF-17
--
-- Duas tabelas que só a superfície pública alimenta, e que nenhum apoiador
-- jamais enxerga. Nenhuma função: a contagem do rate limit mora no TypeScript,
-- em lib/rate-limit.ts, porque a garantia não precisa ser transacional e um
-- objeto a menos é um passo manual a menos.
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

comment on table public.tentativas_cadastro is
  'Janela deslizante do rate limit da página pública. Guarda HMAC do IP, nunca o IP.';

alter table public.tentativas_cadastro enable row level security;
-- Nenhuma policy: só a service role toca nesta tabela.
