import Link from "next/link";

type ExploreFiltersProps = {
  active: string;
  query: string;
};

const filters = [
  { key: "all", label: "Tutti" },
  { key: "following", label: "Gia seguiti" },
  { key: "new", label: "Nuovi" },
];

export function ExploreFilters({ active, query }: ExploreFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (filter.key !== "all") params.set("filter", filter.key);
        const href = `/explore${params.toString() ? `?${params.toString()}` : ""}`;
        const selected = active === filter.key;

        return (
          <Link
            key={filter.key}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition active:translate-y-px ${
              selected
                ? "bg-charcoal text-paper shadow-[inset_0_3px_0_var(--clay)]"
                : "border border-charcoal/10 bg-paper/60 text-charcoal/68 hover:border-clay hover:bg-clay-100 hover:text-clay-900"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
