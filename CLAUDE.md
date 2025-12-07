# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloudflare Worker with frontend for AI image generation via Together AI, storing results in R2.

## Commands

```bash
npm run dev       # Local development (frontend + API)
npm run deploy    # Deploy to Cloudflare
npm run check     # TypeScript type check
npm run format    # Format with Prettier
```

## Architecture

```
imagenew/
├── public/                 # Static frontend (served by Wrangler)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js          # Main entry
│       ├── components/     # UI components (auth, generator, gallery)
│       └── lib/            # Utilities (api, storage, constants)
├── src/
│   ├── index.ts            # Worker entry + routing
│   ├── types.ts            # TypeScript definitions
│   ├── routes/
│   │   ├── generate.ts     # POST /api/generate-image
│   │   └── gallery.ts      # GET /api/gallery
│   └── lib/
│       ├── auth.ts         # Token/signature verification
│       ├── together.ts     # Together AI client
│       ├── r2.ts           # R2 storage + image sniffing
│       ├── validation.ts   # Request validation
│       ├── rate-limit.ts   # In-memory rate limiting
│       └── utils.ts        # Utility functions
└── wrangler.toml
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-image` | POST | Generate image (auth required) |
| `/api/gallery` | GET | List recent images (auth required) |
| `/images/*` | GET | Serve images from R2 |
| `/generate-image` | POST | Legacy endpoint (deprecated) |

## Security Model

**Critical**: Two separate keys exist:

1. **TOGETHER_API_KEY** (Cloudflare Secret)
   - Server-side only, NEVER exposed to frontend
   - Used in `src/lib/together.ts` to call Together AI

2. **ALLOWED_TOKENS** (wrangler.toml var)
   - User-facing API keys for frontend authentication
   - Stored in browser localStorage as `imagenew_api_key`
   - Sent via `Authorization: Bearer` header

```
Browser → [ALLOWED_TOKENS] → Worker → [TOGETHER_API_KEY] → Together AI
```

## Configuration

**Secrets** (set via `wrangler secret put` or dashboard):
- `TOGETHER_API_KEY` - Together AI API key

**Variables** (in wrangler.toml):
- `ALLOWED_TOKENS` - Comma-separated user API keys
- `PUBLIC_BASE_URL` - CDN domain for images (optional)
- `MAX_PROMPT_LENGTH`, `MAX_WIDTH`, `MAX_HEIGHT` - Limits
- `RATE_LIMIT`, `RATE_WINDOW_SEC` - Rate limiting

## Frontend Auth Flow

1. User enters API key on auth screen
2. Frontend calls `GET /api/gallery?limit=1` to verify
3. Valid key stored in `localStorage.imagenew_api_key`
4. All API calls include `Authorization: Bearer <key>`
5. On 401, key cleared and user redirected to auth screen

## Key Files

- `src/index.ts` - Main router and CORS handling
- `src/lib/auth.ts` - Token validation logic
- `src/lib/together.ts` - Together AI integration
- `public/js/lib/api.js` - Frontend API client with auth
- `public/js/components/auth.js` - Auth UI component
