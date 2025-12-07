# imagenew (CF Worker + Together → R2)

Minimal Worker that calls Together for generation (`response_format=b64_json`), validates and stores the binary into Cloudflare R2, and returns a controlled URL (signed or CDN under your domain).

## Quick start

```bash
cd /Volumes/SSD/dev/newdev/imagenew
npm install
wrangler dev --local
# POST http://127.0.0.1:8787/generate-image with body {"prompt":"A robot"}
```

Deploy:
```bash
wrangler deploy
```

## Environment

Set via `wrangler.toml` or dashboard secrets:

- `TOGETHER_API_KEY` **(secret)** – Together token.
- `R2` **(binding)** – R2 bucket.
- `PUBLIC_BASE_URL` – If set, URLs will be `${PUBLIC_BASE_URL}/<key>` (public CDN domain). Leave blank to return a signed URL.
- `SIGNED_URL_TTL` – Signed URL ttl seconds (default 86400) when `PUBLIC_BASE_URL` is empty.
- `ALLOWED_TOKENS` – Comma list of API tokens. Required if set; taken from `Authorization: Bearer` or `X-Api-Key` or `?token=`.
- `ALLOWED_REFERERS` – Comma list of allowed origins (e.g. `https://app.example.com`).
- `SIGNING_SECRET` – Optional HMAC secret; if set, require `x-signature` header = hex(HMAC-SHA256(body)).
- `PROMPT_BLACKLIST` – Comma list of forbidden substrings.
- `DEFAULT_MODEL` – Defaults to `black-forest-labs/FLUX.1-schnell-Free`.
- Limits: `MAX_PROMPT_LENGTH` (500), `MAX_WIDTH`/`MAX_HEIGHT` (2048), `MAX_INFLIGHT` (4), `RATE_LIMIT` (30 req/window), `RATE_WINDOW_SEC` (60s).

## API

`POST /generate-image`

Body:
```json
{
  "prompt": "A glowing cyberpunk alley",
  "width": 1024,
  "height": 768,
  "n": 1,
  "model": "black-forest-labs/FLUX.1-schnell-Free",
  "seed": 123,
  "steps": 4
}
```
Notes:
- `size` like `"1024x1024"` is also accepted when width/height omitted.
- `response_format` is forced to `b64_json`; Together URLs are discarded.

Response:
```json
{
  "success": true,
  "url": "https://cdn.example.com/images/gen/2025/12/07/uuid.png",
  "key": "images/gen/2025/12/07/uuid.png",
  "meta": { "prompt": "...", "model": "...", "seed": 123, "createdAt": "2025-12-07T00:00:00Z" },
  "items": [ { "url": "...", "key": "...", "mime": "image/png", "width": 1024, "height": 768, "meta": { ... } } ]
}
```

## What it enforces
- Auth: token check, optional referer allowlist and HMAC body signature.
- Validation: prompt length, size bounds, blacklist, `n` clamped to 1–4.
- Rate limiting: per token/IP sliding bucket in-memory (per worker isolate).
- Concurrency: rejects when `MAX_INFLIGHT` in-flight generations.
- Safety: base64 decode, MIME + dimension sniff (PNG/JPEG), empty-payload guard.
- Storage: date-prefixed keys `images/gen/YYYY/MM/DD/<uuid>.png|jpg`, cache-control 1y, metadata (prompt/model/seed/size/createdAt).
- URLs: signed URL when `PUBLIC_BASE_URL` blank; otherwise uses your CDN domain so frontends never see Together URLs.

## Optional next steps
1) Add KV/Queues for durable logging and quota tracking.
2) Wire Cloudflare Access/Rate Limiting Rules in front of the Worker for stronger enforcement.
3) Add an image-derivative endpoint using Workers Image Resizing for on-the-fly thumbnails.
