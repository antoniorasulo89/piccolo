export function safeRedirectPath(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;
  if (value.toLowerCase().startsWith("/%2f")) return null;
  return value;
}
