"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/instagram/posts", rotulo: "Posts" },
  { href: "/instagram/importar", rotulo: "Importar" },
  { href: "/instagram/ausencias", rotulo: "Ausências" },
  { href: "/instagram/vincular", rotulo: "Não casados" },
] as const;

export function AbasInstagram() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-wrap items-center gap-1 border-b border-line pb-3">
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href || pathname.startsWith(`${aba.href}/`);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`font-display tracking-card rounded-full px-3 py-1.5 text-tiny transition-colors duration-[var(--dur-micro)] ${
              ativa ? "bg-surface-3 text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
