export const PAGE_SIZE = 20;
export const PAGE_LIMIT = PAGE_SIZE + 1;

export function parsePage(value: string | undefined) {
  const page = Number(value ?? 0);
  return Number.isFinite(page) ? Math.max(Math.trunc(page), 0) : 0;
}

export function pageItems<T>(items: T[]) {
  return items.slice(0, PAGE_SIZE);
}

export function hasNextPage(items: unknown[]) {
  return items.length > PAGE_SIZE;
}
