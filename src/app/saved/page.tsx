import Link from "next/link";
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { PaginationLinks } from "@/components/PaginationLinks";
import { PostCard } from "@/components/PostCard";
import { getCurrentUser } from "@/lib/auth";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";
import { getBookmarkedPosts } from "@/lib/queries";

type SavedPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SavedPage({ searchParams }: SavedPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const posts = await getBookmarkedPosts(user.id, page);
  const visiblePosts = pageItems(posts);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <section className="mb-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Salvati
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal">
          Post da ritrovare.
        </h1>
      </section>

      <section className="grid gap-3 rounded-lg border border-charcoal/10 bg-surface p-3 sm:p-5">
        {visiblePosts.length ? (
          visiblePosts.map((post, i) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} staggerIndex={i} />
          ))
        ) : (
          <div className="py-12">
            <BookmarkSimple size={28} className="text-fern-900" />
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-charcoal">
              Non hai ancora salvato post.
            </h2>
            <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
              Usa l&apos;icona segnalibro nei post per creare una piccola raccolta personale.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
            >
              Torna al feed
            </Link>
          </div>
        )}
      </section>
      <PaginationLinks page={page} hasNext={hasNextPage(posts)} basePath="/saved" />
    </main>
  );
}
