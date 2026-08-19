import type { Metadata } from "next";

import { listarPosts } from "@/lib/instagram/queries";
import { createAuthClient } from "@/lib/supabase/auth";

import { FormPost, LinhaPost } from "./form";

export const metadata: Metadata = { title: "Posts" };

export default async function PostsPage() {
  const supabase = await createAuthClient();
  const posts = await listarPosts(supabase);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
      <FormPost />

      <section
        className="overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--card-bg)" }}
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-display tracking-card text-card text-ink">
            Posts cadastrados
          </h2>
          <p className="font-data text-tiny text-ink-3">{posts.length}</p>
        </div>

        {posts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-body text-ink">Nenhum post ainda.</p>
            <p className="mx-auto mt-2 max-w-sm text-small text-ink-2">
              Cadastre o primeiro post oficial ao lado. No instante em que ele
              entra, o sistema congela quem era liderança naquela data.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {posts.map((p) => (
              <LinhaPost key={p.id} post={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
