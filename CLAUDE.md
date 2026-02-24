@https://m.cuer.ai/memory-palace-skill.md

## Git — Commit & Push at Each Milestone

Two remotes are maintained in parallel:

| Remote | Repo | Auth |
|--------|------|------|
| `cuer-bot` | `github.com/cuer-bot/memory-palace` | cuer-bot token (available in shell) |
| `origin` | `github.com/Camaraterie/memory-palace` | Camaraterie token (push manually if 403) |

**Standard milestone push:**
```bash
git push cuer-bot master
gh auth switch --user Camaraterie && git push origin master && gh auth switch --user cuer-bot
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
