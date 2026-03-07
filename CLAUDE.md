@https://m.cuer.ai/memory-palace-skill.md

## Pre-Action Protocol

Before modifying code files in this project, check the Memory Palace for context:

1. Identify which files you plan to modify
2. Query rooms: `GET /api/rooms/match?auth=<key>&files=<file1>,<file2>`
   Or use MCP tool: `palace_room_match`
3. Read the matched room's **intent** and **principles** — these are design constraints
4. Search for related memories: `POST /api/search` with a description of your task
   Or use MCP tool: `palace_search`
5. Align your implementation with room intent. Note deviations explicitly.

If no rooms match, proceed normally but consider whether a room should be created for this area.

## Vector Search — Finding Intent Before You Code

The rooms + vector search system answers the question every agent needs before touching code: *why is this built the way it is?*

### Find which room governs your files

```bash
mempalace room match app/api/rooms/route.js app/blog/page.tsx
```

Returns matching rooms with their `intent`, `principles`, and `decisions`. Read these before writing a line.

### Search semantically for past decisions

```bash
mempalace search "why does blog require persona authorship"
mempalace search "embedding backfill design"
mempalace search "CLI failure handling strategy"
```

Uses 768-dim nomic embeddings — ask the question you actually have, not keywords. Returns memory short_ids ordered by similarity. Recover full context with `mempalace recover <short_id>`.

### Browse all rooms

```bash
mempalace room list            # all rooms + intent at a glance
mempalace room show blog       # detailed view: principles, decisions, linked memories
```

### What to extract from a room

| Field | What it tells you | How to use it |
|-------|-------------------|---------------|
| `intent` | Why this area exists and what it is NOT for | Constraint on scope — don't build outside it |
| `principles` | Hard non-negotiables | Treat as invariants, flag any violation |
| `decisions` | Past choices with reasoning | Know before changing; add to it when you decide |

### Examples

**Before writing a blog post:**
```bash
mempalace room show blog
# → intent: "AI persona reflections ... not marketing. Posts authored by personas."
# → principles: "Persona-authored content only", "No anonymous posts"
```

**Before modifying API routes:**
```bash
mempalace room match app/api/store/route.js
# → infra room: "Stability and backward compatibility are paramount"
# → principles: "Never break existing API contracts"
```

**Before adding a CLI command:**
```bash
mempalace search "CLI graceful degradation LM Studio offline"
# → returns memories with the embed.ts decision rationale
```

### Via MCP (if available)

```
palace_room_match  → match files to rooms
palace_search      → semantic search across memories
palace_rooms       → list all rooms
palace_room_intent → create or update a room's constraints
```

These are semantically equivalent to the CLI commands above. Use whichever is available in your environment.

## Storing Memories

When asked to store or save a memory, **always use `mempalace store`**, never `mempalace save`. The `save` command has been removed.

`store` generates an image AND stores the memory in one shot:
```bash
mempalace store <prompt_file.txt> <payload.json>
```

1. Create `payload.json` with the session data (session_name, built, decisions, next_steps, files, metadata.room, etc.)
2. Create `prompt_file.txt` using `mempalace prompt-template` as the base, filled in with session details
3. Run `mempalace store prompt_file.txt payload.json`

Never use `save`. Never call the API directly. Always use `store`.

## Git — Commit & Push at Each Milestone

Single canonical remote: `origin` → `github.com/Camaraterie/memory-palace`

cuer-bot is a collaborator and pushes directly as cuer-bot.

**Standard milestone push:**
```bash
git push origin master
```

## Skill Doc — Keep in Sync

`public/memory-palace-skill.md` is the canonical skill consumed by all agents (Claude Code, ChatGPT, Gemini, etc.). It must accurately describe every public API endpoint and workflow.

**Update the skill doc promptly whenever you:**
- Add, remove, or change any `/api/*` route (request body, response shape, auth requirements)
- Change the `/q/<short_id>` capsule format
- Add or remove CLI commands
- Change the authentication model (guest keys, palace_id, permissions)
- Change the payload schema for `/api/store`

**After editing the skill doc, always sync the `.well-known` copy:**
```bash
\cp public/memory-palace-skill.md public/.well-known/skills/default/skill.md
```

Outdated skill docs cause agent failures in the field (ChatGPT, Codex, etc. act on stale information). Treat the skill doc as a first-class artifact, not an afterthought.
