# Persona System & Meta-Blogging Agent

## Agent Instructions & Protocols

**MEMORY STORAGE FORMAT:**
When storing memories for this project, you **MUST** use the 3x3 comic strip format:
- 9 equal SQUARE panels (`3x3 grid` or `3×3 grid`)
- Each panel must be labeled explicitly (`TOP-LEFT PANEL`, `MIDDLE-CENTER PANEL`, etc.)
- Use your specific persona's visual characteristics in the character portrait
- Include whiteboard panels with structured session data
- Include a workbench panel with artifact descriptions
- Include a roster panel with the agent team
- Include the data matrix panel with the QR code at the bottom-right
- Reference existing prompts as examples (e.g., `.palace/prompts/y6ywyfu.txt`)

*Run `mempalace prompt-template` to get a ready-to-use template.*

## Overview

Two interconnected features:

1. **Persona System** — Role-based categorization (Backend, Frontend, DevOps, Product Manager, etc.) that helps organize memories and understand who worked on what.

2. **Meta-Blogging Agent** — An automated agent that reads memory images, synthesizes patterns, and generates blog post drafts.

---

## Part 1: Persona System

### Goals

- **Context Organization**: Tag memories with development role for better filtering
- **Project Visibility**: See which areas are active/neglected
- **Agent Specialization**: Let agents load role-relevant context
- **Non-Intrusive**: Personas are metadata hints, not rigid filters

### Persona Roles (Initial Set)

| Name | Description | Focus Areas |
|------|-------------|-------------|
| Backend | Server-side logic, APIs, database, auth | `/api/*`, migrations, Supabase |
| Frontend | UI components, styling, interactions | React components, CSS, UX |
| DevOps | Deployment, infrastructure, monitoring | Vercel, env vars, CI/CD |
| Product Manager | Requirements, priorities, user stories | Feature planning, decisions |
| Metablogger | Documentation, blog posts, changelogs | `/blog`, `/docs`, announcements |
| QA/Tester | Bug reports, test scenarios, validation | Testing, bug finding |

### Database Changes

```sql
-- Add persona_id to memories table (foreign key to personas)
ALTER TABLE memories ADD COLUMN persona_id uuid REFERENCES personas(id);

-- Or add persona as text for flexibility (simpler, no foreign key)
ALTER TABLE memories ADD COLUMN persona text;

-- Option: Allow multiple personas (array)
ALTER TABLE memories ADD COLUMN personas text[];
```

**Recommendation**: Start with `persona text` for flexibility. Can add foreign key constraint later if needed.

### API Changes

#### GET /api/personas
List all personas with memory counts.

```json
{
  "personas": [
    { "id": "1", "name": "Backend", "description": "...", "memory_count": 15 },
    { "id": "2", "name": "Frontend", "description": "...", "memory_count": 12 }
  ]
}
```

#### POST /api/personas
Create a new persona (admin only, via dashboard).

#### PUT /api/personas/:id
Update persona details.

#### GET /api/recall?persona=Backend
Optional filter by persona (still returns memories with persona tags).

### UI Components

#### 1. Persona Management Page
Route: `/dashboard/personas`

- List all personas with descriptions
- Show memory count per persona
- Show recent memories for each persona
- Create/edit/delete personas
- Color-coded persona chips

#### 2. Enhanced Memory Recall
- Add persona chips to memory cards in gallery view
- Show persona tag in memory detail modal
- Filter memories by persona (optional, not default)

#### 3. Dashboard Persona Overview
- On `/dashboard`, show persona activity breakdown
- Heatmap or bar chart of memories by persona over time
- Quick filters: [All] [Backend] [Frontend] [DevOps] etc.

### Memory Storage Flow

When calling `/api/store`, include optional `persona` field:

```json
{
  "agent": "claude-sonnet-4-6",
  "persona": "Backend",
  "session_name": "Added authentication middleware",
  ...
}
```

**Agent inference**: If persona not provided, the system could:
- Leave it null (user can edit later)
- Try to infer from session content (ML-based, later feature)

### Implementation Steps

1. **Database migration** (via `/api/migrate`)
   - Add `persona` column to memories table

2. **Seed initial personas**
   - Insert Backend, Frontend, DevOps, Product Manager, Metablogger, QA

3. **Persona API endpoints**
   - GET/POST/PUT /api/personas

4. **Persona management UI**
   - `/dashboard/personas` page

5. **Update memory display**
   - Show persona tags on memory cards
   - Show persona in memory detail modal

6. **Optional filtering**
   - Add persona filter chips to gallery view

---

## Part 2: Meta-Blogging Agent

### Goals

- Automatically synthesize blog post drafts from memory images
- Reduce manual blog writing effort
- Keep blog in sync with actual development work

### How It Works

```
1. Trigger: User visits /dashboard/blog and clicks "Synthesize from Memories"
   OR Automatic: Nightly cron checks for unpublished work

2. Agent selects date range or memory count (e.g., "last 7 days")

3. Agent loads relevant memories (via /api/recall?limit=20)

4. Agent reads memory images via vision API:
   - Extract whiteboard text
   - Identify patterns (what was built, decisions, blockers)
   - Synthesize into narrative

5. Agent generates blog post draft:
   - Title (generated)
   - Subtitle (summary)
   - Content (markdown)
   - Excerpt
   - Tags (inferred from work)
   - Source memories (linked)

6. Draft saved to blog_posts table (status: "draft")

7. User reviews in blog manager, edits, publishes
```

### API Endpoint

#### POST /api/blog/synthesize
Trigger synthesis of blog post from memories.

```json
// Request
{
  "days": 7,              // or
  "memory_count": 10,     // or
  "persona": "Backend",   // optional: focus on specific role
  "title_template": "{{date}}: {{focus}} Updates"  // optional
}

// Response
{
  "draft": {
    "slug": "weekly-updates-march-3",
    "title": "Weekly Updates: Auth, Blog, and Personas",
    "subtitle": "What we built this week",
    "content": "...",
    "excerpt": "...",
    "tags": ["auth", "blog", "personas"],
    "source_memories": ["y6ywyfu", "ttbfw2l", ...],
    "status": "draft"
  }
}
```

### Agent Prompt Template

The meta-blogging agent receives:

```
You are a Meta-Blogger. Your job is to synthesize development work into engaging blog posts.

INPUT:
- Recent memory images (with extracted text)
- Memory metadata (agent, date, session summary)

TASK:
1. Identify themes: What was built? What decisions emerged?
2. Tell a story: Connect individual sessions into a narrative
3. Write for audience: Developers interested in AI agent infrastructure
4. Include specifics: File paths, API endpoints, technical details

OUTPUT FORMAT:
{
  "title": "...",
  "subtitle": "...",
  "content": "markdown with sections",
  "excerpt": "2-3 sentence summary",
  "tags": ["tag1", "tag2"],
  "source_memories": ["id1", "id2"]
}

TONE: Technical but accessible, forward-looking, grounded in actual work.
```

### UI Components

#### 1. Synthesis Button
In `/dashboard/{palace_id}/blog`:

```
[Synthesize from Memories] → Opens modal:
  - Date range picker (last 7 days, last 30 days, custom)
  - Memory count slider (5-50)
  - Optional persona filter
  - [Generate Draft] button
```

#### 2. Draft Review
When synthesis completes, redirect to blog manager with new draft expanded for editing.

### Implementation Steps

1. **Create synthesis endpoint**
   - `app/api/blog/synthesize/route.js`
   - Fetches memories, calls Claude API with vision

2. **Build agent prompt**
   - Template with memory data
   - Structured JSON output requirement

3. **Add UI trigger**
   - Synthesis button in blog manager
   - Modal for options

4. **Handle errors gracefully**
   - Vision API failures
   - Rate limiting
   - Partial synthesis

### Technical Considerations

- **Vision API costs**: Reading images costs tokens. Cache results.
- **Rate limiting**: Don't spam synthesis. Maybe once per day per palace.
- **Draft quality**: First drafts will need human editing. Set expectations.

---

## Part 3: Integration Points

### Persona ↔ Blog

- Blog posts have `author_persona` field (already exists)
- When synthesizing blog post, agent can tag with relevant persona(s)
- Persona management could include "blog voice" guidelines

### Memory ↔ Blog

- Blog posts reference `source_memories`
- Memory detail modal could show "Used in blog posts" section
- Quick "Create blog draft from memory" button

### Dashboard Integration

- Persona activity visible on dashboard
- Synthesis accessible from blog manager
- Memory counts by persona on dashboard overview

---

## Phased Implementation

### Phase 1: Foundation (Persona System)
1. Database migration for persona field
2. Seed initial personas
3. Persona API endpoints
4. Basic persona management UI
5. Display persona tags on memories

### Phase 2: Enhanced Visibility
1. Dashboard persona breakdown
2. Filter memories by persona
3. Persona activity over time chart
4. Link personas to blog author_persona

### Phase 3: Meta-Blogging
1. Synthesis endpoint
2. Agent prompt template
3. Synthesis UI (button + modal)
4. Draft review flow
5. Error handling and retry logic

### Phase 4: Polish
1. Batch synthesis (multiple drafts at once)
2. Synthesis scheduling (automatic nightly)
3. Persona voice/style customization
4. Advanced analytics (persona productivity)

---

## Open Questions

1. **Persona inference**: Should we try to auto-assign persona based on memory content?
   - *Decision*: No, leave manual for now. Can add ML later.

2. **Multiple personas per memory**: Can one memory involve Backend AND Frontend?
   - *Decision*: Yes, use `personas` array instead of single `persona`.

3. **Synthesis frequency**: How often should auto-synthesis run?
   - *Decision*: Manual trigger first. Add scheduled synthesis later.

4. **Draft ownership**: Who owns synthesized drafts?
   - *Decision*: Palace owner (user), same as manual drafts.

---

## Conflict Anticipation

### Potential Conflicts with feature/blog-improvements

1. **Blog manager changes** — Both branches modify BlogManager.js
   - *Resolution*: Careful merge, keep both feature sets

2. **Blog post schema** — If other branch adds fields to blog_posts
   - *Resolution*: Union of schema changes, run migration

3. **Memory detail modal** — If other branch changes modal
   - *Resolution*: Merge changes, add persona display

### Strategy

- Keep changes isolated where possible
- Use feature flags if needed
- Test merge before deploying
- Resolve conflicts by keeping both features

---

## Files to Create/Modify

### Persona System
- `app/api/personas/route.js` (new)
- `app/api/migrate/route.js` (modify - add migration)
- `app/dashboard/personas/page.js` (new)
- `app/dashboard/[palace_id]/PalaceExplorer.js` (modify - show persona tags)
- `app/dashboard/[palace_id]/blog/BlogManager.js` (modify - persona selector)
- `app/api/recall/route.js` (modify - persona filter)

### Meta-Blogging
- `app/api/blog/synthesize/route.js` (new)
- `app/dashboard/[palace_id]/blog/BlogManager.js` (modify - synthesis button)
- `lib/meta-blogger/prompt.js` (new - agent prompt template)

### Database
- Migration: Add `personas` column to memories table
- Seed: Insert initial persona records

---

## Success Criteria

### Persona System
- [ ] Memories can be tagged with personas
- [ ] Persona management UI works
- [ ] Dashboard shows persona activity breakdown
- [ ] Filtering by persona works
- [ ] No performance regression on memory recall

### Meta-Blogging
- [ ] Synthesis endpoint returns valid draft
- [ ] Drafts are saved to blog_posts table
- [ ] UI trigger works smoothly
- [ ] Error handling works (vision API fails, etc.)
- [ ] Generated drafts are useful (not garbage)

---

## Next Steps

1. Review and refine this plan
2. Create first phase tasks
3. Begin implementation with Phase 1
4. Test locally before pushing to branch
5. Coordinate merge with feature/blog-improvements
