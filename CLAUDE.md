@https://m.cuer.ai/memory-palace-skill.md

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
