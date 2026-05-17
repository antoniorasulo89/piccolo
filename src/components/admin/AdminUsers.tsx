import Link from "next/link";
import { AdminPasswordResetButton } from "@/components/AdminPasswordResetButton";
import { AdminRoleButton } from "@/components/AdminRoleButton";
import { AdminSuspendButton } from "@/components/AdminSuspendButton";
import { PaginationLinks } from "@/components/PaginationLinks";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { getAdminUsers } from "@/lib/admin";
import { formatDate } from "./AdminStats";

type AdminUsersProps = {
  users: Awaited<ReturnType<typeof getAdminUsers>>;
  page: number;
  currentUserId: number;
  paginationParams: Record<string, number>;
};

export function AdminUsers({ users, page, currentUserId, paginationParams }: AdminUsersProps) {
  const visibleUsers = pageItems(users);

  return (
    <section id="utenti">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Utenti</h2>
          <p className="mt-1 text-sm text-charcoal/50">Promuovi collaboratori fidati o rimuovi privilegi.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        {visibleUsers.length ? (
          visibleUsers.map((user) => (
            <div
              key={user.id}
              className="grid gap-4 border-b border-charcoal/10 p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/profile/${user.id}`} className="font-semibold text-charcoal underline-offset-4 hover:underline">
                    {user.name}
                  </Link>
                  <span className="rounded-md bg-fern-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fern-900">
                    {user.role}
                  </span>
                  {user.suspended_at ? (
                    <span className="rounded-md bg-rose-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-rose-900">
                      Sospeso
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 break-all text-sm text-charcoal/50">{user.email}</p>
                <p className="mt-2 text-sm text-charcoal/45">
                  {user.posts_count} post, {user.followers_count} follower, iscritto {formatDate(user.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <AdminRoleButton userId={user.id} role={user.role} isCurrentUser={user.id === currentUserId} />
                <AdminSuspendButton userId={user.id} suspended={Boolean(user.suspended_at)} isCurrentUser={user.id === currentUserId} />
                <AdminPasswordResetButton userId={user.id} />
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-charcoal/58">Nessun utente registrato.</div>
        )}
      </div>
      <PaginationLinks page={page} hasNext={hasNextPage(users)} basePath="/admin" pageParam="usersPage" params={paginationParams} />
    </section>
  );
}
