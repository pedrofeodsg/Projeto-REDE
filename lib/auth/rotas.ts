/**
 * O grupo (admin) não tem prefixo na URL: `/(admin)/painel` é servido em
 * `/painel`. E `/[slug]` é dinâmico na raiz, então o proxy não tem como
 * deduzir o que é admin e o que é página de liderança.
 *
 * Por isso a lista é explícita. Ao criar uma tela nova dentro de (admin),
 * acrescente o prefixo dela aqui — senão a tela nasce pública.
 */
export const PREFIXOS_ADMIN = [
  "/painel",
  "/liderancas",
  "/pessoas",
  "/demandas",
  "/territorio",
  "/instagram",
  "/mensagens",
  "/conflitos",
  "/exportar",
] as const;

export function ehRotaAdmin(pathname: string): boolean {
  return PREFIXOS_ADMIN.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`),
  );
}
