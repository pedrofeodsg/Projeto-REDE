"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { entrar, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = { erro: null };

export function LoginForm() {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="chave"
          className="font-display text-eyebrow tracking-eyebrow text-ink-3"
        >
          Chave de acesso
        </Label>
        <Input
          id="chave"
          name="chave"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          disabled={pendente}
          className="h-12 bg-surface-3 text-body"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="senha"
          className="font-display text-eyebrow tracking-eyebrow text-ink-3"
        >
          Senha
        </Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          disabled={pendente}
          className="h-12 bg-surface-3 text-body"
        />
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="border-l-2 border-t-afastado pl-3 text-small text-t-afastado"
        >
          {estado.erro}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pendente}
        className="font-display tracking-card mt-1 h-12 w-full text-card"
      >
        {pendente ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
