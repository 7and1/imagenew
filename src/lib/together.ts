/**
 * Together AI API client
 */

import type { Env } from '../types.ts';
import { wait } from './utils.ts';

interface GenerateParams {
  prompt: string;
  width: number;
  height: number;
  n: number;
  model: string;
  seed?: number;
  steps?: number;
}

/**
 * Generate images using Together AI API
 *
 * Security note: TOGETHER_API_KEY is a server-side secret that is never
 * exposed to the frontend. All requests to Together AI go through this
 * server-side function.
 *
 * @returns Array of base64-encoded image data
 */
export async function generateWithTogether(
  env: Env,
  params: GenerateParams
): Promise<string[]> {
  const apiKey = env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY is not configured');
  }

  const url = 'https://api.together.xyz/v1/images/generations';

  const payload: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    width: params.width,
    height: params.height,
    n: params.n,
    response_format: 'b64_json', // Always request base64 to avoid exposing Together URLs
  };

  if (params.seed !== undefined) payload.seed = params.seed;
  if (params.steps !== undefined) payload.steps = params.steps;

  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Retry on rate limit or server error
      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxAttempts - 1) {
          throw new Error(`Together unavailable (${res.status})`);
        }
        await wait(Math.pow(2, attempt) * 500);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Together error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as { data?: { b64_json?: string | null }[] };
      const images: string[] = data?.data?.map(d => d?.b64_json).filter(Boolean) as string[];

      if (!images || images.length === 0) {
        throw new Error('Together returned empty image data');
      }

      return images;
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      await wait(Math.pow(2, attempt) * 750);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Generation failed after retries');
}
