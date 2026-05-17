type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((hit) => now - hit < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

export function rateLimitKey(request: Request, action: string, subject?: string | number) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("true-client-ip")?.trim() ||
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    "local";
  return [action, subject ?? "anon", ip].join(":");
}
