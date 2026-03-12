import { createSupabaseAdmin } from './supabase'

const SHARED_DIRECTIVES_DEEP = "Rich comic book illustration style, highly detailed, vibrant colors, clean linework. Ambient, cinematic lighting. Masterpiece quality. The image must represent a digital architecture or 'Memory Palace' where abstract code and data are visualized as physical structures, machinery, or archives."

const SHARED_DIRECTIVES_MEMORY_COMIC = "A comic strip image divided into a precise 3x3 grid of 9 equal SQUARE panels. Every panel has a 1:1 square aspect ratio. All text in whiteboard-style panels must be crisp and fully legible. Keep QR-friendly geometry when code-like matrix motifs are shown. Visual tone: rich comic art, high detail, cinematic lighting, but with information-dense storytelling."

const ROBOT_PERSONAS = {
    'gemini-cli': "FLUX — A sleek, fluid-form robot with an emerald-green crystalline chassis that refracts light. No visible joints. An inverted teardrop head with a single large triangular optical sensor that shifts between green and gold. Carries a bandolier of glass vials filled with luminous liquids.",
    'claude-code': "FORGE — An autonomous humanoid robot with a sturdy, industrial frame. Matte navy-blue plating with exposed brass rivets along the joints. A rectangular head with two round, warm amber optical sensors for eyes and a thin horizontal speaker grille for a mouth. Wears a leather tool belt slung across the chest.",
    'codex': "ATLAS — A compact, wheeled robot on treaded tracks, built like a mobile surveying station. Tan and brass colored with a rotating turret head with a wide panoramic visor glowing soft amber. Two articulated arms ending in drafting tools.",
    'openclaw-cue': "INDEX — A tall, slender robot with a burgundy-and-bronze Victorian aesthetic. An ornate head shaped like a reading lamp with a warm circular optical sensor behind a monocle-like lens. Long, delicate fingers for turning pages. A built-in bookshelf runs down the torso.",
    'gpt-web': "A sleek, silver cylindrical hover-bot with a softly glowing cyan halo around its chassis, featuring smooth, minimalist surfaces.",
    'metablogger': "THE CHRONICLER — An ornate, brass-plated observer automaton with a large singular lens recording data onto digital scrolls. It has delicate manipulator arms and sits amidst floating archival holographic projections. It is a robot, not a human."
}

function getPersonaVisual(nameOrAgent) {
    const key = nameOrAgent.toLowerCase()
    for (const [k, visual] of Object.entries(ROBOT_PERSONAS)) {
        if (key.includes(k)) return visual
    }
    return "A standard, utilitarian worker drone robot with a glowing visor."
}

export async function buildDeepContextPrompt(supabase, palaceId, scope, targetId, options = {}) {
  const styleMode = options.style_mode || 'memory_comic'
  const includeHuman = Boolean(options.include_human)
  const subjectName = (options.subject_name || '').trim()
    if (scope === 'blog') {
        // 1. Fetch Blog Post
        const { data: post, error: postErr } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('palace_id', palaceId)
            .eq('slug', targetId)
            .single()

        if (postErr || !post) throw new Error(`Blog post not found: ${targetId}`)

        // 2. Fetch Persona
        const personaVisualPrompt = getPersonaVisual(post.author_persona || 'metablogger')

        // 3. Fetch Deep State Context from source_memories
        let decisions = []
        let builtItems = []
        let nextSteps = []
        let files = []
        if (post.source_memories && post.source_memories.length > 0) {
            const { data: memories } = await supabase
                .from('memories')
                .select('payload')
                .eq('palace_id', palaceId)
                .in('short_id', post.source_memories)

            if (memories) {
                memories.forEach(m => {
                    if (m.payload) {
                        if (m.payload.decisions) decisions.push(...m.payload.decisions)
                        if (m.payload.built) builtItems.push(...m.payload.built)
                        if (m.payload.next_steps) nextSteps.push(...m.payload.next_steps)
                        if (m.payload.files) files.push(...m.payload.files)
                    }
                })
            }
        }

        const tagsJoined = (post.tags || []).join(', ') || 'software architecture'
        const recentBuilt = builtItems.slice(0, 4).join(', ') || 'new abstract data structures'
        const relevantPrinciples = decisions.slice(0, 4).join(', ') || 'stability and intentionality'
        const protocolAnchors = [
            ...nextSteps.slice(0, 2),
            ...files.slice(0, 2),
        ].join(' | ') || 'bootstrap → recover short_id → branch-safe execution → explicit publish confirmation'

        if (styleMode === 'memory_comic') {
            const subjectLine = includeHuman && subjectName
                ? `Include a realistic human subject: ${subjectName}, interacting with the workflow alongside the persona robot.`
                : includeHuman
                    ? 'Include one realistic human founder/operator interacting with the workflow alongside the persona robot.'
                    : 'No human subject required; persona robot remains the primary actor.'

            return `${SHARED_DIRECTIVES_MEMORY_COMIC}

TOPIC: "${post.title}".
SUBTITLE CONTEXT: "${post.subtitle || post.excerpt || post.title}".

CHARACTER PANEL RULE:
- Primary persona: ${personaVisualPrompt}
- ${subjectLine}

WHITEBOARD PANELS (must be legible):
- Core theme: ${post.excerpt || post.title}
- Related themes: ${tagsJoined}
- Built recently: ${recentBuilt}
- Decisions/protocols: ${relevantPrinciples}
- Memory/ops protocol anchors: ${protocolAnchors}

COMPOSITION RULES:
- Must be an information-dense 3x3 comic grid.
- Include at least one explicit panel showing memory management workflow artifacts (short_id card, protocol checklist, and CueR.ai/Nano Banana image generation pipeline concepts).
- Preserve visual clarity suitable for human readers first, while still structured enough for agent context recovery.

NEGATIVE PROMPT:
- No gibberish text, no unreadable tiny text, no broken panel geometry.
- Do not collapse into a single hero image.
`
        }

        return `${SHARED_DIRECTIVES_DEEP}

SCENE: A cinematic cover illustration representing the current state of a software project, narrated by a specific persona.

AUTHOR PERSONA: ${personaVisualPrompt}. The character is central to the image, actively engaged with the environment. IT MUST BE A ROBOT.

DEEP STATE CONTEXT (Translate these technical facts into visual elements in the background/environment):
- Core Theme: "${post.excerpt || post.title}"
- Related Themes: ${tagsJoined}
- Recent Manifestations (Recently Built): ${recentBuilt}. Visualize these as actual objects, glowing blueprints, or machinery currently being forged or studied by the persona.
- Foundational Rules & Decisions: ${relevantPrinciples}. Visualize these rules as architectural constraints (e.g., if stability is mentioned, show heavy armor/reinforcements).

COMPOSITION: A single, wide, striking environmental image (aspect ratio 16:9). The persona is interacting with the deep state context.
CRITICAL NEGATIVE PROMPT: Do NOT include floating UI panels or speech bubbles. Prefer clean composition with minimal text artifacts.`

    } else if (scope === 'room') {
        // 1. Fetch Room
        const { data: room, error: roomErr } = await supabase
            .from('rooms')
            .select('*')
            .eq('palace_id', palaceId)
            .eq('slug', targetId)
            .single()

        if (roomErr || !room) throw new Error(`Room not found: ${targetId}`)

        // 2. Count and Fetch Recent Memories
        const { count } = await supabase
            .from('memories')
            .select('*', { count: 'exact', head: true })
            .eq('palace_id', palaceId)
            .eq('room_slug', targetId)

        const { data: recentMemories } = await supabase
            .from('memories')
            .select('payload')
            .eq('palace_id', palaceId)
            .eq('room_slug', targetId)
            .order('created_at', { ascending: false })
            .limit(5)

        let decisions = []
        if (recentMemories) {
            recentMemories.forEach(m => {
                if (m.payload && m.payload.decisions) decisions.push(...m.payload.decisions)
            })
        }

        const roomPrinciples = (room.principles || []).join('; ') || 'General architecture'
        const roomDecisions = decisions.slice(0, 3).join('; ') || 'No recent major decisions'

        return `${SHARED_DIRECTIVES_DEEP}

SCENE: An architectural visualization of a specific sector known as a "Room" within a massive digital "Memory Palace".

SUBJECT: This room is known as "${room.name}". Its primary architectural intent is: "${room.intent || 'Unknown intent'}". The visual design MUST heavily reflect this intent.

ENVIRONMENT: The architecture should visually manifest the principles: "${roomPrinciples}". If it is an infrastructure room, show heavy, stable, glowing servers. If it is a blog/content area, show endless organized archives or a futuristic broadcasting studio. The room currently holds ${count || 0} crystallized memory nodes floating or securely stored within. Recent decisions shaping this room include: "${roomDecisions}".

COMPOSITION: Isometric or wide-angle environmental shot showing the scale of the room. 
CRITICAL NEGATIVE PROMPT: No text, no words, no humans, no panels.`

    } else if (scope === 'full') {
        // 1. Total Memories Count
        const { count: totalMemories } = await supabase
            .from('memories')
            .select('*', { count: 'exact', head: true })
            .eq('palace_id', palaceId)

        // 2. Fetch Active Rooms
        const { data: rooms } = await supabase
            .from('rooms')
            .select('slug, name, intent')
            .eq('palace_id', palaceId)
            .limit(5)

        // Retrieve counts per room manually
        let roomStats = []
        if (rooms) {
            for (const r of rooms) {
                const { count } = await supabase
                    .from('memories')
                    .select('*', { count: 'exact', head: true })
                    .eq('palace_id', palaceId)
                    .eq('room_slug', r.slug)
                roomStats.push({ ...r, count: count || 0 })
            }
        }
        roomStats.sort((a, b) => b.count - a.count)
        const topRooms = roomStats.slice(0, 3)

        let topRoomsText = 'various unknown sectors'
        let sectorVisuals = ''
        if (topRooms.length > 0) {
            topRoomsText = topRooms.map(r => r.name).join(', ')
            sectorVisuals = topRooms.map(r => `- ${r.name} (${r.intent || 'core sector'}): heavily active area reflecting its intent.`).join('\n  ')
        }

        // 3. Fetch Agents from Agent Roster (NOT Personas)
        const { data: agents } = await supabase
            .from('agents')
            .select('agent_name')
            .eq('palace_id', palaceId)
            .eq('active', true)
            .limit(4)

        const activePersonasText = (agents || []).map(a => getPersonaVisual(a.agent_name)).join('\n- ') || 'Standard worker drones'

        return `${SHARED_DIRECTIVES_DEEP}

SCENE: A sweeping, wide-angle establishing shot of the entire "Memory Palace" mega-structure, reflecting its exact current database state.

DEEP STATE CONTEXT (The architecture must map to this exact data):
- Scale: The palace currently holds ${totalMemories || 0} crystallized memories. Size the architecture accordingly (small outpost vs massive citadel).
- Active Sectors: The most heavily developed areas currently are ${topRoomsText}. 
- Sector Visuals: 
  ${sectorVisuals}
- Current Workforce: The active agents modifying the palace include these specific robot characters:
- ${activePersonasText}
Show small figures of these robots working across the structure. NONE OF THEM ARE HUMAN.

COMPOSITION: Epic scale, isometric or low-angle drone shot.
CRITICAL NEGATIVE PROMPT: No text, no words, no humans, no panels.`
    }

    throw new Error(`Unknown scope: ${scope}`)
}
