import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FollowButton } from "@/components/FollowButton";
import { PaginationLinks } from "@/components/PaginationLinks";
import { PostCard } from "@/components/PostCard";
import { ProfileBadges } from "@/components/ProfileBadges";
import { ProfileCover } from "@/components/ProfileCover";
import { StartDirectMessageButton } from "@/components/StartDirectMessageButton";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";
import { getUserComments, getUserProfile } from "@/lib/queries";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    redirect("/login");
  }

  const { id } = await params;
  const search = await searchParams;
  const profileId = Number(id);

  if (!Number.isInteger(profileId)) {
    notFound();
  }

  const page = parsePage(search.page);
  const activeTab = search.tab === "comments" ? "comments" : "posts";
  const profile = await getUserProfile(profileId, viewer.id, activeTab === "posts" ? page : 0);

  if (!profile) {
    notFound();
  }

  const isMe = profile.user.id === viewer.id;
  const comments = activeTab === "comments" ? await getUserComments(profileId, page) : [];
  const visiblePosts = pageItems(profile.posts);
  const visibleComments = pageItems(comments);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/30 shadow-[0_24px_80px_-58px_oklch(22%_0.018_160)]">
        <ProfileCover src={profile.user.cover_url} name={profile.user.name} />
        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative z-10 flex max-w-full flex-col gap-3 rounded-lg border border-white/60 bg-paper/88 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_70px_-48px_oklch(22%_0.018_160)] backdrop-blur-md sm:flex-row sm:items-end sm:gap-4 sm:p-4">
              <div className="-mt-12 inline-flex w-fit rounded-full bg-paper p-1 shadow-[0_18px_46px_-30px_oklch(22%_0.018_160)] ring-2 ring-clay/30 sm:mt-0">
                <UserAvatar user={profile.user} size="lg" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
                  Profilo
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
                    {profile.user.name}
                  </h1>
                </div>
                <div className="mt-2">
                  <ProfileBadges
                    role={profile.user.role}
                    isNew={Boolean(profile.user.is_new)}
                    followed={!isMe && profile.i_follow}
                  />
                </div>
              </div>
            </div>

          {isMe ? (
            <Link
              href="/settings/profile"
              className="inline-flex h-10 items-center rounded-lg bg-charcoal px-4 text-sm font-semibold text-paper shadow-[inset_0_3px_0_var(--clay)] transition hover:bg-clay-900 active:translate-y-px"
            >
              Modifica profilo
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              <StartDirectMessageButton userId={profile.user.id} />
              <FollowButton
                userId={profile.user.id}
                initialFollowing={profile.i_follow}
              />
            </div>
          )}
          </div>

          <div className="mt-6 rounded-lg border border-charcoal/10 bg-paper/74 p-4 shadow-[inset_3px_0_0_var(--clay)]">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">
              Bio
            </p>
            <p className="mt-2 max-w-[68ch] text-[1rem] leading-7 text-charcoal/68">
              {profile.user.bio || "Bio non ancora compilata."}
            </p>
          </div>

        <dl className="mt-6 grid max-w-xl grid-cols-3 gap-3">
          {[
            ["Post", profile.posts_count],
            ["Follower", profile.followers_count],
            ["Seguiti", profile.following_count],
          ].map(([label, value]) => (
            <div key={label as string} className="border-t border-charcoal/10 pt-3">
              <dt className="text-sm text-charcoal/45">{label as string}</dt>
              <dd className="font-mono text-2xl font-semibold text-charcoal">{value as number}</dd>
            </div>
          ))}
        </dl>
        </div>
      </section>

      <section className="py-8">
        <nav className="mb-5 grid grid-cols-2 rounded-lg border border-charcoal/10 bg-paper/88 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:w-80">
          {[
            ["posts", "Post"],
            ["comments", "Commenti"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/profile/${profile.user.id}${value === "comments" ? "?tab=comments" : ""}`}
              className={`inline-flex h-10 items-center justify-center rounded-md text-sm font-semibold transition ${
                activeTab === value
                  ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                  : "text-charcoal/58 hover:bg-clay-100 hover:text-clay-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {activeTab === "posts" && visiblePosts.length ? (
          visiblePosts.map((post, i) => (
            <PostCard key={post.id} post={post} currentUserId={viewer.id} staggerIndex={i} />
          ))
        ) : activeTab === "comments" && visibleComments.length ? (
          <div className="grid gap-3">
            {visibleComments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-lg border border-charcoal/10 bg-surface p-4"
              >
                <Link
                  href={`/post/${comment.post_id}`}
                  className="font-semibold text-charcoal underline-offset-4 hover:underline"
                >
                  Da una conversazione
                </Link>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-charcoal/72">
                  {comment.content}
                </p>
                {comment.edited_at ? (
                  <p className="mt-1 font-mono text-xs text-charcoal/35">Modificato</p>
                ) : null}
                <p className="mt-3 line-clamp-2 text-sm text-charcoal/45">
                  Post: {comment.post_content}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-charcoal/10 bg-surface p-8">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">
              {activeTab === "posts" ? "Nessun post pubblicato." : "Nessun commento pubblicato."}
            </h2>
            <p className="mt-2 max-w-[50ch] leading-7 text-charcoal/58">
              Quando {isMe ? "scriverai" : "scrivera"} qualcosa, lo troverai qui
              in ordine cronologico.
            </p>
          </div>
        )}
        <PaginationLinks
          page={page}
          hasNext={activeTab === "posts" ? hasNextPage(profile.posts) : hasNextPage(comments)}
          basePath={`/profile/${profile.user.id}`}
          params={{ tab: activeTab === "comments" ? "comments" : undefined }}
        />
      </section>
    </main>
  );
}
