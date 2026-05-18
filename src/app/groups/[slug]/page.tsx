import Link from "next/link";
import { LockKey, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { notFound, redirect } from "next/navigation";
import { GroupInviteButton } from "@/components/GroupInviteButton";
import { GroupJoinButton } from "@/components/GroupJoinButton";
import { GroupMembers } from "@/components/GroupMembers";
import { GroupPostComposer } from "@/components/GroupPostComposer";
import { GroupRequestButton } from "@/components/GroupRequestButton";
import { GroupSettings } from "@/components/GroupSettings";
import { PaginationLinks } from "@/components/PaginationLinks";
import { PinPostButton } from "@/components/PinPostButton";
import { PostCard } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";
import { getGroupBySlug, getGroupMembers } from "@/lib/community";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";

type GroupPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; tab?: string }>;
};

const tabs = [
  { key: "posts", label: "Post" },
  { key: "members", label: "Membri" },
  { key: "invites", label: "Inviti" },
  { key: "settings", label: "Impostazioni" },
];

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const { page: rawPage, tab: rawTab } = await searchParams;
  const page = parsePage(rawPage);
  const activeTab = rawTab && tabs.some((t) => t.key === rawTab) ? rawTab : "posts";
  const detail = await getGroupBySlug(slug, user.id, page, user.role === "admin");

  if (!detail) notFound();

  const { group, posts, requests } = detail;
  const visiblePosts = pageItems(posts);
  const canPost = group.is_member;
  const isOwner = group.viewer_role === "owner";
  const isCoOwner = group.viewer_role === "co_owner";
  const isModerator = group.viewer_role === "moderator";
  const canModerate = isOwner || isCoOwner || isModerator || user.role === "admin";
  const locked = group.privacy === "private" && !group.is_member && user.role !== "admin";
  const canGovern = isOwner || isCoOwner || user.role === "admin";

  const members = activeTab === "members" || activeTab === "invites"
    ? await getGroupMembers(group.id)
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/30 shadow-[0_24px_80px_-58px_oklch(22%_0.018_160)]">
        <div className="relative h-40 bg-[radial-gradient(circle_at_18%_20%,var(--clay-100),transparent_24%),linear-gradient(135deg,var(--fern-100),var(--paper)_48%,var(--clay)_140%)] sm:h-52">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-fern-700 via-clay to-rose-900/55" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/24 to-transparent" />
        </div>
        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative z-10 rounded-lg border border-white/60 bg-paper/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_70px_-48px_oklch(22%_0.018_160)] backdrop-blur-md">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
                Gruppo
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="break-words text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
                  {group.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-clay-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-clay-900">
                  {group.privacy === "private" ? <LockKey size={12} weight="bold" /> : <UsersThree size={12} weight="bold" />}
                  {group.privacy === "private" ? "Privato" : "Pubblico"}
                </span>
              </div>
              <p className="mt-3 max-w-[70ch] leading-7 text-charcoal/64">
                {group.description || "Nessuna descrizione ancora."}
              </p>
              <p className="mt-3 font-mono text-xs text-charcoal/42">
                {group.members_count} membri / {group.posts_count} post / owner {group.owner_name}
              </p>
              {canGovern && activeTab === "posts" ? (
                <div className="mt-3">
                  <GroupInviteButton groupId={group.id} />
                </div>
              ) : null}
            </div>

            {!group.is_member ? (
              <GroupJoinButton
                groupId={group.id}
                privacy={group.privacy}
                initialStatus={group.viewer_status}
              />
            ) : null}
            {user.role === "admin" && !group.is_member ? (
              <span className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
                Accesso admin — non sei membro
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="mt-6 grid grid-cols-4 rounded-lg border border-charcoal/10 bg-paper/88 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        {tabs.map((tab) => {
          const isSettingsTab = tab.key === "settings";
          const visible = !isSettingsTab || canGovern;
          if (!visible) return null;
          return (
            <Link
              key={tab.key}
              href={`/groups/${group.slug}?tab=${tab.key}`}
              className={`inline-flex h-10 items-center justify-center rounded-md text-sm font-semibold transition active:scale-[0.98] ${
                activeTab === tab.key
                  ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                  : "text-charcoal/58 hover:bg-clay-100 hover:text-clay-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {locked && activeTab !== "settings" ? (
        <section className="mt-6 rounded-lg border border-charcoal/10 bg-surface p-8">
          <h2 className="text-xl font-semibold tracking-tight text-charcoal">Gruppo privato.</h2>
          <p className="mt-2 max-w-[58ch] leading-7 text-charcoal/58">
            Solo i membri approvati possono vedere contenuti e conversazioni.
          </p>
        </section>
      ) : (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {activeTab === "posts" ? (
            <div>
              {canPost ? <GroupPostComposer groupId={group.id} /> : null}
              <div className="mt-5 grid gap-3 rounded-lg border border-charcoal/10 bg-surface p-3 sm:p-5">
                {visiblePosts.length ? (
                  visiblePosts.map((post, i) => {
                    const isPinned = "pinned_at" in post ? Boolean(post.pinned_at) : false;
                    return (
                      <div key={post.id} className="relative">
                        {isPinned ? (
                          <div className="mb-1 flex items-center gap-2 px-1">
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-amber-900">Fissato</span>
                            {canModerate ? <PinPostButton postId={post.id} pinned /> : null}
                          </div>
                        ) : canModerate ? (
                          <div className="absolute right-2 top-2 z-10">
                            <PinPostButton postId={post.id} pinned={false} />
                          </div>
                        ) : null}
                        <PostCard key={post.id} post={post} currentUserId={user.id} staggerIndex={i} />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8">
                    <h2 className="text-xl font-semibold tracking-tight text-charcoal">Nessun post nel gruppo.</h2>
                    <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
                      Quando i membri pubblicheranno, vedrai qui la conversazione del gruppo.
                    </p>
                  </div>
                )}
              </div>
              <PaginationLinks page={page} hasNext={hasNextPage(posts)} basePath={`/groups/${group.slug}`} />
            </div>
          ) : null}

          {activeTab === "members" ? (
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">Membri ({members.length})</h2>
              <div className="mt-4">
                <GroupMembers members={members} groupId={group.id} actorRole={group.viewer_role} isAdmin={user.role === "admin"} />
              </div>
            </div>
          ) : null}

          {activeTab === "invites" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-charcoal">Inviti</h2>
                  <p className="mt-1 text-sm text-charcoal/55">Crea e gestisci i link di invito al gruppo.</p>
                </div>
                <GroupInviteButton groupId={group.id} />
              </div>
            </div>
          ) : null}

          {activeTab === "settings" && canGovern ? (
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">Impostazioni</h2>
              <div className="mt-4">
                <GroupSettings groupId={group.id} initialName={group.name} initialDescription={group.description ?? ""} initialPrivacy={group.privacy} />
              </div>
            </div>
          ) : null}

          {/* Sidebar */}
          {activeTab === "posts" || activeTab === "members" ? (
            <aside>
              <div className="rounded-lg border border-charcoal/10 bg-paper/72 p-5">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Stato</p>
                <p className="mt-2 text-sm leading-6 text-charcoal/62">
                  {group.is_member
                    ? `Sei ${isOwner ? "owner" : isCoOwner ? "co-owner" : isModerator ? "moderator" : "membro"} del gruppo.`
                    : user.role === "admin" ? "Accesso come amministratore — non sei membro." : "Puoi leggere i gruppi pubblici, ma devi entrare per pubblicare."}
                </p>
              </div>

              {canGovern && requests.length > 0 ? (
                <div className="mt-4 rounded-lg border border-charcoal/10 bg-surface p-5">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Richieste in attesa</p>
                  <div className="mt-3 grid gap-3">
                    {requests.map((request) => (
                      <article key={request.user_id} className="grid gap-3 border-t border-charcoal/10 pt-3 first:border-t-0 first:pt-0">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={{ name: request.user_name, avatar_url: request.user_avatar_url }} size="sm" />
                          <Link href={`/profile/${request.user_id}`} className="font-semibold text-charcoal hover:underline">
                            {request.user_name}
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <GroupRequestButton groupId={group.id} userId={request.user_id} status="approved" />
                          <GroupRequestButton groupId={group.id} userId={request.user_id} status="rejected" />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {group.is_member || user.role === "admin" ? (
                <div className="mt-4 rounded-lg border border-charcoal/10 bg-paper/64 p-5">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Come funziona</p>
                  <p className="mt-2 text-sm leading-6 text-charcoal/58">
                    {canGovern
                      ? "Puoi creare link di invito, gestire le richieste di accesso, fissare post e moderare i membri."
                      : canModerate
                        ? "Puoi fissare post e moderare i contenuti del gruppo."
                        : "Scrivi post, commenta e interagisci con gli altri membri del gruppo."}
                  </p>
                </div>
              ) : null}
            </aside>
          ) : null}
        </section>
      )}
    </main>
  );
}
