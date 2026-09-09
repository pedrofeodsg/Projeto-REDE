# Como acrescentar uma moldura

1. Exporte a arte em **PNG, 1080 × 1920** (tamanho exato do story).
   Se der, deixe a área onde a foto entra **recortada em transparência** —
   assim o alinhamento sai perfeito sem ninguém medir nada. Se vier chapada,
   com a área da foto em branco puro, também funciona.

2. Salve o arquivo nesta pasta, com nome em minúsculas e hífens.
   Ex.: `eu-voto-e-indico.png`

3. Acrescente a entrada em `lib/molduras/catalogo.ts`. O campo `janela` é só
   rede de segurança: basta que o retângulo caia **dentro** da área da foto,
   porque quem mede a borda de verdade é `lerJanela()`, lendo os pixels do
   próprio arquivo.

A pasta é pública. Nada aqui pode conter dado de pessoa.
