import Link from "next/link";
import { redirect } from "next/navigation";
import { ComposeBox } from "@/components/ComposeBox";
import { FeedTabs } from "@/components/FeedTabs";
import { LoadMorePosts } from "@/components/LoadMorePosts";
import { PostCard } from "@/components/PostCard";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { UserBadge } from "@/components/UserBadge";
import { getCurrentUser } from "@/lib/auth";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { getFeedPosts, getSuggestedUsers, type FeedScope } from "@/lib/queries";

type FeedPageProps = {
  searchParams: Promise<{ scope?: string }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.onboarded_at) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const scope: FeedScope = params.scope === "all" ? "all" : "following";
  const [posts, suggestedUsers] = await Promise.all([
    getFeedPosts(user.id, 0, scope),
    getSuggestedUsers(user.id),
  ]);
  const visiblePosts = pageItems(posts);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,720px)_320px] lg:px-8">
      <section>
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_18rem] sm:items-end">
          <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
            Feed
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal">
            La tua timeline
          </h1>
          </div>
          <FeedTabs scope={scope} />
        </div>

        <ComposeBox />

        <div className="mt-8 grid gap-3 rounded-lg border border-charcoal/10 bg-surface p-3 sm:p-5">
          {visiblePosts.length ? (
            visiblePosts.map((post, i) => (
              <PostCard key={post.id} post={post} currentUserId={user.id} staggerIndex={i} />
            ))
          ) : (
            <div className="py-12">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">
                Qui appariranno i post della tua community.
              </h2>
              <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
                {scope === "following"
                  ? "Pubblica il primo post o segui qualcuno: vedrai i contenuti delle persone che scegli."
                  : "Non ci sono ancora post pubblici. Appena qualcuno scrive, lo vedrai qui."}
              </p>
              <Link
                href="/explore"
                className="mt-6 inline-flex h-10 items-center rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px"
              >
                Trova utenti
              </Link>
            </div>
          )}
          {hasNextPage(posts) ? (
            <LoadMorePosts initialPage={1} scope={scope} currentUserId={user.id} />
          ) : null}
        </div>
      </section>

      <aside className="lg:pt-20">
        <div className="sticky top-24 rounded-lg border border-charcoal/10 bg-paper p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Sessione
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-charcoal">{user.name}</h2>
            <UserBadge role={user.role} />
          </div>
          <p className="mt-1 break-all text-sm text-charcoal/50">{user.email}</p>
          <Link
            href={`/profile/${user.id}`}
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-charcoal/10 px-4 text-sm font-semibold text-charcoal/75 transition hover:border-charcoal/25 hover:text-charcoal active:translate-y-px"
          >
            Apri profilo
          </Link>
          <SuggestedUsers users={suggestedUsers} />
        </div>
      </aside>
    </main>
  );
}
