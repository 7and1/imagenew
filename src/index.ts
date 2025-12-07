/**
 * ImageNew Worker - Together AI image generation with R2 storage
 *
 * Security architecture:
 * - TOGETHER_API_KEY: Server-side secret, never exposed to frontend
 * - ALLOWED_TOKENS: User-facing API keys for authentication
 * - All image generation happens server-side
 *
 * Routes:
 * - POST /api/generate-image - Generate images
 * - GET  /api/gallery        - List recent generations
 * - GET  /images/*           - Serve images from R2
 * - POST /generate-image     - Legacy endpoint (backward compatible)
 * - /*                       - Static assets (handled by Wrangler)
 */

import type { Env } from './types.ts';
import { jsonError } from './lib/utils.ts';
import { authorize } from './lib/auth.ts';
import { serveImage } from './lib/r2.ts';
import { handleGenerate } from './routes/generate.ts';
import { handleGallery } from './routes/gallery.ts';

/** CORS headers for API responses */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
};

/** Add CORS headers to response */
function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ============================================
    // API Routes - require authentication
    // ============================================
    if (pathname.startsWith('/api/')) {
      // Read body for POST requests (needed for auth signature verification)
      const rawBody = request.method === 'POST' ? await request.text() : '';

      // Authenticate request
      const auth = await authorize(request, env, rawBody);
      if (!auth.ok) {
        return withCors(jsonError(auth.message || 'Unauthorized', auth.status));
      }

      // Route to appropriate handler
      if (pathname === '/api/generate-image' && request.method === 'POST') {
        const response = await handleGenerate(request, env, rawBody, auth);
        return withCors(response);
      }

      if (pathname === '/api/gallery' && request.method === 'GET') {
        const response = await handleGallery(request, env);
        return withCors(response);
      }

      return withCors(jsonError('Not found', 404));
    }

    // ============================================
    // Legacy endpoint - backward compatibility
    // ============================================
    if (pathname === '/generate-image' && request.method === 'POST') {
      const rawBody = await request.text();
      const auth = await authorize(request, env, rawBody);
      if (!auth.ok) {
        return withCors(jsonError(auth.message || 'Unauthorized', auth.status));
      }

      const response = await handleGenerate(request, env, rawBody, auth);
      // Add deprecation notice header
      const withDeprecation = new Response(response.body, response);
      withDeprecation.headers.set(
        'X-Deprecation-Notice',
        'This endpoint is deprecated. Use /api/generate-image instead.'
      );
      return withCors(withDeprecation);
    }

    // ============================================
    // R2 Image serving
    // ============================================
    if (pathname.startsWith('/images/') && request.method === 'GET') {
      const key = pathname.slice(1); // Remove leading slash
      return serveImage(env, key);
    }

    // ============================================
    // Static assets - handled by Wrangler [assets]
    // If we reach here, no asset was found
    // ============================================
    // Return 404 for unmatched routes
    // Note: When [assets] is configured in wrangler.toml,
    // static files are served before reaching this Worker code
    return new Response('Not found', { status: 404 });
  },
};
