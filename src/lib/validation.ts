/**
 * Request validation functions
 */

import type { Env, GenerateRequestBody, ValidationResult, ValidatedRequest } from '../types.ts';
import { toInt, splitCsv, parseSize, clampInt } from './utils.ts';

/** Check if prompt contains blocked content */
export function isPromptBlocked(prompt: string, blacklist?: string): boolean {
  const blocked = splitCsv(blacklist);
  if (blocked.length === 0) return false;
  const lower = (prompt || '').toLowerCase();
  return blocked.some(term => lower.includes(term.toLowerCase()));
}

/** Validate and normalize image generation request */
export function validateRequest(body: GenerateRequestBody, env: Env): ValidationResult {
  // Validate prompt
  const prompt = (body.prompt || '').trim();
  const maxPromptLength = toInt(env.MAX_PROMPT_LENGTH, 500);

  if (!prompt) {
    return { ok: false, message: 'Prompt is required' };
  }

  if (prompt.length > maxPromptLength) {
    return { ok: false, message: `Prompt too long (>${maxPromptLength} chars)` };
  }

  // Parse dimensions
  let width = body.width;
  let height = body.height;

  // Support "size" parameter like "1024x1024"
  if (body.size && (!width || !height)) {
    const parsed = parseSize(body.size);
    width = parsed?.width ?? width;
    height = parsed?.height ?? height;
  }

  // Apply defaults
  width = width ?? 1024;
  height = height ?? 1024;

  // Validate dimension bounds
  const maxW = toInt(env.MAX_WIDTH, 2048);
  const maxH = toInt(env.MAX_HEIGHT, 2048);

  if (width < 256 || width > maxW || height < 256 || height > maxH) {
    return { ok: false, message: `Invalid dimensions (min 256, max ${maxW}x${maxH})` };
  }

  // Clamp n between 1-4
  const n = clampInt(body.n ?? 1, 1, 4);

  // Model with fallback
  const model = body.model || env.DEFAULT_MODEL || 'black-forest-labs/FLUX.1-schnell-Free';

  const value: ValidatedRequest = {
    prompt,
    width,
    height,
    n,
    model,
    seed: body.seed,
    steps: body.steps,
  };

  return { ok: true, value };
}
