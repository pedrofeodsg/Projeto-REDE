# Dados territoriais complementares

Extraído do relatório *Análise do Eleitorado · São Pedro da Aldeia/RJ · Eleições
2026* (Núcleo de Inteligência e Dados, agosto de 2026), que traz informação que
o PRD não carrega. Fonte primária: TSE, cadastro ativo, extração de 03/08/2026,
59ª Zona Eleitoral.

Este arquivo alimenta o seed do Bloco 2. Nada aqui vai hardcoded em componente.

---

## 1. Endereços dos 15 maiores locais

Preenchem a coluna `endereco` de `locais_votacao`. Cobrem 59,6% do eleitorado.
Os outros 25 locais seguem sem endereço até levantamento no TSE.

| # | Local | Endereço |
|---|---|---|
| 1 | CIEP 272 Gabriel Joaquim dos Santos | Estrada dos Passageiros, S/N |
| 2 | C.E. Dr. Feliciano Sodré | Rua Duque de Caxias, 78 |
| 3 | E.M. Prof.ª Miriam Alves de Macedo Guimarães | Rodovia RJ 140, Km 21 |
| 4 | CIEP 146 Cordelino Teixeira Paulo | Rua Doze de Outubro, S/N |
| 5 | E. Municipalizada José Guimarães | Rua Henrique Pinto Monteiro, S/N |
| 6 | FAETEC | Rua A, S/N |
| 7 | E. Municipalizada Paineira | Rua Leci Pereira de Souza, S/N |
| 8 | E.M. Manoel Moraes da Silva | Estrada dos Passageiros, S/N |
| 9 | E.M. Rubem Arruda Câmara | Rua das Violetas, S/N |
| 10 | E. Municipalizada Pequiá | Rua Fausto Ferreira Leite, S/N |
| 11 | C.E. José Rascão | Rua Professor Renato Fernandes, 40 |
| 12 | E.M. Luiza Terra de Andrade | Rua Luiza Terra de Andrade, S/N |
| 13 | E.M. Vinhateiro | Estrada dos Passageiros, S/N |
| 14 | E.M. Prof.ª Dulcinda Jotta Mendes | Rua Carlinda, S/N |
| 15 | E.M. Prof.ª Maria da Glória dos Santos Motta | Alameda Maria Dulce, Qd C - Lote 8 |

---

## 2. Os 7 locais faltantes — indícios de nome

A Seção 5 do relatório cita, de passagem, três locais que **não estão** entre os
33 confirmados. São indício forte, não confirmação: o relatório não diz o
eleitorado nem o bairro deles.

| Bairro | Eleitores | Nome provável | De onde vem o indício |
|---|---|---|---|
| São João | 2.108 | **E.M. Dulce Jotta** | Citada ao lado da Dulcinda Jotta como pico feminino em São João (55,8% e 55,5%). São dois locais distintos, e só a Dulcinda está nos 33 confirmados. |
| Nova São Pedro | 729 | **Polo Cederj** | Citado com 35,1% de ensino superior. Bate com o perfil de Nova São Pedro no PRD. |
| Centro | 1.833 | **Horto-Escola** | Citado com 27,9% de ensino superior, na mesma lista de formadores de opinião. |
| Balneário São Pedro | 1.784 | a levantar | — |
| São José | 1.607 | a levantar | — |
| Baixo Grande | 1.548 | a levantar | — |
| Porto do Carro | 955 | a levantar | — |

O seed entra com `provisorio = true` e nome no formato `A LEVANTAR · <Bairro>`,
como manda o guia. Os nomes acima ficam aqui para encurtar a consulta ao TSE.
Quando confirmados, é `UPDATE` no nome e `provisorio = false`, **sem tocar em
número**.

---

## 3. Seções: 147 de 252 conhecidas

O relatório só publica o número de seções dos 15 maiores locais, que somam
**147**. Faltam **105 seções distribuídas em 25 locais** — os 18 do anexo e os 7
provisórios.

Isso torna impossível, hoje, o check nº 4 do seed (`SUM(secoes) = 252`) sem
inventar número. A seção é a chave do cruzamento com o boletim de urna no Bloco
8, então número inventado aqui contamina a única prova de que a rede virou voto.

Seções conhecidas, por local:

| Local | Seções |
|---|---|
| CIEP 146 Cordelino Teixeira Paulo | 18 |
| C.E. Dr. Feliciano Sodré | 17 |
| CIEP 272 Gabriel Joaquim dos Santos | 12 |
| E.M. Prof.ª Miriam Alves de Macedo Guimarães | 11 |
| E. Municipalizada José Guimarães | 10 |
| FAETEC | 10 |
| E. Municipalizada Paineira | 9 |
| E.M. Manoel Moraes da Silva | 9 |
| E.M. Rubem Arruda Câmara | 8 |
| E. Municipalizada Pequiá | 8 |
| C.E. José Rascão | 7 |
| E.M. Luiza Terra de Andrade | 7 |
| E.M. Vinhateiro | 7 |
| E.M. Prof.ª Dulcinda Jotta Mendes | 7 |
| E.M. Prof.ª Maria da Glória dos Santos Motta | 7 |
| **Soma** | **147** |

---

## 4. Perfil das macro-regiões

Não entra no seed. Serve de leitura para a coordenação decidir onde e como
falar, e para calibrar a distribuição das 70 lideranças.

| | R1 Central | R2 Leste | R3 Balneários/Noroeste |
|---|---|---|---|
| Eleitores | 36.252 (48,3%) | 26.357 (35,1%) | 12.474 (16,6%) |
| Locais | 18 | 14 | 8 |
| Feminino | 52,5% | 52,8% | 53,2% |
| Jovens 16–24 | 11,2% | 12,2% | 11,1% |
| Idosos 65+ | 20,2% | 16,1% | 16,2% |
| Ensino superior | 15,6% | 7,7% | 12,5% |
| Voto facultativo | 15,0% | 12,5% | 12,5% |

---

## 5. Perfil do município

Calibra a linguagem da página pública (RNF-22).

- **52,7% mulheres.** O eleitor mediano é mulher, 25–54 anos, ensino médio.
- **Escolaridade:** 48,3% ensino médio · 31,0% fundamental · 12,3% superior ·
  8,3% sem instrução formal. Frase curta e palavra comum não é preferência de
  estilo, é requisito.
- **Faixa etária:** 16–24 11,5% · 25–34 18,4% · 35–44 17,8% · 45–54 18,3% ·
  55–64 16,0% · 65+ 18,1%.
- **13,7% com voto facultativo**, o que inclui todos acima de 70 anos.
- **Estado civil:** 61,4% solteiros · 31,8% casados · 4,0% divorciados.
