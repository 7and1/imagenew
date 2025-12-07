/**
 * POST /api/generate-image - Image generation endpoint
 */

import type { Env, AuthResult, GenerateRequestBody, GeneratedItem } from '../types.ts';
import { jsonError, toInt, getClientIp } from '../lib/utils.ts';
import { validateRequest, isPromptBlocked } from '../lib/validation.ts';
import { generateWithTogether } from '../lib/together.ts';
import { storeImage } from '../lib/r2.ts';
import {
  isRateLimited,
  isAtCapacity,
  incrementInflight,
  decrementInflight,
} from '../lib/rate-limit.ts';

/**
 * Handle image generation request
 *
 * Flow:
 * 1. Rate limit check (per token/IP)
 * 2. Prompt validation and blacklist check
 * 3. Concurrency guard
 * 4. Call Together AI (server-side, API key never exposed)
 * 5. Store to R2
 * 6. Return controlled URL
 */
export async function handleGenerate(
  request: Request,
  env: Env,
  rawBody: string,
  auth: AuthResult
): Promise<Response> {
  // Parse request body
  let body: GenerateRequestBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  // Rate limiting
  const rateKey = auth.token || getClientIp(request) || 'anon';
  const rateLimit = toInt(env.RATE_LIMIT, 30);
  const rateWindow = toInt(env.RATE_WINDOW_SEC, 60) * 1000;

  if (isRateLimited(rateKey, rateLimit, rateWindow)) {
    return jsonError('Rate limit exceeded', 429);
  }

  // Prompt blacklist check
  if (isPromptBlocked(body.prompt || '', env.PROMPT_BLACKLIST)) {
    return jsonError('Prompt contains blocked content', 400);
  }

  // Validate request parameters
  const validation = validateRequest(body, env);
  if (!validation.ok) {
    return jsonError(validation.message, 400);
  }

  const { prompt, width, height, n, model, seed, steps } = validation.value;

  // Concurrency guard
  const maxInflight = toInt(env.MAX_INFLIGHT, 4);
  if (isAtCapacity(maxInflight)) {
    return jsonError('Too many concurrent generations, try again shortly', 429);
  }

  incrementInflight();
  try {
    // Generate images via Together AI
    // Note: TOGETHER_API_KEY is used here server-side and never exposed to client
    const b64Images = await generateWithTogether(env, {
      prompt,
      width,
      height,
      n,
      model,
      seed,
      steps,
    });

    // Store all generated images to R2
    const url = new URL(request.url);
    const items: GeneratedItem[] = [];

    for (const b64 of b64Images) {
      const item = await storeImage(env, {
        prompt,
        width,
        height,
        model,
        seed,
        b64,
        requestOrigin: url.origin,
      });
      items.push(item);
    }

    // Return response with primary image and all items
    const primary = items[0];
    return Response.json({
      success: true,
      url: primary.url,
      key: primary.key,
      meta: primary.meta,
      items,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonError(`Failed to generate image: ${message}`, 500);
  } finally {
    decrementInflight();
  }
}
