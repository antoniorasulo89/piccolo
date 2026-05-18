import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { PaginationLinks } from "@/components/PaginationLinks";
import { PostCard } from "@/components/PostCard";
import { getCurrentUser } from "@/lib/auth";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";
import { searchPosts } from "@/lib/queries";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const page = parsePage(params.page);
  const posts = await searchPosts(user.id, search, page);
  const visiblePosts = pageItems(posts);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <section className="border-b border-charcoal/10 pb-7">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Cerca
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
          Trova post e conversazioni.
        </h1>
        <p className="mt-4 max-w-[62ch] leading-7 text-charcoal/60">
          Cerca nel testo dei post o nel nome dell&apos;autore. Per trovare persone, usa la directory.
        </p>
      </section>

      <section className="py-8">
        <form action="/search" className="mb-5 grid gap-2">
          <label htmlFor="q" className="text-sm font-semibold text-charcoal">
            Cerca contenuto
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Parole nel post o nome autore"
              className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fern-700 px-5 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
            >
              <MagnifyingGlass size={17} weight="bold" />
              Cerca
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {search ? (
              <Link
                href="/search"
                className="font-semibold text-fern-900 underline-offset-4 hover:underline"
              >
                Cancella ricerca
              </Link>
            ) : null}
            <Link
              href="/explore"
              className="font-semibold text-charcoal/62 underline-offset-4 hover:text-charcoal hover:underline"
            >
              Cerca utenti
            </Link>
          </div>
        </form>

        {search ? (
          visiblePosts.length ? (
            <>
              <div className="grid gap-3 rounded-lg border border-charcoal/10 bg-surface p-3 sm:p-5">
                {visiblePosts.map((post, i) => (
                  <PostCard key={post.id} post={post} currentUserId={user.id} staggerIndex={i} />
                ))}
              </div>
              <PaginationLinks
                page={page}
                hasNext={hasNextPage(posts)}
                basePath="/search"
                params={{ q: search }}
              />
            </>
          ) : (
            <div className="rounded-lg border border-charcoal/10 bg-surface p-8">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">
                Nessun post trovato.
              </h2>
              <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
                Prova con parole più semplici o cerca direttamente un utente.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-charcoal/16 bg-paper px-4 py-10">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">
              Inserisci una ricerca.
            </h2>
            <p className="mt-2 max-w-[56ch] leading-7 text-charcoal/58">
              La ricerca rimane leggera: perfetta per ritrovare post, frasi e autori.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
