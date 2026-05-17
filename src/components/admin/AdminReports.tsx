import Link from "next/link";
import { AdminDeletePostButton } from "@/components/AdminDeletePostButton";
import { PaginationLinks } from "@/components/PaginationLinks";
import { ResolveReportButton } from "@/components/ResolveReportButton";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { getOpenReports } from "@/lib/reports";

type AdminReportsProps = {
  reports: Awaited<ReturnType<typeof getOpenReports>>;
  page: number;
  paginationParams: Record<string, number>;
};

export function AdminReports({ reports, page, paginationParams }: AdminReportsProps) {
  const visibleReports = pageItems(reports);

  return (
    <div id="segnalazioni">
      <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Segnalazioni</h2>
      <p className="mt-1 text-sm text-charcoal/50">Contenuti segnalati dagli utenti, da risolvere o rimuovere.</p>

      <div className="mt-4 rounded-lg border border-charcoal/10 bg-surface">
        {visibleReports.length ? (
          visibleReports.map((report) => (
            <article key={report.id} className="grid gap-4 border-b border-charcoal/10 p-4 last:border-b-0">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/post/${report.post_id}`} className="font-semibold text-charcoal underline-offset-4 hover:underline">
                      Post #{report.post_id}
                    </Link>
                    <p className="mt-1 text-xs text-charcoal/45">
                      Autore: {report.author_name} / Segnalato da {report.reporter_name}
                    </p>
                  </div>
                  <p className="rounded-md bg-rose-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-rose-900">
                    Aperta
                  </p>
                </div>
                <p className="mt-3 w-fit rounded-md bg-charcoal/[0.06] px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-charcoal/62">
                  {report.category}
                </p>
                <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm leading-6 text-charcoal/72">{report.reason}</p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-charcoal/72">{report.post_content}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ResolveReportButton reportId={report.id} />
                <ResolveReportButton reportId={report.id} status="dismissed" />
                <AdminDeletePostButton postId={report.post_id} />
              </div>
            </article>
          ))
        ) : (
          <div className="p-8">
            <h3 className="font-semibold text-charcoal">Nessuna segnalazione aperta.</h3>
            <p className="mt-1 text-sm text-charcoal/55">Qui compariranno solo i contenuti che richiedono revisione.</p>
          </div>
        )}
      </div>
      <PaginationLinks page={page} hasNext={hasNextPage(reports)} basePath="/admin" pageParam="reportsPage" params={paginationParams} />
    </div>
  );
}
