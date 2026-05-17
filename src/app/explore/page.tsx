import Link from "next/link";
import { redirect } from "next/navigation";
import { ExploreFilters } from "@/components/ExploreFilters";
import { FollowButton } from "@/components/FollowButton";
import { HighlightText } from "@/components/HighlightText";
import { ProfileBadges } from "@/components/ProfileBadges";
import { UserBadge } from "@/components/UserBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";
import { getDiscoverUsers } from "@/lib/queries";

type ExplorePageProps = {
  searchParams: Promise<{ q?: string; filter?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const viewer = await getCurrentUser();

  if (!viewer) {
    redirect("/login");
  }

  const { q, filter } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const activeFilter =
    filter === "following" || filter === "new" ? filter : "all";
  const allUsers = await getDiscoverUsers(viewer.id, search);
  const users = allUsers.filter((user) => {
    if (activeFilter === "following") return user.i_follow;
    if (activeFilter === "new") return user.is_new;
    return true;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-charcoal/10 pb-7">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Directory
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
          Trova persone da seguire.
        </h1>
        <p className="mt-4 max-w-[62ch] leading-7 text-charcoal/60">
          Cerca per nome, email o bio. Usa i filtri per distinguere chi segui
          gia dagli utenti appena arrivati.
        </p>
      </section>

      <section className="py-8">
        <form action="/explore" className="mb-5 grid gap-2">
          <label htmlFor="q" className="text-sm font-semibold text-charcoal">
            Cerca utente
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Nome, email o bio"
              className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-charcoal px-5 text-sm font-semibold text-paper shadow-[inset_0_3px_0_var(--clay)] transition hover:bg-clay-900 active:translate-y-px"
            >
              Cerca
            </button>
          </div>
          {search ? (
            <Link
              href="/explore"
              className="w-fit text-sm font-semibold text-fern-900 underline-offset-4 hover:underline"
            >
              Cancella ricerca
            </Link>
          ) : null}
        </form>

        <ExploreFilters active={activeFilter} query={search} />

        {users.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {users.map((user) => (
              <article
                key={user.id}
                className="group relative grid gap-4 overflow-hidden rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/28 p-4 shadow-[0_20px_60px_-52px_oklch(22%_0.018_160)] transition duration-300 animate-soft-rise hover:-translate-y-0.5 hover:border-clay/55 hover:bg-paper/72"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 ${
                    user.i_follow ? "bg-fern-700" : user.is_new ? "bg-clay" : "bg-charcoal/12"
                  }`}
                />
                <div className="flex min-w-0 gap-3">
                  <Link href={`/profile/${user.id}`} className="shrink-0">
                    <UserAvatar user={user} />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/profile/${user.id}`}
                        className="font-semibold text-charcoal underline-offset-4 hover:underline"
                      >
                        <HighlightText text={user.name} query={search} />
                      </Link>
                      <UserBadge role={user.role} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-charcoal/58">
                      <HighlightText
                        text={
                          user.bio ||
                          "Nessuna bio. Apri il profilo per vedere i post pubblicati."
                        }
                        query={search}
                      />
                    </p>
                    <p className="mt-2 font-mono text-xs text-charcoal/42">
                      {user.posts_count} post / {user.followers_count} follower /{" "}
                      {user.following_count} seguiti
                    </p>
                    <div className="mt-2">
                      <ProfileBadges
                        role={user.role}
                        isNew={user.is_new}
                        followed={user.i_follow}
                      />
                    </div>
                  </div>
                </div>

                <FollowButton
                  userId={user.id}
                  initialFollowing={user.i_follow}
                  variant={user.i_follow ? "outline" : "solid"}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-charcoal/10 bg-surface p-8">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">
              {search ? "Nessun utente trovato." : "Non ci sono ancora altri utenti."}
            </h2>
            <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
              {search
                ? "Prova con un nome, una email o una parola diversa."
                : "Quando qualcuno si registrera, apparira qui e potrai seguirlo."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
