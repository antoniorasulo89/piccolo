import Link from "next/link";
import { AdminDeletePostButton } from "@/components/AdminDeletePostButton";
import { PaginationLinks } from "@/components/PaginationLinks";
import { ResolveReportButton } from "@/components/ResolveReportButton";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { getAllReports } from "@/lib/reports";

type AdminReportsProps = {
  reports: Awaited<ReturnType<typeof getAllReports>>;
  page: number;
  status: string;
  section: string;
};

export function AdminReports({ reports, page, status, section }: AdminReportsProps) {
  const visibleReports = pageItems(reports);
  const basePath = `/admin?section=${section}`;

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Segnalazioni</h2>
      <p className="mt-1 text-sm text-charcoal/50">Contenuti segnalati dagli utenti, da risolvere o rimuovere.</p>

      <nav className="mt-4 flex flex-wrap gap-2">
        {(["open", "resolved", "dismissed", "all"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin?section=${section}&reportsStatus=${s}`}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition active:translate-y-px ${
              status === s
                ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                : "border border-charcoal/10 bg-paper/60 text-charcoal/68 hover:border-clay hover:bg-clay-100 hover:text-clay-900"
            }`}
          >
            {s === "all" ? "Tutte" : s === "open" ? "Aperte" : s === "resolved" ? "Risolte" : "Respinte"}
          </Link>
        ))}
      </nav>

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
                  <span className={`rounded-md px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${
                    report.status === "open" ? "bg-rose-100 text-rose-900" :
                    report.status === "resolved" ? "bg-fern-100 text-fern-900" :
                    "bg-charcoal/5 text-charcoal/50"
                  }`}>
                    {report.status === "open" ? "Aperta" : report.status === "resolved" ? "Risolta" : "Respinta"}
                  </span>
                </div>
                <p className="mt-3 w-fit rounded-md bg-charcoal/[0.06] px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-charcoal/62">
                  {report.category}
                </p>
                <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm leading-6 text-charcoal/72">{report.reason}</p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-charcoal/72">{report.post_content}</p>
                {report.resolution_note ? (
                  <p className="mt-2 rounded-lg bg-charcoal/[0.04] px-3 py-2 text-xs text-charcoal/50">Nota: {report.resolution_note}</p>
                ) : null}
              </div>
              {report.status === "open" ? (
                <div className="flex flex-wrap gap-2">
                  <ResolveReportButton reportId={report.id} />
                  <ResolveReportButton reportId={report.id} status="dismissed" />
                  <AdminDeletePostButton postId={report.post_id} />
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="p-8">
            <h3 className="font-semibold text-charcoal">Nessuna segnalazione.</h3>
            <p className="mt-1 text-sm text-charcoal/55">
              {status === "open" ? "Nessun contenuto in attesa di revisione." : "Nessuna segnalazione in questa categoria."}
            </p>
          </div>
        )}
      </div>
      <PaginationLinks page={page} hasNext={hasNextPage(reports)} basePath={basePath} pageParam="reportsPage" params={{ reportsStatus: status !== "open" ? status : undefined }} />
    </section>
  );
}
