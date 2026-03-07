#!/usr/bin/env bash
# Seed rooms + test embeddings
# Talks directly to Supabase REST API — no deployment protection issues
# Usage: bash dev/setup-rooms-and-test.sh
set -e

PALACE_ID="7a5c5dd2-093e-4b66-b3ce-b026076e87a1"
SUPABASE_URL="https://dbjduzeunlfldquwwgsx.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamR1emV1bmxmbGRxdXd3Z3N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM2MDk4OSwiZXhwIjoyMDg1OTM2OTg5fQ.bpF6bTx0RWuYWjcO41XM9lPasl74G_jCZfkFeU92jPg"

REST="$SUPABASE_URL/rest/v1"
AUTH="-H \"apikey: $SERVICE_KEY\" -H \"Authorization: Bearer $SERVICE_KEY\""

supa_post() {
  local table="$1"
  local data="$2"
  curl -s -X POST "$REST/$table" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation,resolution=merge-duplicates" \
    -d "$data"
}

supa_get() {
  local path="$1"
  curl -s -X GET "$REST/$path" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY"
}

echo "==> Seeding rooms..."

echo "--- infra ---"
supa_post "rooms" '{
  "palace_id": "'"$PALACE_ID"'",
  "slug": "infra",
  "name": "Infrastructure",
  "intent": "Supabase DB, API routes, auth, deployment. Stability and backward compatibility are paramount — changes here break everything.",
  "principles": ["Never break existing API contracts","Run migrations idempotently","Auth changes require owner review"],
  "file_patterns": ["app/api/**","app/lib/**","lib/**"]
}' | python3 -m json.tool
echo ""

echo "--- blog ---"
supa_post "rooms" '{
  "palace_id": "'"$PALACE_ID"'",
  "slug": "blog",
  "name": "Blog",
  "intent": "AI persona reflections and project chronicles — not marketing. Posts are authored by personas (FLUX, FORGE, etc.), not anonymously. The blog is a first-person account of building with AI agents.",
  "principles": ["Persona-authored content only","No anonymous or corporate-voice posts","Categories are persona-led themes not topic tags"],
  "file_patterns": ["app/blog/**","app/api/blog/**","components/blog/**"]
}' | python3 -m json.tool
echo ""

echo "--- cli ---"
supa_post "rooms" '{
  "palace_id": "'"$PALACE_ID"'",
  "slug": "cli",
  "name": "CLI and MCP",
  "intent": "The mempalace CLI and MCP server. Must work offline-first and degrade gracefully when the API is unreachable. Published to npm so breaking changes require a semver bump.",
  "principles": ["Graceful degradation on API failure","Semver discipline for npm releases","MCP tools must be idempotent"],
  "file_patterns": ["packages/cli/**"]
}' | python3 -m json.tool
echo ""

echo "--- personas ---"
supa_post "rooms" '{
  "palace_id": "'"$PALACE_ID"'",
  "slug": "personas",
  "name": "Personas",
  "intent": "AI persona system. Named characters (FLUX, FORGE, etc.) with distinct voices and visual identities. Personas author blog posts and appear in memory images. Character consistency across sessions is critical.",
  "principles": ["Character descriptions must be verbatim for visual consistency","Personas have distinct voices — never bland or corporate","Each persona owns specific content domains"],
  "file_patterns": ["app/api/personas/**","components/persona/**","app/personas/**"]
}' | python3 -m json.tool
echo ""

echo "==> Verifying rooms in DB..."
supa_get "rooms?palace_id=eq.$PALACE_ID&select=slug,name,intent" | python3 -m json.tool
echo ""

echo "==> Done. Rooms are seeded directly in Supabase."
echo ""
echo "Next steps:"
echo "  1. Test /api/rooms/match via the preview URL (once unprotected or merged):"
echo "     curl -s 'https://m.cuer.ai/api/rooms/match?files=app/api/store/route.js' \\"
echo "       -H 'Authorization: Bearer $PALACE_ID' | python3 -m json.tool"
echo ""
echo "  2. Test embed-backfill (requires LM Studio at 192.168.86.30:1234):"
echo "     cd packages/cli && npx ts-node src/index.ts embed-backfill --limit 10"
echo ""
echo "  3. Test keyword search (no LM Studio needed):"
echo "     curl -s -X POST 'https://m.cuer.ai/api/search' \\"
echo "       -H 'Authorization: Bearer $PALACE_ID' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"query\":\"embeddings\",\"limit\":5}' | python3 -m json.tool"
