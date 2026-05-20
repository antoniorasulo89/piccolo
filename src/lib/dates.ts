export const APP_TIME_ZONE = "Europe/Rome";

const DB_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function parseDbTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const normalized = DB_TIMESTAMP_RE.test(value) ? `${value.replace(" ", "T")}Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAppDateTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  fallback = "—",
) {
  const date = parseDbTimestamp(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("it-IT", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(date);
}

export function relativeTimeFromNow(value: string) {
  const date = parseDbTimestamp(value);
  if (!date) return "ora";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(Math.floor(diff / 60000), 0);

  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h fa`;

  const days = Math.floor(hours / 24);
  return `${days} g fa`;
}
