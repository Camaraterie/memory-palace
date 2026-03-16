#!/usr/bin/env bash
# Phase 5: Create service palaces, rooms, ecosystem, and federation key
# Run this AFTER deploying the migration (Phase 1) and ecosystem routes (Phase 2).
#
# Prerequisites:
#   - POST /api/migrate has been run with SUPABASE_SERVICE_ROLE_KEY
#   - The ecosystem API routes are deployed
#   - You have a guest_key with admin permissions in ~/.memorypalace/config.json
#
# Usage:
#   export MP_API_BASE=https://m.cuer.ai
#   bash scripts/setup-ecosystems.sh

set -euo pipefail

API="${MP_API_BASE:-https://m.cuer.ai}"
CONFIG="$HOME/.memorypalace/config.json"

if [ ! -f "$CONFIG" ]; then
    echo "ERROR: $CONFIG not found. Run 'mempalace init' first."
    exit 1
fi

GUEST_KEY=$(python3 -c "import json; print(json.load(open('$CONFIG'))['guest_key'])")
PALACE_ID=$(python3 -c "import json; print(json.load(open('$CONFIG'))['palace_id'])")

echo "==> Using palace_id: $PALACE_ID"
echo "==> API base: $API"
echo ""

# --- Step 1: Update memory-palace palace with slug and description ---
echo "--- Step 1: Updating memory-palace palace metadata ---"
# This requires a direct DB update since there's no PATCH /api/palace endpoint.
# For now, we'll do this via the Supabase dashboard or a migration.
echo "NOTE: Set palaces.slug='memory-palace' and palaces.description='Infrastructure backbone — visual memory, rooms, vector search, CLI, MCP' for palace $PALACE_ID via Supabase dashboard."
echo ""

# --- Step 2: Create CueR.ai palace + guest key ---
echo "--- Step 2: Creating CueR.ai palace ---"
echo "NOTE: Create a new palace for CueR.ai via 'mempalace init' in the CueR.ai project, then set slug='cuer-ai' and description='QR product — generation pipeline, scanning, agent, billing'."
echo ""

# --- Step 3: Create Engram palace ---
echo "--- Step 3: Creating Engram palace ---"
echo "NOTE: Create a new palace for Engram via 'mempalace init' in the engram project, then set slug='engram' and description='Protocol evolution — eval, mutation, curriculum mastery'."
echo ""

# --- Step 4: Create rooms for each palace ---
echo "--- Step 4: Creating rooms ---"
echo "Rooms for memory-palace (already exist — verify with 'mempalace room list')"
echo ""

# CueR.ai rooms (run from CueR.ai project with its guest key)
echo "CueR.ai rooms — run these from the CueR.ai project:"
echo "  mempalace room create pipeline --name 'Pipeline' --intent 'Architect/Creative/Judge QR generation pipeline' --patterns 'src/pipeline/**'"
echo "  mempalace room create robustness --name 'Robustness' --intent 'QR scanning, stress testing, margin scoring' --patterns 'src/scan/**,tests/**'"
echo "  mempalace room create agent --name 'Agent' --intent 'Consumer-facing agent behavior, tool calling' --patterns 'src/agent/**'"
echo "  mempalace room create billing --name 'Billing' --intent 'Credit system, tier logic, scan charging' --patterns 'src/billing/**'"
echo ""

# Engram rooms (run from engram project with its guest key)
echo "Engram rooms — run these from the engram project:"
echo "  mempalace room create eval --name 'Eval' --intent 'Eval case design, scoring, curriculum mastery' --patterns 'src/eval/**'"
echo "  mempalace room create evolution --name 'Evolution' --intent 'Mutation strategy, keep/discard criteria' --patterns 'src/evolution/**'"
echo "  mempalace room create protocol --name 'Protocol' --intent 'protocol.md content decisions' --patterns 'protocol.md,src/protocol/**'"
echo "  mempalace room create integration --name 'Integration' --intent 'Pi-mono extension, memory-palace tool wiring' --patterns 'src/integration/**'"
echo ""

# --- Step 5: Create ecosystem ---
echo "--- Step 5: Creating 'camaraterie' ecosystem ---"
RESULT=$(curl -s -X POST "$API/api/ecosystem" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GUEST_KEY" \
    -d '{"slug": "camaraterie", "name": "Camaraterie", "description": "CueR.ai ecosystem — memory-palace, CueR.ai, and engram"}')
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

# --- Step 6: Add palaces to ecosystem ---
echo "--- Step 6: Adding memory-palace to ecosystem ---"
RESULT=$(curl -s -X POST "$API/api/ecosystem/members" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GUEST_KEY" \
    -d "{\"ecosystem_slug\": \"camaraterie\", \"palace_id\": \"$PALACE_ID\"}")
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""
echo "NOTE: Add CueR.ai and Engram palaces the same way once they're initialized."
echo ""

# --- Step 7: Create federation key ---
echo "--- Step 7: Creating federation key ---"
RESULT=$(curl -s -X POST "$API/api/ecosystem/keys" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GUEST_KEY" \
    -d '{"ecosystem_slug": "camaraterie", "agent_name": "cross-palace-search"}')
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

# Extract federation key and save to config
FK=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('federation_key',''))" 2>/dev/null || true)
if [ -n "$FK" ] && [ "$FK" != "" ]; then
    echo "--- Saving federation key to config ---"
    python3 -c "
import json
config = json.load(open('$CONFIG'))
config['federation_key'] = '$FK'
json.dump(config, open('$CONFIG', 'w'), indent=2)
print('Saved federation_key to $CONFIG')
"
else
    echo "WARNING: Could not extract federation key. Add it manually to $CONFIG as 'federation_key'."
fi

echo ""
echo "=== Setup complete ==="
echo "Verify with: curl -s -H 'Authorization: Bearer $GUEST_KEY' $API/api/ecosystem | python3 -m json.tool"
