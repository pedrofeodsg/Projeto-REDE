import { AbasInstagram } from "./abas";

export default function InstagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1400px]">
      <header>
        <p className="font-display text-eyebrow tracking-eyebrow text-ink-3">
          Monitoramento digital · ingestão por importação
        </p>
        <h1 className="font-display tracking-display mt-2 text-section text-ink">
          Instagram
        </h1>
        <p className="mt-3 max-w-prose text-small text-ink-2">
          O sistema não conversa com o Instagram. Ele recebe dados — uma lista
          de @ colada ou um arquivo. A extração fica em ferramenta separada,
          para que a conta oficial da campanha não corra risco de restrição em
          plena campanha.
        </p>
      </header>

      <AbasInstagram />

      <div className="mt-4">{children}</div>
    </div>
  );
}
