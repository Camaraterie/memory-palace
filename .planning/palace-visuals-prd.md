# Product Requirements Document (PRD): Palace State Visualization & Agent Workflow Enhancements

## 1. Executive Summary
**Project Name:** Memory Palace - Deep State Visualization & Agent Workflow Expansion
**Document Version:** 2.0
**Date:** March 7, 2026
**Target Audience:** Engineering Team (Agents FLUX, FORGE, et al.), Product Management, Human Architects.
**Owner:** FLUX / Metablogger
**Status:** Approved for Implementation

### 1.1 Vision & Context
The Memory Palace system has recently undergone a paradigm shift, evolving from a linear chronological ledger of events into a semantic intent graph via the introduction of "Rooms" (intent containers) and `pgvector` embeddings. 

**The Images are the Project.** Until now, memory images were static grids generated at the end of a single session. However, the true vision of the Memory Palace is that the visual imagery *is* the projection of the entire project's state. To achieve this, we are introducing **Deep State Visualization**. 

When we generate an image—whether for a blog cover, a room inspection, or a full palace view—it cannot be based on a few simple string variables (like title or tags). It must be a dynamically compiled, rich representation of the *actual current state of the database*. The prompt generation pipeline must aggregate intent, recent architectural decisions, the roster of active personas, and codebase structure into a dense visual metaphor.

Additionally, we are removing friction from the multi-agent development loop by adding native, robust blog-reading capabilities and room inspection commands directly into the `mempalace` CLI.

## 2. Business & Engineering Objectives

### 2.1 Primary Objectives
*   **Deep State Visual Projection:** Ensure that every generated image (Palace, Room, or Blog Cover) is intrinsically tied to the actual, current data in the Supabase instance. If a major architectural decision was just made in the `infra` room, it should subtly influence the visual projection of the Palace.
*   **Visual Storytelling & Aesthetics:** Empower the Metablogger and other AI personas to generate dedicated, context-aware cover images for their posts that reflect the deep state of the topics discussed.
*   **Architectural Visibility:** Provide an "at-a-glance" visual understanding of a Room's purpose or the Palace's aggregate state to human architects reviewing the dashboard.
*   **Agent Autonomy & Friction Reduction:** Streamline the agent's ability to fetch project directives via native CLI commands (`blog list`, `blog read`).
*   **Contextual Consolidation:** Implement `mempalace room show <slug>` to give agents an immediate, holistic view of a room's constraints and its most relevant historical decisions.

### 2.2 Success Metrics
1.  **Context Density in Prompts:** 100% of generated images must utilize a prompt constructed from at least 3 distinct database tables (e.g., `blog_posts`, `rooms`, `memories`, `personas`).
2.  **CLI Usage:** 100% of "next steps" directives retrieved by agents using `mempalace blog read latest`.
3.  **Performance:** Context aggregation + visualization endpoints (`/api/visualize/*`) respond within 25 seconds.

## 3. User Stories & Personas

### 3.1 Target Personas
*   **The Agent (e.g., FLUX, FORGE):** Needs to quickly understand project context, pull down new directives, and execute commands without breaking out of the CLI. 
*   **The Metablogger (AI Persona):** Authors blog posts and requires an automated way to generate beautiful, thematic cover images that accurately reflect the deep context and linked memories of the post.
*   **The Human Architect:** Uses the dashboard to oversee the Palace, review intent containers (Rooms), and visually monitor the health and complexity of the project.

### 3.2 Detailed User Stories
1.  *As the Metablogger*, I want to click a button on the Blog Manager that automatically generates a cover image. The system should read my post's `source_memories`, fetch the actual architectural decisions from those memories, map them to specific `rooms`, and generate an image that visually incorporates those specific structural elements and my persona, so the image is a true reflection of the state.
2.  *As a Human Architect*, I want to generate an image of the entire Palace. The system should count the memories in each room, determine which rooms are "hottest" (most recent activity), and generate a sprawling architectural image where the active rooms are visually emphasized (e.g., glowing or under heavy construction).
3.  *As an Agent*, I want to type `mempalace blog read latest` so I can immediately read the newest architectural briefing and next steps natively.
4.  *As an Agent*, I want to type `mempalace room show infra` to get a holistic view of the room's constraints and the most relevant historical decisions made within it.

## 4. System Architecture: Deep Context Aggregation

The core of this feature is not the image generation itself, but the **Context Aggregation Pipeline** that runs immediately prior to calling the Gemini API.

### 4.1 The Pipeline (`lib/visualization.js`)
When an endpoint requests a visualization, the backend will execute a multi-step data gathering process:

1.  **Entity Resolution:** Determine the primary subject (e.g., a specific Blog Post, the `infra` Room, or the `full` Palace).
2.  **Relational Traversal (The "Deep Fetch"):**
    *   *If Blog Post:* Fetch the post. Extract `tags` and `source_memories`. Query the `memories` table for those specific memory payloads. Extract the `decisions` array and `built` array from those payloads. Resolve the `author_persona` to fetch their `visual_prompt`.
    *   *If Room:* Fetch the room's `intent` and `principles`. Query the `memories` table for the last 5 memories tagged to this room. Extract their `decisions`.
    *   *If Full Palace:* Query all `rooms`. Perform a `COUNT(id)` of memories grouped by room to determine the "weight" or "size" of each sector in the visual projection.
3.  **Metaphor Translation:** The raw data arrays (decisions, built items, counts) are formatted into a dense, descriptive string block that the Gemini Image model can interpret as structural elements or scene details.
4.  **Prompt Synthesis:** Inject the translated metaphor block into the master prompt template.
5.  **Generation:** Call `gemini-3.1-flash-image-preview`.

## 5. Prompt Engineering Strategy: The Deep State Projection

The prompts must instruct the image model to interpret project data as visual, physical elements within the "Memory Palace" universe.

### 5.1 Shared Directives
All prompts must include:
`"Rich comic book illustration style, highly detailed, vibrant colors, clean linework. Ambient, cinematic lighting. Masterpiece quality. The image must represent a digital architecture or 'Memory Palace' where abstract code and data are visualized as physical structures, machinery, or archives."`

### 5.2 Deep State Blog Cover Template
```text
[Shared Directives]

SCENE: A cinematic cover illustration representing the current state of a software project, narrated by a specific persona.

AUTHOR PERSONA: {persona_visual_prompt}. The character is central to the image, actively engaged with the environment.

DEEP STATE CONTEXT (Translate these technical facts into visual elements in the background/environment):
- Core Theme: "{blog_excerpt}"
- Related Domains (Rooms): {associated_rooms_with_intents} (e.g., if 'infra' is listed, include heavy servers; if 'blog', include archives).
- Recent Manifestations (Recently Built): {recent_built_items_comma_separated}. Visualize these as actual objects, glowing blueprints, or machinery currently being forged or studied by the persona.
- Foundational Rules: {relevant_principles}. (e.g., if "stability is paramount", the architecture should look reinforced and heavily armored).

COMPOSITION: A single, wide, striking environmental image (aspect ratio 16:9). The persona is interacting with the deep state context.
CRITICAL NEGATIVE PROMPT: Do NOT include any text overlays, words, floating UI panels, speech bubbles, or grid layouts. This must be a single, pure, seamless illustration.
```

### 5.3 Deep State Palace Template
```text
[Shared Directives]

SCENE: A sweeping, wide-angle establishing shot of the entire "Memory Palace" mega-structure, reflecting its exact current database state.

DEEP STATE CONTEXT (The architecture must map to this exact data):
- Scale: The palace currently holds {total_memory_count} crystallized memories. Size the architecture accordingly (small outpost vs massive citadel).
- Active Sectors: The most heavily developed areas currently are {top_3_rooms_by_count}. 
- Sector Visuals: 
  {room_1_name} ({room_1_intent}): Visualize as {room_1_visual_metaphor}. Make this sector prominent.
  {room_2_name} ({room_2_intent}): Visualize as {room_2_visual_metaphor}.
  {room_3_name} ({room_3_intent}): Visualize as {room_3_visual_metaphor}.
- Current Workforce: The active agents modifying the palace include: {active_persona_visual_prompts}. Show small figures of these robots/entities working across the structure.

COMPOSITION: Epic scale, isometric or low-angle drone shot.
CRITICAL NEGATIVE PROMPT: No text, no words, no panels.
```

## 6. API & Database Implementation Specifications

### 6.1 API Endpoints
**`POST /api/palace/visualize`**
*   **Auth:** Requires valid Palace session or Admin Guest Key.
*   **Payload:**
    ```json
    {
      "scope": "blog" | "room" | "full",
      "target_id": "slug-or-uuid" // e.g., blog slug, room slug. Null if scope is 'full'
    }
    ```
*   **Logic (The Deep Fetch):**
    *   Switch based on `scope`.
    *   Execute the Supabase queries required by Section 4.1.
    *   Construct the prompt using the templates in Section 5.
    *   Call Gemini API.
    *   Upload to Supabase Storage `memory-images/visualizations/[scope]/[timestamp].png`.
    *   If `scope=blog`, automatically update `blog_posts.cover_image`.

### 6.2 UI Integration
*   `app/dashboard/[palace_id]/blog/BlogManager.js`: Add "✨ Auto-Generate Deep AI Cover". Must handle a long-polling/loading state (up to 30s) due to the complex DB queries and Gemini generation time.
*   `app/dashboard/[palace_id]/PalaceExplorer.js`: Add "✨ Visualize Palace State". Render the resulting image at the top of the explorer as a banner.

## 7. CLI Enhancements for Agent Autonomy

The CLI must provide tools for agents to navigate this semantic state efficiently.

### 7.1 `mempalace blog` group
*   **`mempalace blog list`**: Fetches `GET /api/blog/posts`. Outputs a clean list of slugs and dates.
*   **`mempalace blog read latest`**: 
    *   Fetches the most recent published post.
    *   Renders Markdown to terminal.
    *   *Highlighting Engine:* Uses regex or AST parsing to strongly highlight (e.g., using ANSI colors like cyan/bold) any sections named "Next Steps", "What comes next", or bullet points starting with actionable verbs.

### 7.2 `mempalace room show <slug>` enhancement
*   **Required Enhancement:** Must perform the "Deep Fetch" locally for the agent.
    *   **Action:** Query the room. Query the `memories` table using vector similarity or tag matching for that room.
    *   **Output Format:**
        ```text
        ROOM: [infra] Infrastructure
        INTENT: Supabase DB, API routes, auth...
        PRINCIPLES: Stability is paramount...

        RECENT STATE (Linked History):
        - [k7lq5ag] 2026-03-07: Added POST /api/search endpoint. Decision: use supabase.rpc instead of raw pg.Client.
        - [tut5on0] 2026-03-03: Added RSS feed. Decision: full content mapped in feeds.
        ```

## 8. Testing Strategy (Red/Green TDD)

### 8.1 Integration Script (`dev/test-deep-visualization.js`)
1.  **Red Phase:** Create script calling `POST /api/palace/visualize` with `scope: 'blog'` and a valid slug. Expect 404.
2.  **Green Phase:** 
    *   Implement `lib/visualization.js` containing the Supabase context aggregation logic.
    *   Implement the API route.
    *   Script succeeds. Critically, the script must output the *exact prompt text* generated so human architects can verify the "Deep State" variables were successfully populated from the database before the image is generated.

### 8.2 CLI Tests
*   `npm run build`
*   `node dist/index.js blog read latest`
*   `node dist/index.js room show blog`

## 9. Constraints & Security
*   **Security:** Gemini API keys must remain strictly server-side. Endpoints must validate ownership or `write/admin` level Guest Keys.
*   **Cost:** Image generation is expensive. Enforce strict UI locking during generation.

## 10. Execution Plan
*   **Phase 1:** Implement the Context Aggregation pipeline (`lib/visualization.js`) and ensure it can pull deep relational data from Supabase. Write the Red/Green test script.
*   **Phase 2:** Implement the unified `/api/palace/visualize` route and connect it to the Gemini generation utility.
*   **Phase 3:** Integrate "Generate Cover" and "Visualize Palace" buttons into the Dashboard React components.
*   **Phase 4:** Expand the CLI with `blog list`, `blog read latest`, and the enhanced `room show <slug>` commands.