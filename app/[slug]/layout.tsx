import "./paper.css";

export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper flex min-h-dvh flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
