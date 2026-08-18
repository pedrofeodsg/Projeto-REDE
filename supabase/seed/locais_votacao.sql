-- Bloco 2 · seed dos 40 locais de votação
-- Gerado por `npm run seed:gerar` a partir de supabase/seed/fonte/territorio-tse.json.
-- NÃO editar à mão: a fonte é TSE · Dados Abertos · Eleitorado Atual · eleitorado_local_votacao_ATUAL.csv.
-- Extração de 03/08/2026 · São Pedro da Aldeia/RJ · 59ª ZE.

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'CIEP 272 - Gabriel Joaquim dos Santos (São João)', 'Estrada dos Passageiros, S/N', b.id, 4047, 12, 'R2'
from public.bairros b where b.nome = 'São João'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Colégio Estadual Dr. Feliciano Sodré', 'Rua Duque de Caxias, 78', b.id, 3928, 17, 'R1'
from public.bairros b where b.nome = 'Centro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Prof.ª Miriam Alves de Macedo Guimarães', 'Rodovia RJ 140, Km 21', b.id, 3747, 11, 'R1'
from public.bairros b where b.nome = 'Fluminense'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'CIEP 146 - Cordelino Teixeira Paulo (Estação)', 'Rua Doze de Outubro, S/N', b.id, 3571, 18, 'R1'
from public.bairros b where b.nome = 'Estação'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada José Guimarães', 'Rua Henrique Pinto Monteiro, S/N', b.id, 3365, 10, 'R1'
from public.bairros b where b.nome = 'Porto da Aldeia'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'FAETEC', 'Rua A, S/N', b.id, 3299, 10, 'R1'
from public.bairros b where b.nome = 'Nova São Pedro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Paineira', 'Rua Leci Pereira de Souza, S/N', b.id, 2875, 9, 'R3'
from public.bairros b where b.nome = 'Balneário São Pedro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Manoel Moraes da Silva', 'Estrada dos Passageiros, S/N', b.id, 2802, 9, 'R2'
from public.bairros b where b.nome = 'Campo Redondo'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Rubem Arruda Câmara', 'Rua das Violetas, S/N', b.id, 2692, 8, 'R1'
from public.bairros b where b.nome = 'Jardim Soledade'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Pequiá', 'Rua Fausto Ferreira Leite, S/N', b.id, 2654, 8, 'R3'
from public.bairros b where b.nome = 'Rua do Fogo'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Colégio Estadual José Rascão', 'Rua Professor Renato Fernandes, 40', b.id, 2527, 7, 'R1'
from public.bairros b where b.nome = 'São José'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Luiza Terra de Andrade', 'Rua Luiza Terra de Andrade, S/N', b.id, 2512, 7, 'R2'
from public.bairros b where b.nome = 'Campo Redondo'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Vinhateiro', 'Estrada dos Passageiros, S/N', b.id, 2300, 7, 'R2'
from public.bairros b where b.nome = 'Vinhateiro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Profª. Dulcinda Jotta Mendes', 'Rua Carlinda, S/N', b.id, 2229, 7, 'R2'
from public.bairros b where b.nome = 'São João'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Prof.ª Maria da Glória dos Santos Motta', 'Alameda Maria Dulce, Qd C - Lote 8', b.id, 2217, 7, 'R3'
from public.bairros b where b.nome = 'Praia Linda'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Flonete Alexandrino da Silva', 'Estrada do Boqueirão, S/N', b.id, 2117, 7, 'R1'
from public.bairros b where b.nome = 'Poço Fundo'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Dulce Jotta de Souza', 'Rua Euclides da Cunha, 181', b.id, 2108, 7, 'R2'
from public.bairros b where b.nome = 'São João'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Colégio Estadual Almirante Tamandaré', 'Rua Júlio Soares Macedo, 154', b.id, 1847, 10, 'R2'
from public.bairros b where b.nome = 'Baixo Grande'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Centro Educacional Missão de São Pedro', 'Rua João Martins, 39', b.id, 1833, 5, 'R1'
from public.bairros b where b.nome = 'Centro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Vidal de Negreiros', 'Rua Quaresma, 30', b.id, 1795, 5, 'R2'
from public.bairros b where b.nome = 'Alecrim'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal José Teixeira Paulo', 'Rua Francisco Orlando, 740', b.id, 1787, 5, 'R3'
from public.bairros b where b.nome = 'Balneário das Conchas'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Horto-Escola Artesanal', 'Rodovia Amaral Peixoto Km 107, S/N', b.id, 1784, 5, 'R3'
from public.bairros b where b.nome = 'Balneário São Pedro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Antonio Rodrigues dos Santos', 'Rua Silvino Pereira Damasceno, S/N', b.id, 1659, 5, 'R2'
from public.bairros b where b.nome = 'Porto do Carro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Vital Brasil', 'Rua Antonio Araujo Mendonça, 704', b.id, 1644, 5, 'R2'
from public.bairros b where b.nome = 'Ponta do Ambrósio'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Prof.ª Carolina Nazareth Teixeira Pinheiro', 'Rua Santa Amélia, S/N', b.id, 1607, 5, 'R1'
from public.bairros b where b.nome = 'São José'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Prof.ª Maria Celeste de Campos', 'Avenida Maracanã, 366', b.id, 1548, 5, 'R2'
from public.bairros b where b.nome = 'Baixo Grande'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Francisco Paes de Carvalho Filho', 'Rua Apolinário Rodrigues Soares, S/N', b.id, 1477, 5, 'R1'
from public.bairros b where b.nome = 'Boqueirão'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Antônio Vaz da Silva', 'Rua Honório Sampaio, S/N', b.id, 1460, 5, 'R1'
from public.bairros b where b.nome = 'Recanto do Sol'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Casa de Apoio Sementes do Amanhã', 'Rua Laércio Francisco da Silva, 50', b.id, 1447, 5, 'R1'
from public.bairros b where b.nome = 'Mossoró'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Capitão Costa', 'Estrada da Cruz, S/N', b.id, 966, 3, 'R3'
from public.bairros b where b.nome = 'Cruz'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Lucinda Franciscone Medeiros', 'Estrada do Alecrim, 51', b.id, 955, 4, 'R2'
from public.bairros b where b.nome = 'Porto do Carro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Paulo Roberto Marinho', 'Rodovia Amaral Peixoto Km 115, S/N', b.id, 880, 3, 'R1'
from public.bairros b where b.nome = 'São Mateus'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Polo CEDERJ - São Pedro da Aldeia', 'Rua A, S/N', b.id, 729, 3, 'R1'
from public.bairros b where b.nome = 'Nova São Pedro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Quilombola Dona Rosa Geralda da Silveira', 'Estrada da Caveira. S/N', b.id, 703, 3, 'R1'
from public.bairros b where b.nome = 'Botafogo'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Retiro', 'Estrada do Retiro, 199', b.id, 635, 3, 'R2'
from public.bairros b where b.nome = 'Retiro'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Elízio Ignácio Rangel', 'Praia da Baleia, S/N', b.id, 588, 2, 'R1'
from public.bairros b where b.nome = 'Baleia'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Adalgisa da Silva Lobo', 'Estrada do Morro dos Milagres, 1614', b.id, 282, 1, 'R1'
from public.bairros b where b.nome = 'Morro do Milagre'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal São Francisco de Assis', 'Avenida Brasil, S/N', b.id, 276, 2, 'R2'
from public.bairros b where b.nome = 'Parque Arruda'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipalizada Elízio da Costa Moreira', 'Estrada das Três Vendas', b.id, 136, 1, 'R3'
from public.bairros b where b.nome = 'Três Vendas'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;

insert into public.locais_votacao (nome, endereco, bairro_id, eleitores, secoes, regiao)
select 'Escola Municipal Sapeatiba Mirim', 'Estrada de Sapeatiba Mirim, 2', b.id, 55, 1, 'R3'
from public.bairros b where b.nome = 'Sapeatiba Mirim'
on conflict (bairro_id, nome) do update
  set endereco  = excluded.endereco,
      eleitores = excluded.eleitores,
      secoes    = excluded.secoes,
      regiao    = excluded.regiao;
