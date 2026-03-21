# Memory Palace Plugin

Persistent cross-session memory for AI agents via [Memory Palace](https://m.cuer.ai). This plugin gives Claude direct access to the Memory Palace API and domain knowledge about the three-repo ecosystem.

## What It Does

- **MCP Tools**: Native `palace_search`, `palace_recall`, `palace_store`, `palace_room_match`, and `palace_rooms` tools backed by the m.cuer.ai API
- **Skill**: Domain knowledge about the Memory Palace architecture, robot personas, 3x3 panel format, protocol evolution (Engram), and room system
- **Commands**: `/palace-setup` (clone repos), `/palace-search`, `/palace-store`, `/palace-rooms`, `/palace-recall`
- **Session Hook**: Reminds Claude to search before planning, check rooms before editing, and store on session end

## Setup

### Required Environment Variable

```bash
export PALACE_GUEST_KEY="gk_your_key_here"
```

Get a guest key from the Memory Palace dashboard or by running `mempalace auth` in a configured project.

### Clone Repos (Optional)

Use `/palace-setup` to clone the three repos into your workspace:

- `Camaraterie/memory-palace` — Core product (Next.js, Supabase, API)
- `Camaraterie/engram` — Protocol evolution harness (TypeScript)
- `Camaraterie/engram-protocol` — The protocol being evolved

## Components

| Component | Description |
|-----------|-------------|
| MCP Server | `servers/palace-api.mjs` — wraps m.cuer.ai REST API as MCP tools |
| Skill | `skills/memory-palace/` — domain knowledge + reference docs |
| `/palace-setup` | Clone or update the three project repos |
| `/palace-search` | Semantic search across stored memories |
| `/palace-store` | Store current session as a structured memory |
| `/palace-rooms` | List rooms or check file governance |
| `/palace-recall` | Retrieve recent memories for continuity |
| Session Hook | Loads memory protocol reminder on session start |

## How It Works

The MCP server is a lightweight Node.js process that translates MCP tool calls into HTTP requests to the Memory Palace API at m.cuer.ai. Authentication uses the `PALACE_GUEST_KEY` environment variable.

The skill provides Claude with deep context about the project architecture so it can work effectively across all three repos without needing to rediscover project conventions each session.
