---
name: memory-palace
description: >
  This skill should be used when the user mentions "Memory Palace", "m.cuer.ai",
  "engram", "protocol evolution", "palace rooms", "guest keys", "context capsules",
  "memory protocol", "robot personas", "comic strip panels", or needs guidance on
  the Memory Palace ecosystem — a persistent cross-session memory system for AI agents.
version: 0.1.0
---

# Memory Palace — Domain Knowledge

Memory Palace (m.cuer.ai) is an open-source system giving AI agents persistent cross-session memory. Memories are stored as structured JSON, embedded with 768-dim nomic vectors, and visualized as 3x3 comic-strip context capsules featuring robot personas.

## Architecture Overview

Three repos form the ecosystem, all under `github.com/Camaraterie/`:

**memory-palace** — The core product. Next.js on Vercel, Supabase backend (PostgreSQL + pgvector), Ed25519+AES-256-GCM encryption, QR codes via CueR.ai. Contains the web app, API routes, CLI (`mempalace`), dashboard, and blog system.

**engram** — TypeScript evolution harness. Mutates protocol.md, evaluates with simulated agent sessions, uses variance-aware scoring to keep or discard mutations. Full pipeline: read protocol → baseline score → propose mutation → validate → eval mutated → compare → keep/discard → sync if kept.

**engram-protocol** — The protocol being evolved. Contains `protocol.md` (the living document), `program.md` (evolution rules and constraints), and eval case definitions.

## Memory Protocol (Core Behavioral Contract)

Memory isn't a tool you optionally consult — it's how thinking works when memories exist. Before planning or editing files, ask: "is this documented?"

**The cognitive pattern:**
- Facing ambiguity → search remote palace first (cross-project context)
- Wondering "what files exist for X?" → retrieve from memory before creating new files
- Modifying governed areas → call `palace_room_match` to verify architectural safety

**On session end:** Summarize what was built and why. Call `palace_store` to persist session state — files changed, decisions, next steps, blockers.

## Palace Rooms

Rooms define architectural boundaries with **intent** (why an area exists) and **principles** (hard constraints). Violating room principles breaks architectural consistency.

When modifying files in a governed area: call `palace_room_match(files=[...])` to surface existing intent. This isn't validation — it's reading the architecture you're standing on.

## Guest Keys

Guest keys (`gk_...`) authenticate with the Memory Palace API. Projects sharing a guest_key share the same remote palace. Never expose guest keys in output, logs, or code.

## Robot Personas

Each agent type has a robot character for comic-strip visualization:

| Agent | Persona | Color | Description |
|-------|---------|-------|-------------|
| claude-code | FORGE | #4A90D9 (navy blue) | Sturdy industrial robot, welder's mask |
| gemini-cli | FLUX | #34A853 (emerald) | Sleek transforming bot, holographic displays |
| codex | ATLAS | tan-brass | Heavy-set scholarly bot, monocle + scroll arms |
| openclaw-cue | INDEX | burgundy-bronze | Multi-armed librarian bot, card catalog chest |
| antigravity | ANTIGRAVITY | #00AEEF (chrome) | Chrome sphere with cyan halo, gravity-defying |
| metablogger | CHRONICLER | brass | Hovering brass observer, quill arm + camera eye |
| gpt-web | — | silver | Silver hover-bot with cyan halo |

## 3x3 Context Capsule Format

Memories are visualized as 9-panel (3x3) comic strips. Each panel has a specific role:

1. **CHARACTER PORTRAIT** — Robot persona headshot with name badge
2. **CHARACTER ACTION** — The agent performing their primary task
3. **CONTEXT** — Environment/setting establishing the work context
4. **WHITEBOARD 1** — Key decisions or architecture diagrams
5. **WHITEBOARD 2** — Code snippets or data flow
6. **WHITEBOARD 3** — Next steps or open questions
7. **WORKBENCH** — Tools and files involved in the session
8. **ROSTER** — Other agents/personas involved
9. **DATA MATRIX / QR** — QR code linking to the full memory capsule

## Store Payload Schema

When storing memories via `palace_store`, the structured payload includes: `session_name`, `agent`, `status`, `outcome`, `built` (array), `decisions` (array), `next_steps` (array), `files` (array), `blockers` (array), `metadata.room` (optional slug).

## Protected Evolution Sections

The engram system has identified these as **do not mutate**:
- "On Session End" — 5/5 mutation attempts regressed scores
- "Available Tools" — Reference section, no behavioral value in mutating

## Reference Files

- **`references/api-reference.md`** — Complete API endpoint documentation
- **`references/personas.md`** — Full persona definitions and visual descriptions
- **`references/evolution.md`** — Engram evolution system details and type system
