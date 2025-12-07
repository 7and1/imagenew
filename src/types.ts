/**
 * TypeScript type definitions for imagenew Worker
 */

export type Env = {
  TOGETHER_API_KEY: string;
  R2: R2Bucket;
  PUBLIC_BASE_URL?: string;
  SIGNED_URL_TTL?: string;
  ALLOWED_TOKENS?: string;
  ALLOWED_REFERERS?: string;
  PROMPT_BLACKLIST?: string;
  DEFAULT_MODEL?: string;
  MAX_PROMPT_LENGTH?: string;
  MAX_WIDTH?: string;
  MAX_HEIGHT?: string;
  MAX_INFLIGHT?: string;
  RATE_LIMIT?: string;
  RATE_WINDOW_SEC?: string;
  SIGNING_SECRET?: string;
};

export interface GenerateRequestBody {
  prompt: string;
  width?: number;
  height?: number;
  size?: string; // optional "1024x1024"
  n?: number;
  model?: string;
  seed?: number;
  steps?: number;
}

export interface GeneratedItem {
  url: string;
  key: string;
  mime: string;
  width: number;
  height: number;
  meta: {
    prompt: string;
    model: string;
    seed?: number;
    createdAt: string;
  };
}

export interface GenerateResponse {
  success: true;
  url: string;
  key: string;
  meta: GeneratedItem['meta'];
  items: GeneratedItem[];
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
  status: number;
  token?: string;
}

export type ValidationResult =
  | { ok: true; value: ValidatedRequest }
  | { ok: false; message: string };

export interface ValidatedRequest {
  prompt: string;
  width: number;
  height: number;
  n: number;
  model: string;
  seed?: number;
  steps?: number;
}

export interface GalleryImage {
  key: string;
  url: string;
  size: number;
  uploaded: string;
  metadata?: Record<string, string>;
}

export interface GalleryResponse {
  images: GalleryImage[];
  limit: number;
  offset: number;
}
