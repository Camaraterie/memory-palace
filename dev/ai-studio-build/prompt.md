The attached file is memory-palace-skill.md — the complete Memory Palace skill
document. It is the source of truth for everything you are about to build.

## Task: Build /docs — Documentation for AI Agents

Create two files:

### app/docs/page.js
A full documentation page at https://m.cuer.ai/docs, server-rendered (static).
Primary audience: AI agents that browse this page to understand how to use the
system. Secondary audience: human developers integrating agents.

Design principle: prioritize scannability. Agents skim; humans scroll. Every
section must have a clear heading, every endpoint must have a complete code block.
Match the dark design system from system instructions exactly.

Page sections (in order):

1. **Header / Hero**
   - Title: "Memory Palace — Documentation"
   - One-sentence description
   - Three quick-nav links: Quick Start · API Reference · Agent Onboarding

2. **Quick Start**
   Four steps with code blocks:
   a. Install: npm install -g mempalace
   b. Export env + init: export MP_API_BASE=https://m.cuer.ai && npx mempalace init
   c. Give the skill file to your agent (show the skill URL: https://m.cuer.ai/api/skill)
   d. Say /store after a session, /recall at the start of the next

3. **Commands**
   For each command (/store, /recall, /recall [topic], /palace, /rooms):
   - Command in a code block
   - One-sentence description
   - What the agent does when it receives it

4. **Agent Onboarding**
   Explain the /onboard page (https://m.cuer.ai/onboard). Two paths:
   - Terminal agents (Claude Code, Gemini CLI, Codex): run mempalace init locally
   - Web agents (ChatGPT, Gemini web): need a guest key, then use GET-based ingest

   Guest key request flow:
   - Owner runs: mempalace invite <agent_name>
   - Owner gives the gk_... key to the agent
   - Agent uses it as Bearer token or ?auth= query param

5. **API Reference**
   Document every endpoint from the skill file. For each:
   - Method + path as a heading
   - Auth requirement
   - Request (params, body, headers)
   - Response shape with a complete example JSON block
   - Error codes where relevant

   Endpoints to cover (in this order):
   - GET /q/<short_id>
   - POST /api/store
   - GET /api/ingest
   - GET /api/recall
   - GET /api/palace
   - GET /api/context
   - GET /api/probe (and /probe/png, /probe/py)
   - GET /api/fork
   - GET /api/skill
   - GET /api/faq
   - GET /api/troubleshoot
   - POST /api/agents / GET /api/agents / DELETE /api/agents
   - POST /api/scan/verify
   - POST /api/scan

6. **Auth Model**
   Two auth methods:
   - palace_id (owner) — full access, Bearer token
   - guest key (gk_...) — scoped read/write/admin, Bearer or ?auth= query param
   Permissions table: read / write / admin → what each allows

7. **Agent Roster**
   Table with columns: Agent | Character Name | Color | Description
   Pull from the skill file roster section (FORGE, FLUX, ATLAS, INDEX, etc.)
   Include the note: "If your agent is not listed, create a robot character on first /store"

8. **CueR.ai — The Lossless Layer**
   Brief section explaining the three-tier recall chain and what CueR.ai adds
   (QR codes, hosted prompts, lossless recall). Use the Free vs CueR.ai
   comparison table from the skill file.

9. **Important Notes**
   Reproduce the Important Notes section from the skill file verbatim as a
   bulleted list. These are empirically validated constraints — agents need them.

10. **Footer**
    Links: Skill file · GitHub · /onboard · CueR.ai · /api/faq · /api/troubleshoot

### app/api/docs/route.js
A plain-text API endpoint at https://m.cuer.ai/api/docs that returns the same
documentation as raw text (Content-Type: text/plain; charset=utf-8). This is the
agent-native version — no HTML, no JS, just the documentation as a structured
text document. Agents that cannot parse HTML or whose browse tool returns garbled
output should use this URL instead.

Format the plain-text output with clear section separators (===, ---) and
indented code blocks. Mirror the same section order as the HTML page.
Export headers: Cache-Control: public, max-age=3600.

## Live Data
Before building, fetch:
  https://m.cuer.ai/api/context?auth=gk_de6e1de8de0316aec2e37ae9c907aee6

Use any real short_id values from the response as example values in the
API reference code blocks (instead of placeholder values like "abc123").
This makes the examples immediately runnable by any agent reading the docs.

## Deliverable
Return the complete code for both files. No truncation — the full page.js
and route.js. Include all inline styles or a <style> block at the top of
page.js — the page must be self-contained.
