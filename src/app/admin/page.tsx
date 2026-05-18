import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminGroups } from "@/components/admin/AdminGroups";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { getAdminComments, getAdminPosts, getAdminStats, getAdminUsers, getAuditLogs } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { parsePage } from "@/lib/pagination";
import { getOpenReports } from "@/lib/reports";

type AdminPageProps = {
  searchParams: Promise<{
    usersPage?: string;
    commentsPage?: string;
    auditPage?: string;
    reportsPage?: string;
    postsPage?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/feed");

  const params = await searchParams;
  const usersPage = parsePage(params.usersPage);
  const commentsPage = parsePage(params.commentsPage);
  const auditPage = parsePage(params.auditPage);
  const reportsPage = parsePage(params.reportsPage);
  const postsPage = parsePage(params.postsPage);
  const paginationParams = { usersPage, commentsPage, auditPage, reportsPage, postsPage };

  const [stats, users, posts, comments, reports, auditLogs] = await Promise.all([
    getAdminStats(),
    getAdminUsers(usersPage),
    getAdminPosts(postsPage),
    getAdminComments(commentsPage),
    getOpenReports(reportsPage),
    getAuditLogs(auditPage),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border border-charcoal/10 bg-charcoal text-paper shadow-[0_28px_90px_-58px_oklch(22%_0.018_160)]">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_420px]">
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
              Gli utenti standard non vedono il link e non possono accedere alle API admin.
            </p>
          </div>

          <div className="grid gap-3 self-end">
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
            <div className="grid gap-2 sm:grid-cols-2">
              <a href="#utenti" className="rounded-lg border border-paper/10 px-3 py-2 text-sm font-semibold text-paper/72 transition hover:bg-paper/8 hover:text-paper">Utenti</a>
              <a href="#segnalazioni" className="rounded-lg border border-paper/10 px-3 py-2 text-sm font-semibold text-paper/72 transition hover:bg-paper/8 hover:text-paper">Segnalazioni</a>
              <a href="#contenuti" className="rounded-lg border border-paper/10 px-3 py-2 text-sm font-semibold text-paper/72 transition hover:bg-paper/8 hover:text-paper">Contenuti</a>
              <a href="#audit" className="rounded-lg border border-paper/10 px-3 py-2 text-sm font-semibold text-paper/72 transition hover:bg-paper/8 hover:text-paper">Audit</a>
              <a href="#gruppi" className="rounded-lg border border-paper/10 px-3 py-2 text-sm font-semibold text-paper/72 transition hover:bg-paper/8 hover:text-paper sm:col-span-2">Gruppi</a>
            </div>
          </div>
        </div>
      </section>

      <AdminStats stats={stats} />

      <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
        <div>
          <AdminUsers users={users} page={usersPage} currentUserId={currentUser.id} paginationParams={paginationParams} />

          <section id="gruppi" className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Gruppi</h2>
            <p className="mt-1 text-sm text-charcoal/50">Tutti i gruppi della piattaforma, pubblici e privati.</p>
            <AdminGroups />
          </section>

          <AdminContent comments={comments} posts={posts} commentsPage={commentsPage} postsPage={postsPage} paginationParams={paginationParams} />
          <AdminAudit auditLogs={auditLogs} page={auditPage} paginationParams={paginationParams} />
        </div>

        <div>
          <AdminReports reports={reports} page={reportsPage} paginationParams={paginationParams} />
        </div>
      </section>
    </main>
  );
}
