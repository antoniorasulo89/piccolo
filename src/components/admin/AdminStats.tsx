import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { getAdminStats } from "@/lib/admin";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export { formatDate };
export { ShieldCheck };

type AdminStatsProps = {
  stats: Awaited<ReturnType<typeof getAdminStats>>;
};

export function AdminStats({ stats }: AdminStatsProps) {
  const statGroups = [
    ["Utenti", stats.users],
    ["Admin", stats.admins],
    ["Sospesi", stats.suspended],
    ["Post", stats.posts],
    ["Commenti", stats.comments],
    ["Report aperti", stats.reports],
    ["Gruppi", stats.groups],
    ["Gruppi privati", stats.private_groups],
    ["Chat", stats.conversations],
    ["Messaggi", stats.messages],
    ["Like", stats.likes],
    ["Follow", stats.follows],
  ];

  return (
    <section className="mt-6 grid gap-4 border-b border-charcoal/10 pb-8 lg:grid-cols-[260px_1fr]">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fern-900">
          Stato piattaforma
        </p>
        <p className="mt-3 max-w-[28ch] text-sm leading-6 text-charcoal/55">
          Vista operativa su community, messaggi, gruppi e moderazione.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statGroups.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-charcoal/10 bg-surface p-4 shadow-[0_18px_50px_-44px_oklch(22%_0.018_160)]"
          >
            <dt className="text-sm text-charcoal/45">{label}</dt>
            <dd className="mt-2 font-mono text-3xl font-semibold text-charcoal">
              {value}
            </dd>
          </div>
        ))}
      </div>
    </section>
  );
}
