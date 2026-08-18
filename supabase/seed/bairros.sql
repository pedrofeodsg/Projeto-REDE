-- Bloco 2 · seed dos 31 bairros
-- Gerado por `npm run seed:gerar` a partir de supabase/seed/fonte/territorio-tse.json.
-- NÃO editar à mão: a fonte é TSE · Dados Abertos · Eleitorado Atual · eleitorado_local_votacao_ATUAL.csv.
-- Extração de 03/08/2026 · São Pedro da Aldeia/RJ · 59ª ZE.

insert into public.bairros (nome, eleitores, regiao) values
  ('São João', 8384, 'R2'),
  ('Centro', 5761, 'R1'),
  ('Campo Redondo', 5314, 'R2'),
  ('Balneário São Pedro', 4659, 'R3'),
  ('São José', 4134, 'R1'),
  ('Nova São Pedro', 4028, 'R1'),
  ('Fluminense', 3747, 'R1'),
  ('Estação', 3571, 'R1'),
  ('Baixo Grande', 3395, 'R2'),
  ('Porto da Aldeia', 3365, 'R1'),
  ('Jardim Soledade', 2692, 'R1'),
  ('Rua do Fogo', 2654, 'R3'),
  ('Porto do Carro', 2614, 'R2'),
  ('Vinhateiro', 2300, 'R2'),
  ('Praia Linda', 2217, 'R3'),
  ('Poço Fundo', 2117, 'R1'),
  ('Alecrim', 1795, 'R2'),
  ('Balneário das Conchas', 1787, 'R3'),
  ('Ponta do Ambrósio', 1644, 'R2'),
  ('Boqueirão', 1477, 'R1'),
  ('Recanto do Sol', 1460, 'R1'),
  ('Mossoró', 1447, 'R1'),
  ('Cruz', 966, 'R3'),
  ('São Mateus', 880, 'R1'),
  ('Botafogo', 703, 'R1'),
  ('Retiro', 635, 'R2'),
  ('Baleia', 588, 'R1'),
  ('Morro do Milagre', 282, 'R1'),
  ('Parque Arruda', 276, 'R2'),
  ('Três Vendas', 136, 'R3'),
  ('Sapeatiba Mirim', 55, 'R3')
on conflict (nome) do update
  set eleitores = excluded.eleitores,
      regiao    = excluded.regiao;
