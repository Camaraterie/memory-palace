# Claude Code — Agent Notes (Template A)

Claude Code uses CLAUDE.md at the repo root as its system instructions equivalent.
The CLAUDE.md auto-loads the skill via @url on session start.

## Setup

No system prompt to paste — CLAUDE.md is loaded automatically when working in this repo.

To authenticate:
```bash
mempalace auth gk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Session start

Claude Code reads CLAUDE.md which loads https://m.cuer.ai/memory-palace-skill.md.
Additional context:
```bash
curl -s "https://m.cuer.ai/api/context?auth=$(cat ~/.memorypalace/config.json | python3 -c 'import sys,json; print(json.load(sys.stdin)["palace_id"])')" | python3 -m json.tool
```

Or simply: `mempalace recover <last_short_id>`

## Store workflow

1. Write payload JSON to `.palace/prompts/<name>.json`
2. `mempalace save .palace/prompts/<name>.json`
3. `curl -s https://m.cuer.ai/q/<short_id>/qr -o .palace/qr-temp.png`
4. Generate image with QR reference if image tool available
5. `git add -p && git commit -m "mem-NNN: ..." && git push origin master`
