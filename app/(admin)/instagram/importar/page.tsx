import type { Metadata } from "next";
import Link from "next/link";

import { listarPosts } from "@/lib/instagram/queries";
import { createAuthClient } from "@/lib/supabase/auth";

import { FormImportacao } from "./form";

export const metadata: Metadata = { title: "Importar engajamento" };

export default async function ImportarPage() {
  const supabase = await createAuthClient();
  const posts = await listarPosts(supabase);

  if (posts.length === 0) {
    return (
      <div
        className="rounded-lg border border-line px-6 py-12 text-center"
        style={{ background: "var(--card-bg)" }}
      >
        <p className="text-body text-ink">Cadastre um post primeiro.</p>
        <p className="mx-auto mt-2 max-w-md text-small text-ink-2">
          A importação precisa saber a qual post o engajamento pertence — e o
          roster daquele post precisa já estar congelado.
        </p>
        <Link
          href="/instagram/posts"
          className="font-display tracking-card mt-6 inline-flex h-11 items-center rounded-full bg-primary px-5 text-card text-primary-foreground"
        >
          Cadastrar post
        </Link>
      </div>
    );
  }

  return <FormImportacao posts={posts} />;
}
