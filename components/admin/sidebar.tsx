"use client";

import {
  AtSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  MessageSquare,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { sair } from "@/app/login/actions";

/**
 * Navegação do painel.
 *
 * Sidebar fixa a partir de 1024px, gaveta abaixo disso. Agrupada por intenção,
 * não por ordem de construção: o que exige ação fica em cima.
 *
 * Contraste seguindo a regra 16 dos tokens: `--ink-3` só em metadado pequeno.
 * Item de menu é texto que precisa ser lido, então o inativo é `--ink-2` e o
 * ativo é branco puro, que no painel é o acento.
 */

type Item = {
  href: string;
  rotulo: string;
  Icone: typeof LayoutDashboard;
  chave?: "demandas" | "conflitos";
};

const GRUPOS: { titulo: string | null; itens: Item[] }[] = [
  {
    titulo: null,
    itens: [{ href: "/painel", rotulo: "Painel", Icone: LayoutDashboard }],
  },
  {
    titulo: "Rede",
    itens: [
      { href: "/liderancas", rotulo: "Lideranças", Icone: Users },
      { href: "/pessoas", rotulo: "Pessoas", Icone: UserRound },
      { href: "/demandas", rotulo: "Demandas", Icone: ClipboardList, chave: "demandas" },
      { href: "/conflitos", rotulo: "Conflitos", Icone: ShieldAlert, chave: "conflitos" },
    ],
  },
  {
    titulo: "Inteligência",
    itens: [
      { href: "/territorio", rotulo: "Território", Icone: Map },
      { href: "/instagram", rotulo: "Instagram", Icone: AtSign },
    ],
  },
  {
    titulo: "Saída",
    itens: [
      { href: "/mensagens", rotulo: "Mensagens", Icone: MessageSquare },
      { href: "/exportar", rotulo: "Exportar", Icone: FileText },
    ],
  },
];

const PAPEL_LABEL = {
  coordenacao: "Coordenação",
  operador: "Operador",
} as const;

export type Contagens = { demandas: number; conflitos: number };

export function Sidebar({
  nome,
  papel,
  contagens,
}: {
  nome: string;
  papel: "coordenacao" | "operador" | null;
  contagens: Contagens;
}) {
  const pathname = usePathname();
  const [aberta, setAberta] = useState(false);

  // A gaveta fecha ao navegar: no celular, ela cobre a tela inteira.
  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  return (
    <>
      {/* Barra de topo, só abaixo de 1024px */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          className="flex size-9 items-center justify-center rounded-md border border-line-2 text-ink"
        >
          <span aria-hidden className="flex flex-col gap-[3px]">
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
          </span>
        </button>

        <p className="font-display tracking-card text-card text-ink">Projeto REDE</p>

        <form action={sair}>
          <button
            type="submit"
            className="font-display tracking-card h-9 rounded-full border border-line px-3 text-tiny text-ink-2"
          >
            Sair
          </button>
        </form>
      </div>

      {aberta && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setAberta(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-line bg-surface transition-transform duration-200 ease-[var(--ease-rede)] lg:translate-x-0 ${
          aberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-2 px-5 py-6">
          <Link href="/painel" className="block">
            <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
              Núcleo de Inteligência
            </p>
            <p className="font-display tracking-card mt-1 text-[15px] text-ink">
              Projeto REDE
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setAberta(false)}
            aria-label="Fechar menu"
            className="text-ink-2 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {GRUPOS.map((grupo, i) => (
            <div key={grupo.titulo ?? `grupo-${i}`} className={i > 0 ? "mt-6" : ""}>
              {grupo.titulo && (
                <p className="font-display tracking-eyebrow px-3 pb-2 text-eyebrow text-ink-3">
                  {grupo.titulo}
                </p>
              )}

              <ul className="flex flex-col gap-0.5">
                {grupo.itens.map((item) => {
                  const ativo =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const contagem = item.chave ? contagens[item.chave] : 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={ativo ? "page" : undefined}
                        className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-[var(--dur-micro)] ${
                          ativo
                            ? "bg-acento-suave text-acento"
                            : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                        }`}
                      >
                        {/* Marca do item ativo: fio branco, que no painel é o acento. */}
                        <span
                          aria-hidden
                          className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-acento transition-opacity ${
                            ativo ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <item.Icone className="size-4 shrink-0" strokeWidth={1.5} />
                        <span className="font-display tracking-card flex-1 text-tiny">
                          {item.rotulo}
                        </span>

                        {contagem > 0 && (
                          <span
                            className={`font-data rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                              item.chave === "conflitos"
                                ? "bg-t-afastado/15 text-t-afastado"
                                : "bg-surface-3 text-ink-2 group-hover:text-ink"
                            }`}
                          >
                            {contagem}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-small font-medium text-ink">{nome}</p>
          <p className="font-display tracking-eyebrow text-eyebrow text-ink-3">
            {papel ? PAPEL_LABEL[papel] : "Sem vínculo"}
          </p>

          <form action={sair} className="mt-3">
            <button
              type="submit"
              className="font-display tracking-card h-8 w-full rounded-full border border-line-2 text-tiny text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
