import { createSupabaseAdmin } from './supabase'

const SHARED_DIRECTIVES = "Rich comic book illustration style, highly detailed, vibrant colors, clean linework. Ambient, cinematic lighting. Masterpiece quality. The image must represent a digital architecture or 'Memory Palace' where abstract code and data are visualized as physical structures, machinery, or archives."

export async function buildDeepContextPrompt(supabase, palaceId, scope, targetId) {
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
        let personaVisualPrompt = 'A standard robot architect.'
        if (post.author_persona) {
            // Attempt to fetch persona by name or role matching author_persona (it's often stored as lower-case slug-like string)
            const { data: personas } = await supabase
                .from('personas')
                .select('*')
                .eq('palace_id', palaceId)
                .ilike('name', `%${post.author_persona}%`)
            
            if (personas && personas.length > 0 && personas[0].visual_prompt) {
                personaVisualPrompt = personas[0].visual_prompt
            }
        }

        // 3. Fetch Deep State Context from source_memories
        let decisions = []
        let builtItems = []
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
                    }
                })
            }
        }

        const tagsJoined = (post.tags || []).join(', ') || 'software architecture'
        const recentBuilt = builtItems.slice(0, 3).join(', ') || 'new abstract data structures'
        const relevantPrinciples = decisions.slice(0, 3).join(', ') || 'stability and intentionality'

        return `${SHARED_DIRECTIVES}

SCENE: A cinematic cover illustration representing the current state of a software project, narrated by a specific persona.

AUTHOR PERSONA: ${personaVisualPrompt}. The character is central to the image, actively engaged with the environment.

DEEP STATE CONTEXT (Translate these technical facts into visual elements in the background/environment):
- Core Theme: "${post.excerpt || post.title}"
- Related Themes: ${tagsJoined}
- Recent Manifestations (Recently Built): ${recentBuilt}. Visualize these as actual objects, glowing blueprints, or machinery currently being forged or studied by the persona.
- Foundational Rules & Decisions: ${relevantPrinciples}. Visualize these rules as architectural constraints (e.g., if stability is mentioned, show heavy armor/reinforcements).

COMPOSITION: A single, wide, striking environmental image (aspect ratio 16:9). The persona is interacting with the deep state context.
CRITICAL NEGATIVE PROMPT: Do NOT include any text overlays, words, floating UI panels, speech bubbles, or grid layouts. This must be a single, pure, seamless illustration.`

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

        return `${SHARED_DIRECTIVES}

SCENE: An architectural visualization of a specific sector known as a "Room" within a massive digital "Memory Palace".

SUBJECT: This room is known as "${room.name}". Its primary architectural intent is: "${room.intent || 'Unknown intent'}". The visual design MUST heavily reflect this intent.

ENVIRONMENT: The architecture should visually manifest the principles: "${roomPrinciples}". If it is an infrastructure room, show heavy, stable, glowing servers. If it is a blog/content area, show endless organized archives or a futuristic broadcasting studio. The room currently holds ${count || 0} crystallized memory nodes floating or securely stored within. Recent decisions shaping this room include: "${roomDecisions}".

COMPOSITION: Isometric or wide-angle environmental shot showing the scale of the room. 
CRITICAL NEGATIVE PROMPT: No text, no words, no panels.`

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

        // Retrieve counts per room manually (naive approach for now)
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

        // 3. Fetch Personas
        const { data: personas } = await supabase
            .from('personas')
            .select('name, visual_prompt')
            .eq('palace_id', palaceId)
            .eq('active', true)
            .limit(3)

        const activePersonasText = (personas || []).map(p => p.visual_prompt || p.name).join('; ') || 'Standard worker drones'

        return `${SHARED_DIRECTIVES}

SCENE: A sweeping, wide-angle establishing shot of the entire "Memory Palace" mega-structure, reflecting its exact current database state.

DEEP STATE CONTEXT (The architecture must map to this exact data):
- Scale: The palace currently holds ${totalMemories || 0} crystallized memories. Size the architecture accordingly (small outpost vs massive citadel).
- Active Sectors: The most heavily developed areas currently are ${topRoomsText}. 
- Sector Visuals: 
  ${sectorVisuals}
- Current Workforce: The active agents modifying the palace include: ${activePersonasText}. Show small figures of these robots/entities working across the structure.

COMPOSITION: Epic scale, isometric or low-angle drone shot.
CRITICAL NEGATIVE PROMPT: No text, no words, no panels.`
    }

    throw new Error(`Unknown scope: ${scope}`)
}
