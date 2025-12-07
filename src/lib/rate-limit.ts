/**
 * In-memory rate limiting (per worker isolate)
 *
 * Note: This is not durable across worker restarts or isolates.
 * For production, consider using Cloudflare Rate Limiting or KV.
 */

/** Rate limit bucket storage */
const rateBuckets: Map<string, { count: number; resetAt: number }> = new Map();

/** Concurrency counter */
export const inFlightCounter = { value: 0 };

/**
 * Check if request should be rate limited
 *
 * @param key - Identifier for rate limiting (token or IP)
 * @param limit - Maximum requests per window
 * @param windowMs - Window duration in milliseconds
 * @returns true if rate limited
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (bucket.count >= limit) return true;

  bucket.count += 1;
  return false;
}

/**
 * Check if max concurrent requests exceeded
 *
 * @param maxInflight - Maximum concurrent requests allowed
 * @returns true if at capacity
 */
export function isAtCapacity(maxInflight: number): boolean {
  return inFlightCounter.value >= maxInflight;
}

/** Increment in-flight counter */
export function incrementInflight(): void {
  inFlightCounter.value += 1;
}

/** Decrement in-flight counter (safe, won't go below 0) */
export function decrementInflight(): void {
  inFlightCounter.value = Math.max(0, inFlightCounter.value - 1);
}
