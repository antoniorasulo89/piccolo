import Link from "next/link";

type PaginationLinksProps = {
  page: number;
  hasNext: boolean;
  basePath: string;
  pageParam?: string;
  params?: Record<string, string | number | undefined>;
};

function hrefFor(
  basePath: string,
  params: Record<string, string | number | undefined>,
  page: number,
  pageParam: string,
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  if (page > 0) {
    query.set(pageParam, String(page));
  } else {
    query.delete(pageParam);
  }

  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function PaginationLinks({
  page,
  hasNext,
  basePath,
  pageParam = "page",
  params = {},
}: PaginationLinksProps) {
  if (page === 0 && !hasNext) return null;

  return (
    <nav className="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Paginazione">
      {page > 0 ? (
        <Link
          href={hrefFor(basePath, params, page - 1, pageParam)}
          className="inline-flex h-10 items-center rounded-lg border border-charcoal/10 px-4 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal"
        >
          Precedente
        </Link>
      ) : (
        <span />
      )}
      {hasNext ? (
        <Link
          href={hrefFor(basePath, params, page + 1, pageParam)}
          className="inline-flex h-10 items-center rounded-lg bg-fern-700 px-4 text-sm font-semibold text-paper transition hover:bg-fern-900"
        >
          Successiva
        </Link>
      ) : null}
    </nav>
  );
}
