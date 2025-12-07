/**
 * Authentication and authorization functions
 */

import type { Env, AuthResult } from '../types.ts';
import { splitCsv, safeOrigin, bufferToHex, timingSafeEqual } from './utils.ts';

/** Extract API token from request (header or query param) */
export function extractToken(request: Request): string | null {
  // Check Authorization: Bearer header
  const auth = request.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  // Check X-Api-Key header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return apiKey.trim();

  // Check query parameter
  const url = new URL(request.url);
  const qpToken = url.searchParams.get('token');
  return qpToken ? qpToken.trim() : null;
}

/** Verify HMAC-SHA256 signature */
export async function verifySignature(
  rawBody: string,
  secret: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const bodyData = encoder.encode(rawBody);
  const digest = await crypto.subtle.sign('HMAC', key, bodyData);
  const hex = bufferToHex(new Uint8Array(digest));
  return timingSafeEqual(hex, signature.trim());
}

/**
 * Authorize request against configured tokens, referers, and signature
 *
 * Security model:
 * - ALLOWED_TOKENS: User-facing API keys (stored in user's browser)
 * - TOGETHER_API_KEY: Server-side secret (never exposed to frontend)
 * - SIGNING_SECRET: Optional additional verification for request integrity
 */
export async function authorize(
  request: Request,
  env: Env,
  rawBody: string
): Promise<AuthResult> {
  // Token check - validates user-provided API key against ALLOWED_TOKENS
  const tokens = splitCsv(env.ALLOWED_TOKENS);
  const providedToken = extractToken(request);

  if (tokens.length > 0) {
    if (!providedToken || !tokens.includes(providedToken)) {
      return { ok: false, status: 401, message: 'Invalid or missing API key' };
    }
  }

  // Referer allowlist - optional additional security layer
  const referers = splitCsv(env.ALLOWED_REFERERS).map(r => r.toLowerCase());
  if (referers.length > 0) {
    const ref = request.headers.get('referer');
    const origin = safeOrigin(ref);
    if (!origin || !referers.includes(origin)) {
      return { ok: false, status: 403, message: 'Referer not allowed' };
    }
  }

  // Optional HMAC signature verification (for request body integrity)
  if (env.SIGNING_SECRET) {
    const signature = request.headers.get('x-signature');
    if (!signature) {
      return { ok: false, status: 401, message: 'Missing signature' };
    }
    const valid = await verifySignature(rawBody, env.SIGNING_SECRET, signature);
    if (!valid) {
      return { ok: false, status: 401, message: 'Invalid signature' };
    }
  }

  return { ok: true, status: 200, token: providedToken ?? undefined };
}
