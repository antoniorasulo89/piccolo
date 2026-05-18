import Link from "next/link";
import { LockKey, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { GroupCreateForm } from "@/components/GroupCreateForm";
import { GroupJoinButton } from "@/components/GroupJoinButton";
import { PaginationLinks } from "@/components/PaginationLinks";
import { getCurrentUser } from "@/lib/auth";
import { getGroups } from "@/lib/community";
import { hasNextPage, pageItems, parsePage } from "@/lib/pagination";

type GroupsPageProps = {
  searchParams: Promise<{ filter?: string; page?: string; q?: string }>;
};

const filters = [
  { key: "all", label: "Pubblici" },
  { key: "mine", label: "I miei" },
  { key: "private", label: "Privati" },
];

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const filter = params.filter === "mine" || params.filter === "private" ? params.filter : "all";
  const q = params.q?.trim() ?? "";
  const page = parsePage(params.page);
  const groups = await getGroups(user.id, filter, page, q);
  const visibleGroups = pageItems(groups);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
      <section>
        <div className="border-b border-charcoal/10 pb-7">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
            Gruppi
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-charcoal">
            Spazi pubblici e privati.
          </h1>
          <p className="mt-4 max-w-[62ch] leading-7 text-charcoal/60">
            Crea community leggere, entra nei gruppi pubblici o richiedi accesso a quelli privati.
          </p>
        </div>

        <form method="GET" action="/groups" className="mt-5">
          <input type="hidden" name="filter" value={filter !== "all" ? filter : ""} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cerca gruppi per nome o descrizione"
            className="h-10 w-full max-w-sm rounded-lg border border-charcoal/10 bg-paper px-4 text-sm text-charcoal placeholder:text-charcoal/32 transition focus:border-clay focus:ring-2 focus:ring-clay/25 focus:outline-none"
          />
        </form>

        <nav className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => {
            const href = item.key === "all" ? "/groups" : `/groups?filter=${item.key}`;
            const active = filter === item.key;
            return (
              <Link
                key={item.key}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition active:translate-y-px ${
                  active
                    ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                    : "border border-charcoal/10 bg-paper/60 text-charcoal/68 hover:border-clay hover:bg-clay-100 hover:text-clay-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visibleGroups.length ? (
            visibleGroups.map((group) => (
              <article
                key={group.id}
                className="relative overflow-hidden rounded-lg border border-charcoal/10 bg-linear-to-br from-surface via-surface to-clay-100/28 p-4 shadow-[0_20px_60px_-52px_oklch(22%_0.018_160)] transition hover:-translate-y-0.5 hover:border-clay/55"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 ${group.privacy === "private" ? "bg-clay" : "bg-fern-700"}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/groups/${group.slug}`}
                        className="text-xl font-semibold tracking-tight text-charcoal underline-offset-4 hover:underline"
                      >
                        {group.name}
                      </Link>
                      <span className="inline-flex items-center gap-1 rounded-md bg-paper/80 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-charcoal/62">
                        {group.privacy === "private" ? <LockKey size={12} weight="bold" /> : <UsersThree size={12} weight="bold" />}
                        {group.privacy === "private" ? "Privato" : "Pubblico"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-charcoal/62">
                      {group.description || "Nessuna descrizione ancora."}
                    </p>
                    <p className="mt-3 font-mono text-xs text-charcoal/42">
                      {group.members_count} membri / {group.posts_count} post / owner {group.owner_name}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/groups/${group.slug}`}
                    className="inline-flex h-10 items-center rounded-lg border border-charcoal/10 bg-paper/70 px-4 text-sm font-semibold text-charcoal/70 transition hover:border-clay hover:bg-clay-100 hover:text-clay-900"
                  >
                    Apri
                  </Link>
                  {!group.is_member ? (
                    <GroupJoinButton
                      groupId={group.id}
                      privacy={group.privacy}
                      initialStatus={group.viewer_status}
                    />
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-charcoal/10 bg-surface p-8 md:col-span-2">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">
                {q ? "Nessun gruppo trovato." : "Crea il primo gruppo per la tua community."}
              </h2>
              <p className="mt-2 max-w-[52ch] leading-7 text-charcoal/58">
                {q
                  ? `Nessun gruppo corrisponde a "${q}". Prova con altri termini di ricerca.`
                  : "Uno spazio riservato per team, corsi o associazioni. Scegli tu se pubblico o privato."}
              </p>
            </div>
          )}
        </div>

        <PaginationLinks
          page={page}
          hasNext={hasNextPage(groups)}
          basePath="/groups"
          params={{ filter: filter === "all" ? undefined : filter }}
        />
      </section>

      <aside className="lg:pt-24">
        <div className="sticky top-24">
          <GroupCreateForm />
        </div>
      </aside>
    </main>
  );
}
