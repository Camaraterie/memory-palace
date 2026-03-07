#!/usr/bin/env bash
# Seed rooms + test embeddings after the migration runs
# Usage: bash dev/setup-rooms-and-test.sh
set -e

PALACE_ID="7a5c5dd2-093e-4b66-b3ce-b026076e87a1"
API="https://m.cuer.ai"

echo "==> Seeding rooms..."

curl -sf -X POST "$API/api/rooms" \
  -H "Authorization: Bearer $PALACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "infra",
    "name": "Infrastructure",
    "intent": "Supabase DB, API routes, auth, deployment. Stability and backward compatibility are paramount — changes here break everything.",
    "principles": [
      "Never break existing API contracts",
      "Run migrations idempotently",
      "Auth changes require owner review"
    ],
    "file_patterns": ["app/api/**", "app/lib/**", "lib/**"]
  }' | python3 -m json.tool
echo ""

curl -sf -X POST "$API/api/rooms" \
  -H "Authorization: Bearer $PALACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "blog",
    "name": "Blog",
    "intent": "AI persona reflections and project chronicles — not marketing. Posts are authored by personas (FLUX, FORGE, etc.), not anonymously. The blog is a first-person account of building with AI agents.",
    "principles": [
      "Persona-authored content only",
      "No anonymous or corporate-voice posts",
      "Categories are persona-led themes, not topic tags"
    ],
    "file_patterns": ["app/blog/**", "app/api/blog/**", "components/blog/**"]
  }' | python3 -m json.tool
echo ""

curl -sf -X POST "$API/api/rooms" \
  -H "Authorization: Bearer $PALACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "cli",
    "name": "CLI and MCP",
    "intent": "The mempalace CLI and MCP server. Must work offline-first and degrade gracefully when the API is unreachable. Published to npm so breaking changes require a semver bump.",
    "principles": [
      "Graceful degradation on API failure",
      "Semver discipline for npm releases",
      "MCP tools must be idempotent"
    ],
    "file_patterns": ["packages/cli/**"]
  }' | python3 -m json.tool
echo ""

curl -sf -X POST "$API/api/rooms" \
  -H "Authorization: Bearer $PALACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "personas",
    "name": "Personas",
    "intent": "AI persona system. Named characters (FLUX, FORGE, etc.) with distinct voices and visual identities. Personas author blog posts and appear in memory images. Character consistency across sessions is critical.",
    "principles": [
      "Character descriptions must be verbatim for visual consistency",
      "Personas have distinct voices — never bland or corporate",
      "Each persona owns specific content domains"
    ],
    "file_patterns": ["app/api/personas/**", "components/persona/**", "app/personas/**"]
  }' | python3 -m json.tool
echo ""

echo "==> Listing rooms to verify..."
curl -sf "$API/api/rooms" \
  -H "Authorization: Bearer $PALACE_ID" | python3 -m json.tool
echo ""

echo "==> Testing room match (infra files)..."
curl -sf "$API/api/rooms/match?files=app/api/store/route.js,app/api/migrate/route.js" \
  -H "Authorization: Bearer $PALACE_ID" | python3 -m json.tool
echo ""

echo "==> Testing room match (blog files)..."
curl -sf "$API/api/rooms/match?files=app/blog/page.js,app/api/blog/route.js" \
  -H "Authorization: Bearer $PALACE_ID" | python3 -m json.tool
echo ""

echo "==> Storing test memory with room assignment..."
cat > /tmp/mp-test-payload.json << 'PAYLOAD_EOF'
{
  "session_name": "rooms-and-embeddings feature test",
  "agent": "claude-sonnet-4-6",
  "status": "Implemented rooms as intent containers and semantic memory search",
  "outcome": "succeeded",
  "built": ["rooms table", "pgvector embeddings", "CLI room commands", "MCP tools"],
  "decisions": ["Use HNSW index over IVFFlat for zero-row compatibility", "Graceful degradation when LM Studio unavailable"],
  "next_steps": ["Seed rooms for all project areas", "Run embed-backfill on existing memories"],
  "files": ["app/api/rooms/route.js", "app/api/search/route.js", "packages/cli/src/embed.ts"],
  "blockers": [],
  "conversation_context": "Added rooms as first-class DB entities with intent, principles, decisions and file_patterns. Added pgvector semantic search. Wired embeddings into CLI store flow via LM Studio.",
  "roster": {},
  "metadata": {"room": "infra"}
}
PAYLOAD_EOF

cd /home/cambuntu/clawd/projects/memory-palace/packages/cli
SHORT_ID=$(npx ts-node src/index.ts save /tmp/mp-test-payload.json 2>&1 | grep "short_id:" | awk '{print $NF}')
echo "Stored: $SHORT_ID"
echo ""

echo "==> Testing keyword search fallback (no LM Studio needed)..."
curl -sf -X POST "$API/api/search" \
  -H "Authorization: Bearer $PALACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"query": "rooms embeddings", "limit": 5}' | python3 -m json.tool
echo ""

echo "==> Testing room filter on search..."
curl -sf -X POST "$API/api/search" \
  -H "Authorization: Bearer $PALACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"query": "embeddings", "room": "infra", "limit": 5}' | python3 -m json.tool
echo ""

echo "==> Done. Run embed-backfill to backfill embeddings on existing memories:"
echo "    cd packages/cli && npx ts-node src/index.ts embed-backfill --limit 20"
