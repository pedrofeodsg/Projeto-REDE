# Base territorial · São Pedro da Aldeia

Fonte primária: **TSE, Dados Abertos, "Eleitorado por local de votação — Atual"**,
arquivo `eleitorado_local_votacao_ATUAL.csv`, gerado em **03/08/2026** — a mesma
extração que originou o relatório de inteligência do gabinete.

O arquivo traz uma linha por seção eleitoral. Os números abaixo são a agregação
por local de votação: contagem de seções distintas e soma de `QT_ELEITOR_SECAO`.

Os nomes de local, bairro e endereço estão na caixa alta original do TSE.
A normalização para a grafia de exibição acontece na geração do seed.

O script que baixa o arquivo oficial e regrava este documento e o seed entra
junto com o seed, no Bloco 2, para que a base territorial seja auditável contra
a fonte a qualquer momento.

## Conferência contra o PRD

| Verificação | TSE | PRD | |
|---|---|---|---|
| Locais de votação | 40 | 40 | ✅ |
| Seções eleitorais | 252 | 252 | ✅ |
| Eleitores aptos | 75.083 | 75.083 | ✅ |
| Bairros | 31 | 31 | ✅ |
| Bairros com eleitorado divergente | 0 | — | ✅ |

Os 31 bairros fecham um a um com a tabela da Seção 6.3 do PRD. **Não há local
provisório e não há seção desconhecida**: o seed entra completo.

## Os 7 locais que o PRD listava como "a levantar"

| Bairro | Eleitores | Nome real | Palpite do PRD |
|---|---|---|---|
| São João | 2.108 | Escola Municipal Dulce Jotta de Souza | E.M. Dulce Jotta — **certo** |
| Centro | 1.833 | Centro Educacional Missão de São Pedro | Horto-Escola ou Polo Cederj — errado |
| Balneário São Pedro | 1.784 | Horto-Escola Artesanal | a levantar |
| São José | 1.607 | E.M. Prof.ª Carolina Nazareth Teixeira Pinheiro | a levantar |
| Baixo Grande | 1.548 | E.M. Prof.ª Maria Celeste de Campos | a levantar |
| Porto do Carro | 955 | Escola Municipalizada Lucinda Franciscone Medeiros | a levantar |
| Nova São Pedro | 729 | Polo Cederj — São Pedro da Aldeia | Polo Cederj — **certo** |

O Horto-Escola existe, mas fica em Balneário São Pedro, não no Centro.

## Os 40 locais de votação

| Local | Bairro | R | Eleitores | Seções | Endereço |
|---|---|---|---|---|---|
| CIEP 272 - GABRIEL JOAQUIM DOS SANTOS (SÃO JOÃO) | São João | R2 | 4.047 | 12 | ESTRADA DOS PASSAGEIROS, S/N |
| COLÉGIO ESTADUAL DR. FELICIANO SODRÉ | Centro | R1 | 3.928 | 17 | RUA DUQUE DE CAXIAS, 78 |
| ESCOLA MUNICIPAL PROF.ª MIRIAM ALVES DE MACEDO GUIMARÃES | Fluminense | R1 | 3.747 | 11 | RODOVIA RJ 140, KM 21 |
| CIEP 146 - CORDELINO TEIXEIRA PAULO (ESTAÇÃO) | Estação | R1 | 3.571 | 18 | RUA DOZE DE OUTUBRO, S/N |
| ESCOLA MUNICIPALIZADA JOSÉ GUIMARÃES | Porto da Aldeia | R1 | 3.365 | 10 | RUA HENRIQUE PINTO MONTEIRO, S/N |
| FAETEC | Nova São Pedro | R1 | 3.299 | 10 | RUA A, S/N |
| ESCOLA MUNICIPALIZADA PAINEIRA | Balneário São Pedro | R3 | 2.875 | 9 | RUA LECI PEREIRA DE SOUZA, S/N |
| ESCOLA MUNICIPAL MANOEL MORAES DA SILVA | Campo Redondo | R2 | 2.802 | 9 | ESTRADA DOS PASSAGEIROS, S/N |
| ESCOLA MUNICIPAL RUBEM ARRUDA CÂMARA | Jardim Soledade | R1 | 2.692 | 8 | RUA DAS VIOLETAS, S/N |
| ESCOLA MUNICIPALIZADA PEQUIÁ | Rua do Fogo | R3 | 2.654 | 8 | RUA FAUSTO FERREIRA LEITE, S/N |
| COLÉGIO ESTADUAL JOSÉ RASCÃO | São José | R1 | 2.527 | 7 | RUA PROFESSOR RENATO FERNANDES, 40 |
| ESCOLA MUNICIPAL LUIZA TERRA DE ANDRADE | Campo Redondo | R2 | 2.512 | 7 | RUA LUIZA TERRA DE ANDRADE, S/N |
| ESCOLA MUNICIPAL VINHATEIRO | Vinhateiro | R2 | 2.300 | 7 | ESTRADA DOS PASSAGEIROS, S/N |
| ESCOLA MUNICIPAL PROFª. DULCINDA JOTTA MENDES | São João | R2 | 2.229 | 7 | RUA CARLINDA, S/N |
| ESCOLA MUNICIPAL PROF.ª MARIA DA GLÓRIA DOS SANTOS MOTTA | Praia Linda | R3 | 2.217 | 7 | ALAMEDA MARIA DULCE, QD C - LOTE 8 |
| ESCOLA MUNICIPAL FLONETE ALEXANDRINO DA SILVA | Poço Fundo | R1 | 2.117 | 7 | ESTRADA DO BOQUEIRÃO, S/N |
| ESCOLA MUNICIPAL DULCE JOTTA DE SOUZA | São João | R2 | 2.108 | 7 | RUA EUCLIDES DA CUNHA, 181 |
| COLÉGIO ESTADUAL ALMIRANTE TAMANDARÉ | Baixo Grande | R2 | 1.847 | 10 | RUA JÚLIO SOARES MACEDO, 154 |
| CENTRO EDUCACIONAL MISSÃO DE SÃO PEDRO | Centro | R1 | 1.833 | 5 | RUA JOÃO MARTINS, 39 |
| ESCOLA MUNICIPAL VIDAL DE NEGREIROS | Alecrim | R2 | 1.795 | 5 | RUA QUARESMA, 30 |
| ESCOLA MUNICIPAL JOSÉ TEIXEIRA PAULO | Balneário das Conchas | R3 | 1.787 | 5 | RUA FRANCISCO ORLANDO, 740 |
| HORTO-ESCOLA ARTESANAL | Balneário São Pedro | R3 | 1.784 | 5 | RODOVIA AMARAL PEIXOTO KM 107, S/N |
| ESCOLA MUNICIPAL ANTONIO RODRIGUES DOS SANTOS | Porto do Carro | R2 | 1.659 | 5 | RUA SILVINO PEREIRA DAMASCENO, S/N |
| ESCOLA MUNICIPAL VITAL BRASIL | Ponta do Ambrósio | R2 | 1.644 | 5 | RUA ANTONIO ARAUJO MENDONÇA, 704 |
| ESCOLA MUNICIPAL PROF.ª CAROLINA NAZARETH TEIXEIRA PINHEIRO | São José | R1 | 1.607 | 5 | RUA SANTA AMÉLIA, S/N |
| ESCOLA MUNICIPAL PROF.ª MARIA CELESTE DE CAMPOS | Baixo Grande | R2 | 1.548 | 5 | AVENIDA MARACANÃ, 366 |
| ESCOLA MUNICIPAL FRANCISCO PAES DE CARVALHO FILHO | Boqueirão | R1 | 1.477 | 5 | RUA APOLINÁRIO RODRIGUES SOARES, S/N |
| ESCOLA MUNICIPAL ANTÔNIO VAZ DA SILVA | Recanto do Sol | R1 | 1.460 | 5 | RUA HONÓRIO SAMPAIO, S/N |
| CASA DE APOIO SEMENTES DO AMANHÃ | Mossoró | R1 | 1.447 | 5 | RUA LAÉRCIO FRANCISCO DA SILVA, 50 |
| ESCOLA MUNICIPAL CAPITÃO COSTA | Cruz | R3 | 966 | 3 | ESTRADA DA CRUZ, S/N |
| ESCOLA MUNICIPALIZADA LUCINDA FRANCISCONE MEDEIROS | Porto do Carro | R2 | 955 | 4 | ESTRADA DO ALECRIM, 51 |
| ESCOLA MUNICIPALIZADA PAULO ROBERTO MARINHO | São Mateus | R1 | 880 | 3 | RODOVIA AMARAL PEIXOTO KM 115, S/N |
| POLO CEDERJ - SÃO PEDRO DA ALDEIA | Nova São Pedro | R1 | 729 | 3 | RUA A, S/N |
| ESCOLA MUNICIPAL QUILOMBOLA DONA ROSA GERALDA DA SILVEIRA | Botafogo | R1 | 703 | 3 | ESTRADA DA CAVEIRA. S/N |
| ESCOLA MUNICIPALIZADA RETIRO | Retiro | R2 | 635 | 3 | ESTRADA DO RETIRO, 199 |
| ESCOLA MUNICIPAL ELÍZIO IGNÁCIO RANGEL | Baleia | R1 | 588 | 2 | PRAIA DA BALEIA, S/N |
| ESCOLA MUNICIPALIZADA ADALGISA DA SILVA LOBO | Morro do Milagre | R1 | 282 | 1 | ESTRADA DO MORRO DOS MILAGRES, 1614 |
| ESCOLA MUNICIPAL SÃO FRANCISCO DE ASSIS | Parque Arruda | R2 | 276 | 2 | AVENIDA BRASIL, S/N |
| ESCOLA MUNICIPALIZADA ELÍZIO DA COSTA MOREIRA | Três Vendas | R3 | 136 | 1 | ESTRADA DAS TRÊS VENDAS |
| ESCOLA MUNICIPAL SAPEATIBA MIRIM | Sapeatiba Mirim | R3 | 55 | 1 | ESTRADA DE SAPEATIBA MIRIM, 2 |

## Coordenadas

O arquivo do TSE traz latitude e longitude de cada local. Elas **não** entram no
schema do PRD, que não prevê as colunas. Ficam registradas aqui caso um mapa
entre em pauta.

| Local | Latitude | Longitude |
|---|---|---|
| CIEP 272 - GABRIEL JOAQUIM DOS SANTOS (SÃO JOÃO) | -22,8471023 | -42,0641612 |
| COLÉGIO ESTADUAL DR. FELICIANO SODRÉ | -22,8364074 | -42,1027701 |
| ESCOLA MUNICIPAL PROF.ª MIRIAM ALVES DE MACEDO GUIMARÃES | -22,8316278 | -42,0946157 |
| CIEP 146 - CORDELINO TEIXEIRA PAULO (ESTAÇÃO) | -22,8339879 | -42,1005519 |
| ESCOLA MUNICIPALIZADA JOSÉ GUIMARÃES | -22,8520159 | -42,1013982 |
| FAETEC | -22,8380689 | -42,0964772 |
| ESCOLA MUNICIPALIZADA PAINEIRA | -22,8348713 | -42,1361698 |
| ESCOLA MUNICIPAL MANOEL MORAES DA SILVA | -22,839985 | -42,0695045 |
| ESCOLA MUNICIPAL RUBEM ARRUDA CÂMARA | -22,8241109 | -42,0883498 |
| ESCOLA MUNICIPALIZADA PEQUIÁ | -22,8068341 | -42,119568 |
| COLÉGIO ESTADUAL JOSÉ RASCÃO | -22,8317542 | -42,0970744 |
| ESCOLA MUNICIPAL LUIZA TERRA DE ANDRADE | -22,8399057 | -42,0709631 |
| ESCOLA MUNICIPAL VINHATEIRO | -22,8533366 | -42,0489593 |
| ESCOLA MUNICIPAL PROFª. DULCINDA JOTTA MENDES | -22,8421181 | -42,0612434 |
| ESCOLA MUNICIPAL PROF.ª MARIA DA GLÓRIA DOS SANTOS MOTTA | -22,8440647 | -42,1677055 |
| ESCOLA MUNICIPAL FLONETE ALEXANDRINO DA SILVA | -22,8601517 | -42,1076632 |
| ESCOLA MUNICIPAL DULCE JOTTA DE SOUZA | -22,8451345 | -42,0605964 |
| COLÉGIO ESTADUAL ALMIRANTE TAMANDARÉ | -22,8594863 | -42,0575537 |
| CENTRO EDUCACIONAL MISSÃO DE SÃO PEDRO | -22,8385753 | -42,1023051 |
| ESCOLA MUNICIPAL VIDAL DE NEGREIROS | -22,8292352 | -42,0392677 |
| ESCOLA MUNICIPAL JOSÉ TEIXEIRA PAULO | -22,8337023 | -42,1464883 |
| HORTO-ESCOLA ARTESANAL | -22,828016 | -42,1257483 |
| ESCOLA MUNICIPAL ANTONIO RODRIGUES DOS SANTOS | -22,8458026 | -42,03737 |
| ESCOLA MUNICIPAL VITAL BRASIL | -22,8617248 | -42,044767 |
| ESCOLA MUNICIPAL PROF.ª CAROLINA NAZARETH TEIXEIRA PINHEIRO | -22,8301844 | -42,0998535 |
| ESCOLA MUNICIPAL PROF.ª MARIA CELESTE DE CAMPOS | -22,8562994 | -42,0604887 |
| ESCOLA MUNICIPAL FRANCISCO PAES DE CARVALHO FILHO | -22,8686489 | -42,1120405 |
| ESCOLA MUNICIPAL ANTÔNIO VAZ DA SILVA | -22,8110412 | -42,1026931 |
| CASA DE APOIO SEMENTES DO AMANHÃ | -22,848966 | -42,0972978 |
| ESCOLA MUNICIPAL CAPITÃO COSTA | -22,7928679 | -42,1444158 |
| ESCOLA MUNICIPALIZADA LUCINDA FRANCISCONE MEDEIROS | -22,8536537 | -42,0402657 |
| ESCOLA MUNICIPALIZADA PAULO ROBERTO MARINHO | -22,7799176 | -42,0859337 |
| POLO CEDERJ - SÃO PEDRO DA ALDEIA | -22,8380689 | -42,0964772 |
| ESCOLA MUNICIPAL QUILOMBOLA DONA ROSA GERALDA DA SILVEIRA | -22,74311 | -42,06352 |
| ESCOLA MUNICIPALIZADA RETIRO | -22,7815967 | -42,0511517 |
| ESCOLA MUNICIPAL ELÍZIO IGNÁCIO RANGEL | -22,8813458 | -42,1198157 |
| ESCOLA MUNICIPALIZADA ADALGISA DA SILVA LOBO | -22,8286226 | -42,0877067 |
| ESCOLA MUNICIPAL SÃO FRANCISCO DE ASSIS | -22,8113219 | -42,0290114 |
| ESCOLA MUNICIPALIZADA ELÍZIO DA COSTA MOREIRA | -22,681165 | -42,16677 |
| ESCOLA MUNICIPAL SAPEATIBA MIRIM | -22,8123519 | -42,1907584 |

## Perfil do município

Calibra a linguagem da página pública (RNF-22). Fonte: relatório de inteligência
do gabinete, mesma extração.

- **52,7% mulheres.** O eleitor mediano é mulher, 25–54 anos, ensino médio.
- **Escolaridade:** 48,3% ensino médio · 31,0% fundamental · 12,3% superior ·
  8,3% sem instrução formal. Frase curta e palavra comum não é preferência de
  estilo, é requisito.
- **Faixa etária:** 16–24 11,5% · 25–34 18,4% · 35–44 17,8% · 45–54 18,3% ·
  55–64 16,0% · 65+ 18,1%.
- **13,7% com voto facultativo**, o que inclui todos acima de 70 anos.

## Perfil das macro-regiões

| | R1 Central | R2 Leste | R3 Balneários/Noroeste |
|---|---|---|---|
| Eleitores | 36.252 (48,3%) | 26.357 (35,1%) | 12.474 (16,6%) |
| Locais | 18 | 14 | 8 |
| Feminino | 52,5% | 52,8% | 53,2% |
| Jovens 16–24 | 11,2% | 12,2% | 11,1% |
| Idosos 65+ | 20,2% | 16,1% | 16,2% |
| Ensino superior | 15,6% | 7,7% | 12,5% |
| Voto facultativo | 15,0% | 12,5% | 12,5% |
