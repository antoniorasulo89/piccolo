import Link from "next/link";
import type { FeedScope } from "@/lib/queries";

type FeedTabsProps = {
  scope: FeedScope;
};

const tabs: Array<{ href: string; value: FeedScope; label: string }> = [
  { href: "/feed", value: "following", label: "Seguiti" },
  { href: "/feed?scope=all", value: "all", label: "Tutti" },
];

export function FeedTabs({ scope }: FeedTabsProps) {
  return (
    <nav
      aria-label="Filtro feed"
      className="grid grid-cols-2 rounded-lg border border-charcoal/10 bg-paper/88 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          className={`inline-flex h-10 items-center justify-center rounded-md text-sm font-semibold transition active:scale-[0.98] ${
            scope === tab.value
              ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay),0_12px_34px_-26px_oklch(22%_0.018_160)]"
              : "text-charcoal/58 hover:bg-clay-100 hover:text-clay-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
