import { PaginationLinks } from "@/components/PaginationLinks";
import { getAuditLogs } from "@/lib/admin";
import { hasNextPage, pageItems } from "@/lib/pagination";
import { formatDate } from "./AdminStats";

type AdminAuditProps = {
  auditLogs: Awaited<ReturnType<typeof getAuditLogs>>;
  page: number;
  action: string;
  adminOverride: string;
  from: string;
  to: string;
  section: string;
};

export function AdminAudit({ auditLogs, page, action, adminOverride, from, to, section }: AdminAuditProps) {
  const visibleAuditLogs = pageItems(auditLogs);
  const basePath = `/admin?section=${section}`;

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-charcoal">Audit admin</h2>
      <p className="mt-1 text-sm text-charcoal/50">Azioni sensibili eseguite dagli amministratori, filtrabili per azione e override.</p>

      <form method="GET" action="/admin" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto] sm:items-end">
        <input type="hidden" name="section" value={section} />
        <input
          type="text"
          name="auditAction"
          defaultValue={action}
          placeholder="Azione (es. group_invite_create)"
          className="h-9 w-full rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal placeholder:text-charcoal/32"
        />
        <label className="flex items-center gap-2 text-sm text-charcoal/60">
          <input type="checkbox" name="auditOverride" value="1" defaultChecked={adminOverride === "1"} className="rounded" />
          Solo admin override
        </label>
        <input
          type="date"
          name="auditFrom"
          defaultValue={from}
          className="h-9 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal"
        />
        <input
          type="date"
          name="auditTo"
          defaultValue={to}
          className="h-9 rounded-lg border border-charcoal/10 bg-paper px-3 text-sm text-charcoal"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-charcoal/10 bg-paper/70 px-3 text-sm font-semibold text-charcoal/70 transition hover:border-clay hover:bg-clay-100 hover:text-clay-900"
        >
          Filtra
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-charcoal/10 bg-surface">
        {visibleAuditLogs.length ? (
          visibleAuditLogs.map((log) => (
            <div key={log.id} className="border-b border-charcoal/10 p-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-charcoal">{log.admin_name}</p>
                <span className="rounded-md bg-charcoal/[0.06] px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-charcoal/62">
                  {log.action}
                </span>
                {log.admin_override ? (
                  <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                    Override
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-charcoal/55">
                {log.target_type} #{log.target_id}
                {log.note && !log.note.includes("admin_override=true") ? ` / ${log.note}` : ""}
                {" / "}{formatDate(log.created_at)}
              </p>
            </div>
          ))
        ) : (
          <div className="p-8 text-sm text-charcoal/55">Nessuna azione registrata con questi filtri.</div>
        )}
      </div>
      <PaginationLinks
        page={page}
        hasNext={hasNextPage(auditLogs)}
        basePath={basePath}
        pageParam="auditPage"
        params={{
          auditAction: action || undefined,
          auditOverride: adminOverride || undefined,
          auditFrom: from || undefined,
          auditTo: to || undefined,
        }}
      />
    </section>
  );
}
