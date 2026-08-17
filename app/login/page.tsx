import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="admin flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <header className="mb-8">
          <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
            Núcleo de Inteligência e Dados
          </p>
          <h1 className="font-display tracking-display mt-2 text-section text-ink">
            Projeto REDE
          </h1>
          <p className="mt-3 text-small text-ink-2">
            Acesso restrito à coordenação.
          </p>
        </header>

        <div
          className="rounded-lg border border-line p-6"
          style={{ background: "var(--card-bg)" }}
        >
          <LoginForm />
        </div>

        <p className="mt-6 text-tiny text-ink-3">
          Liderança e apoiador não fazem login. O contato deles com o sistema é
          um link.
        </p>
      </div>
    </div>
  );
}
