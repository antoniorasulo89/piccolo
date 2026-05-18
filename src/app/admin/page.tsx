import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminGroups } from "@/components/admin/AdminGroups";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { getAdminStats, getAdminUsers, getAuditLogs, getAdminGroups, getAdminPosts, getAdminComments } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { parsePage } from "@/lib/pagination";
import { getAllReports } from "@/lib/reports";

type AdminPageProps = {
  searchParams: Promise<{
    section?: string;
    page?: string;
    auditPage?: string;
    auditAction?: string;
    auditOverride?: string;
    auditFrom?: string;
    auditTo?: string;
    groupsPage?: string;
    groupsQ?: string;
    groupsPrivacy?: string;
    groupsOwner?: string;
    reportsPage?: string;
    reportsStatus?: string;
    usersPage?: string;
    commentsPage?: string;
    postsPage?: string;
  }>;
};

const sections = [
  { key: "overview", label: "Panoramica" },
  { key: "users", label: "Utenti" },
  { key: "groups", label: "Gruppi" },
  { key: "content", label: "Contenuti" },
  { key: "reports", label: "Segnalazioni" },
  { key: "audit", label: "Audit" },
] as const;

type SectionKey = (typeof sections)[number]["key"];

function resolveSection(raw: string | undefined): SectionKey {
  if (sections.some((s) => s.key === raw)) return raw as SectionKey;
  return "overview";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/feed");

  const params = await searchParams;
  const section = resolveSection(params.section);

  const stats = await getAdminStats();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border border-charcoal/10 bg-charcoal text-paper shadow-[0_28px_90px_-58px_oklch(22%_0.018_160)]">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Link
              href="/feed"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-paper/12 px-3 text-sm font-semibold text-paper/72 transition hover:bg-paper/8 hover:text-paper"
            >
              <ArrowLeft size={16} weight="bold" />
              Torna all&apos;app
            </Link>
            <p className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-clay-100">
              Console amministratore
            </p>
            <h1 className="mt-3 max-w-[13ch] text-4xl font-semibold tracking-tight sm:text-5xl">
              Back office Piccolo.
            </h1>
            <p className="mt-4 max-w-[64ch] leading-7 text-paper/62">
              Area riservata agli admin per utenti, ruoli, sospensioni, report, contenuti e audit.
            </p>
          </div>
          <div className="flex items-end">
            <div className="rounded-lg border border-paper/10 bg-paper/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-clay-100 text-clay-900">
                  <ShieldCheck size={20} weight="bold" />
                </span>
                <div>
                  <p className="font-semibold">Accesso limitato</p>
                  <p className="mt-1 text-sm text-paper/55">{currentUser.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdminStats stats={stats} />

      <nav className="mt-6 flex overflow-x-auto rounded-lg border border-charcoal/10 bg-paper/88 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        {sections.map((s) => (
          <Link
            key={s.key}
            href={`/admin?section=${s.key}`}
            className={`inline-flex h-10 shrink-0 items-center rounded-md px-4 text-sm font-semibold transition active:scale-[0.98] ${
              section === s.key
                ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                : "text-charcoal/58 hover:bg-clay-100 hover:text-clay-900"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {section === "overview" ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin?section=users" className="rounded-lg border border-charcoal/10 bg-surface p-6 transition hover:border-clay/55 hover:-translate-y-0.5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Utenti</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-charcoal">{stats.users}</p>
            <p className="mt-2 text-sm text-charcoal/50">{stats.admins} admin, {stats.suspended} sospesi</p>
            <p className="mt-3 inline-flex items-center text-xs font-semibold text-fern-900">Gestisci utenti</p>
          </Link>
          <Link href="/admin?section=groups" className="rounded-lg border border-charcoal/10 bg-surface p-6 transition hover:border-clay/55 hover:-translate-y-0.5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Gruppi</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-charcoal">{stats.groups}</p>
            <p className="mt-2 text-sm text-charcoal/50">{stats.private_groups} privati</p>
            <p className="mt-3 inline-flex items-center text-xs font-semibold text-fern-900">Gestisci gruppi</p>
          </Link>
          <Link href="/admin?section=content" className="rounded-lg border border-charcoal/10 bg-surface p-6 transition hover:border-clay/55 hover:-translate-y-0.5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Contenuti</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-charcoal">{stats.posts}</p>
            <p className="mt-2 text-sm text-charcoal/50">{stats.comments} commenti, {stats.messages} messaggi</p>
            <p className="mt-3 inline-flex items-center text-xs font-semibold text-fern-900">Modera contenuti</p>
          </Link>
          <Link href="/admin?section=reports" className="rounded-lg border border-charcoal/10 bg-surface p-6 transition hover:border-clay/55 hover:-translate-y-0.5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Segnalazioni</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-charcoal">{stats.reports}</p>
            <p className="mt-2 text-sm text-charcoal/50">aperte</p>
            <p className="mt-3 inline-flex items-center text-xs font-semibold text-fern-900">Vedi segnalazioni</p>
          </Link>
          <Link href="/admin?section=audit" className="rounded-lg border border-charcoal/10 bg-surface p-6 transition hover:border-clay/55 hover:-translate-y-0.5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/42">Audit</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-charcoal">{stats.conversations}</p>
            <p className="mt-2 text-sm text-charcoal/50">{stats.messages} messaggi attivi</p>
            <p className="mt-3 inline-flex items-center text-xs font-semibold text-fern-900">Apri audit log</p>
          </Link>
        </section>
      ) : null}

      {section === "users" ? (
        <section className="mt-8">
          <AdminUsersWrapper
            currentUserId={currentUser.id}
            page={parsePage(params.usersPage)}
            section={section}
          />
        </section>
      ) : null}

      {section === "groups" ? (
        <section className="mt-8">
          <AdminGroupsWrapper
            page={parsePage(params.groupsPage)}
            q={params.groupsQ}
            privacy={params.groupsPrivacy}
            ownerId={params.groupsOwner}
            section={section}
          />
        </section>
      ) : null}

      {section === "content" ? (
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <AdminContentWrapper
            postsPage={parsePage(params.postsPage)}
            commentsPage={parsePage(params.commentsPage)}
            section={section}
          />
        </section>
      ) : null}

      {section === "reports" ? (
        <section className="mt-8">
          <AdminReportsWrapper
            page={parsePage(params.reportsPage)}
            status={params.reportsStatus ?? "open"}
            section={section}
          />
        </section>
      ) : null}

      {section === "audit" ? (
        <section className="mt-8">
          <AdminAuditWrapper
            page={parsePage(params.auditPage)}
            action={params.auditAction}
            adminOverride={params.auditOverride}
            from={params.auditFrom}
            to={params.auditTo}
            section={section}
          />
        </section>
      ) : null}
    </main>
  );
}

async function AdminUsersWrapper({ currentUserId, page, section }: { currentUserId: number; page: number; section: string }) {
  const users = await getAdminUsers(page);
  return <AdminUsers users={users} page={page} currentUserId={currentUserId} basePath={`/admin?section=${section}`} pageParam="usersPage" />;
}

async function AdminGroupsWrapper({ page, q, privacy, ownerId, section }: { page: number; q?: string; privacy?: string; ownerId?: string; section: string }) {
  const groups = await getAdminGroups({
    q: q?.trim() || undefined,
    privacy: privacy === "public" || privacy === "private" ? privacy : undefined,
    ownerId: ownerId ? Number(ownerId) : undefined,
    page,
  });
  return <AdminGroups groups={groups} page={page} q={q ?? ""} privacy={privacy ?? ""} ownerId={ownerId ?? ""} section={section} />;
}

async function AdminContentWrapper({ postsPage, commentsPage, section }: { postsPage: number; commentsPage: number; section: string }) {
  const [posts, comments] = await Promise.all([
    getAdminPosts(postsPage),
    getAdminComments(commentsPage),
  ]);
  return <AdminContent comments={comments} posts={posts} commentsPage={commentsPage} postsPage={postsPage} basePath={`/admin?section=${section}`} />;
}

async function AdminReportsWrapper({ page, status, section }: { page: number; status: string; section: string }) {
  const reports = await getAllReports(page, status);
  return <AdminReports reports={reports} page={page} status={status} section={section} />;
}

async function AdminAuditWrapper({ page, action, adminOverride, from, to, section }: { page: number; action?: string; adminOverride?: string; from?: string; to?: string; section: string }) {
  const auditLogs = await getAuditLogs(page, {
    action: action?.trim() || undefined,
    adminOverride: adminOverride === "1",
    from: from?.trim() || undefined,
    to: to?.trim() || undefined,
  });
  return <AdminAudit auditLogs={auditLogs} page={page} action={action ?? ""} adminOverride={adminOverride ?? ""} from={from ?? ""} to={to ?? ""} section={section} />;
}
