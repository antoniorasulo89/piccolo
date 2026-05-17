import { PaginationLinks } from "@/components/PaginationLinks";
import { getAuditLogs } from "@/lib/admin";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { formatDate } from "./AdminStats";

type AdminAuditProps = {
  auditLogs: Awaited<ReturnType<typeof getAuditLogs>>;
  page: number;
  paginationParams: Record<string, number>;
};

export function AdminAudit({ auditLogs, page, paginationParams }: AdminAuditProps) {
  const visibleAuditLogs = pageItems(auditLogs);

  return (
    <section id="audit" className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Audit admin</h2>
      <p className="mt-1 text-sm text-charcoal/50">Ultime azioni sensibili eseguite dagli amministratori.</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        {visibleAuditLogs.length ? (
          visibleAuditLogs.map((log) => (
            <div key={log.id} className="border-b border-charcoal/10 p-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-charcoal">{log.admin_name}</p>
                <span className="rounded-md bg-charcoal/[0.06] px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-charcoal/62">
                  {log.action}
                </span>
              </div>
              <p className="mt-2 text-sm text-charcoal/55">
                {log.target_type} #{log.target_id}
                {log.note ? ` / ${log.note}` : ""} / {formatDate(log.created_at)}
              </p>
            </div>
          ))
        ) : (
          <div className="p-8 text-sm text-charcoal/55">Nessuna azione registrata.</div>
        )}
      </div>
      <PaginationLinks page={page} hasNext={hasNextPage(auditLogs)} basePath="/admin" pageParam="auditPage" params={paginationParams} />
    </section>
  );
}
