/**
 * Utility functions for imagenew Worker
 */

/** Parse a string to integer with fallback */
export function toInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Clamp an integer between min and max */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

/** Split comma-separated string into array */
export function splitCsv(value?: string): string[] {
  return (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

/** Safely extract origin from a referer URL */
export function safeOrigin(referer: string | null): string | null {
  try {
    if (!referer) return null;
    const url = new URL(referer);
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

/** Convert Uint8Array to hex string */
export function bufferToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Timing-safe string comparison */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Decode base64 string to Uint8Array */
export function decodeBase64(input: string): Uint8Array {
  const bin = atob(input);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** Read 32-bit big-endian unsigned integer from bytes */
export function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

/** Truncate string with ellipsis */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

/** Pad number with leading zeros */
export function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

/** Create JSON error response */
export function jsonError(message: string, status: number): Response {
  return Response.json({ success: false, error: message }, { status });
}

/** Create JSON success response */
export function jsonSuccess<T extends object>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/** Sleep for milliseconds */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Parse size string like "1024x1024" */
export function parseSize(size: string): { width: number; height: number } | null {
  const match = size.match(/^(\d+)x(\d+)$/i);
  if (!match) return null;
  return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
}

/** Get client IP from request headers */
export function getClientIp(request: Request): string | null {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
}
