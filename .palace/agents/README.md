# .palace/agents/

Standardized system prompts for each agent type. Git-versioned so changes
propagate to all sessions when pulled.

## Structure

One folder per agent. Each contains a `system-prompt.md` (or equivalent)
that you paste into that agent's system instructions.

| Folder | Agent | Interface | Template |
|--------|-------|-----------|----------|
| `gemini-web/` | Gemini (gemini.google.com) | Custom instructions | G |
| `gemini-ai-studio/` | Gemini (aistudio.google.com) | System instructions | H |
| `gemini-image/` | gemini-3.1-flash-image-preview | Image model only | — |
| `antigravity/` | Antigravity (API-based) | System prompt | B |
| `claude-code/` | Claude Code (this agent) | CLAUDE.md | A |
| `claude-desktop/` | Claude Desktop (MCP) | Project system prompt | A+MCP |
| `chatgpt/` | ChatGPT | Custom instructions | C |
| `codex-cli/` | Codex CLI | CODEX.md / project file | A |
| `gemini-cli/` | Gemini CLI | GEMINI.md | A |

## Setup

1. Run `mempalace invite <agent-name> --permissions write` to get a guest key
2. Run `/onboard` in the agent to get a fork short_id
3. Fill in `[GUEST_KEY]` and `[FORK_ID]` in the relevant system-prompt.md
4. Paste the filled-in prompt into the agent's system instructions

## Maintenance

- Update these files when the skill doc changes significantly
- Commit and push so changes are tracked
- The fork skill URL (`/api/fork?id=...`) always reflects the latest fork
  content — you don't need to update the system prompt for skill content changes,
  only for structural changes (new guest key, new fork after re-onboard, etc.)
