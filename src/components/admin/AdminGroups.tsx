import Link from "next/link";
import { LockKey, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { PaginationLinks } from "@/components/PaginationLinks";
import { getAdminGroups } from "@/lib/admin";
import { hasNextPage, pageItems } from "@/lib/pagination";

type AdminGroupsProps = {
  groups: Awaited<ReturnType<typeof getAdminGroups>>;
  page: number;
  q: string;
  privacy: string;
  ownerId: string;
  section: string;
};

export function AdminGroups({ groups, page, q, privacy, ownerId, section }: AdminGroupsProps) {
  const visibleGroups = pageItems(groups);
  const basePath = `/admin?section=${section}`;

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Gruppi</h2>
      <p className="mt-1 text-sm text-charcoal/50">Tutti i gruppi della piattaforma, pubblici e privati.</p>

      <form method="GET" action="/admin" className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <input type="hidden" name="section" value={section} />
        <input
          type="search"
          name="groupsQ"
          defaultValue={q}
          placeholder="Cerca per nome o descrizione"
          className="h-9 w-full rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal placeholder:text-charcoal/32"
        />
        <select
          name="groupsPrivacy"
          defaultValue={privacy}
          className="h-9 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal"
        >
          <option value="">Tutti</option>
          <option value="public">Pubblici</option>
          <option value="private">Privati</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-clay hover:bg-clay-100 hover:text-clay-900"
        >
          Filtra
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        {visibleGroups.length ? (
          visibleGroups.map((group) => (
            <div key={group.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 p-4 last:border-b-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/groups/${group.slug}`} className="font-semibold text-charcoal hover:underline">
                    {group.name}
                  </Link>
                  <span className="inline-flex items-center gap-1 rounded-md bg-clay-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-clay-900">
                    {group.privacy === "private" ? <LockKey size={12} weight="bold" /> : <UsersThree size={12} weight="bold" />}
                    {group.privacy === "private" ? "Privato" : "Pubblico"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-charcoal/50">
                  Owner: {group.owner_name} / {group.members_count} membri / {group.posts_count} post
                  {group.pending_requests > 0 ? ` / ${group.pending_requests} richieste` : ""}
                </p>
              </div>
              <Link
                href={`/groups/${group.slug}?tab=settings`}
                className="rounded-lg border border-charcoal/10 px-3 py-2 text-xs font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal"
              >
                Gestisci
              </Link>
            </div>
          ))
        ) : (
          <div className="p-8 text-sm text-charcoal/55">Nessun gruppo trovato.</div>
        )}
      </div>
      <PaginationLinks page={page} hasNext={hasNextPage(groups)} basePath={basePath} pageParam="groupsPage" params={{ groupsQ: q || undefined, groupsPrivacy: privacy || undefined, groupsOwner: ownerId || undefined }} />
    </section>
  );
}
