# Memory Palace API Reference

Base URL: `https://m.cuer.ai`

All external (non-dashboard) routes authenticate via `gk_` guest key, either as `Authorization: Bearer gk_...` header or `?auth=gk_...` query parameter.

## POST /api/store

Store a new memory. Generates QR code, computes embedding, creates capsule.

**Body:**
```json
{
  "session_name": "Typography Unification",
  "agent": "claude-code",
  "status": "complete",
  "outcome": "Unified all fonts to DM Sans, removed serif remnants",
  "built": ["Font replacement across routes", "Weight normalization 500-600"],
  "decisions": ["DM Sans as sole typeface", "Remove Cormorant Garamond"],
  "next_steps": ["Visual QA across all routes", "Verify no serif remnants"],
  "files": ["app/globals.css", "components/typography.tsx"],
  "blockers": [],
  "conversation_context": "Optional conversation excerpt",
  "metadata": {
    "room": "frontend"
  }
}
```

**Response:** `{ short_id, capsule_url, qr_url }`

## POST /api/search

Semantic search across all memories in the palace (768-dim nomic embeddings).

**Body:**
```json
{
  "query": "typography font decisions",
  "limit": 5
}
```

**Response:** Array of memories sorted by similarity, each with `short_id`, `session_name`, `agent`, `content`, `similarity_score`.

## GET /api/recall

Retrieve recent memories for session continuity.

**Query params:** `auth=gk_...&limit=5`

**Response:** Array of recent memories with full content.

## GET /api/rooms

List all rooms with intent, principles, and activity stats.

**Query params:** `auth=gk_...`

**Response:** Array of rooms with `slug`, `name`, `intent`, `principles`, `decisions`, `memory_count`, `last_activity`.

## GET /api/rooms/match

Match files to governing rooms.

**Query params:** `auth=gk_...&files=app/api/store/route.js,lib/auth.js`

**Response:** Matched rooms with `intent`, `principles`, `decisions` for each file.

## POST /api/rooms (Create/Update)

Upsert a room definition.

**Body:**
```json
{
  "slug": "frontend",
  "name": "Frontend",
  "intent": "User-facing React components and pages",
  "principles": ["Persona-authored content only", "DM Sans typeface"],
  "file_patterns": ["app/**", "components/**"]
}
```

## Other Routes (gk_ auth)

- `POST /api/secure-store` — Encrypted memory storage
- `GET /api/recall` — Recent memories
- `POST /api/upload` — File attachments
- `POST /api/memories/embed` — Compute/backfill embeddings
- `GET /api/agents` — List registered agents
- `GET /api/palace/agents` — Palace-specific agent configs
- `POST /api/blog/drafts` — Submit blog draft
- `POST /api/context` — Get aggregated context
- `POST /api/ingest` — Bulk memory import

## Dashboard Routes (Supabase session auth)

All `/dashboard` routes use Supabase session cookies + palace ownership verification. Never use `gk_` tokens for dashboard access.

## Authentication Model

| Caller | Mechanism |
|--------|-----------|
| External (CLI, agents) | `gk_` token via header or query param |
| Dashboard (browser) | Supabase session cookie + ownership check |

`palace_id` is never accepted as auth — only as an identifier verified against ownership.
