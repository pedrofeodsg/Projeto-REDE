"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/painel", rotulo: "Painel" },
  { href: "/territorio", rotulo: "Território" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {ITENS.map((item) => {
        const ativo =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`font-display tracking-card rounded-full px-3 py-1.5 text-tiny transition-colors duration-[var(--dur-micro)] ${
              ativo
                ? "bg-surface-3 text-ink"
                : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
