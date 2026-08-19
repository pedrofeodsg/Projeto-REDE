/**
 * Motor de mensagens.
 *
 * Sem `server-only`: estas funções são puras e rodam também no cliente, porque
 * o botão de envio precisa abrir o WhatsApp no mesmo gesto do clique. Abrir a
 * janela depois de uma ida ao servidor faz o bloqueador de pop-up engolir o
 * link.
 *
 * Invariante 7: nada dispara sozinho. Isto monta um endereço; quem envia é uma
 * pessoa, com o dedo.
 */

export type DadosMensagem = {
  nome: string;
  linkCadastro: string;
  cadastrados?: number;
  meta?: number;
  faltam?: number;
  linhaPessoal?: string | null;
};

/** Primeiro nome, que é como se fala com alguém no WhatsApp. */
function tratamento(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/**
 * Interpola as variáveis do template.
 *
 * A linha pessoal é o caso delicado: quando está vazia, a linha inteira sai,
 * sem deixar a quebra dupla para trás. É a diferença entre uma mensagem que
 * parece escrita para aquela pessoa e uma que parece formulário com buraco.
 */
export function montarMensagem(corpo: string, dados: DadosMensagem): string {
  const linhaPessoal = (dados.linhaPessoal ?? "").trim();

  const semLinhaVazia = linhaPessoal
    ? corpo
    : corpo
        // A linha do marcador some junto com a quebra que a separava do resto.
        .replace(/\n*^[ \t]*\{linha_pessoal\}[ \t]*$\n?/gm, "\n")
        .replace(/\{linha_pessoal\}/g, "");

  return semLinhaVazia
    .replace(/\{nome\}/g, tratamento(dados.nome))
    .replace(/\{link_cadastro\}/g, dados.linkCadastro)
    .replace(/\{cadastrados\}/g, String(dados.cadastrados ?? 0))
    .replace(/\{meta\}/g, String(dados.meta ?? 0))
    .replace(/\{faltam\}/g, String(dados.faltam ?? 0))
    .replace(/\{linha_pessoal\}/g, linhaPessoal)
    // Três quebras ou mais viram duas: nunca sobra buraco no meio do texto.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Monta o link do WhatsApp.
 *
 * `encodeURIComponent` na mensagem inteira, o que já transforma quebra de
 * linha em %0A. Sem isso, metade dos links quebra no meio do texto.
 */
export function montarLinkWa(telefone: string, mensagem: string): string {
  const digitos = telefone.replace(/\D/g, "");
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}
