export function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOptionalUrl(value: unknown) {
  const raw = normalizeText(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: unknown) {
  return typeof password === "string" && password.length >= 8;
}

export function parsePositiveInt(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
