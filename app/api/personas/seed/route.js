import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

const INITIAL_PERSONAS = [
  {
    name: 'Backend',
    role: 'Developer',
    focus_areas: ['APIs', 'Database', 'Authentication', 'Server-side logic'],
    tone: 'Technical, precise, focused on architecture and performance',
    avatar_description: 'Server rack with glowing lights',
    visual_prompt: 'A focused developer wearing a warm beanie and round glasses, hunched over multiple terminal windows displaying code and server logs, with a steaming cup of coffee nearby. Warm amber lighting from screens illuminates their concentrated expression. Background shows server racks and database schematics on whiteboard.',
  },
  {
    name: 'Frontend',
    role: 'Developer',
    focus_areas: ['UI Components', 'Styling', 'User Experience', 'Interactions'],
    tone: 'Visual, user-focused, emphasizing accessibility and polish',
    avatar_description: 'Colorful interface mockup with cursor',
    visual_prompt: 'A creative designer with colorful headphones and a modern tablet, surrounded by floating UI elements and color swatches. Multiple browser windows show polished interfaces with smooth animations. The scene is vibrant with warm sunset colors, and sticky notes with UX sketches cover the workspace.',
  },
  {
    name: 'DevOps',
    role: 'Engineer',
    focus_areas: ['Deployment', 'Infrastructure', 'Monitoring', 'CI/CD'],
    tone: 'Operational, reliability-focused, emphasizing automation',
    avatar_description: 'Cloud infrastructure diagram with pipelines',
    visual_prompt: 'A systems engineer with a practical headset and monitoring displays showing green status graphs. They stand before a wall of screens showing infrastructure diagrams, deployment pipelines flowing smoothly, and real-time metrics. Cool blue lighting creates a high-tech operations center feel.',
  },
  {
    name: 'Product Manager',
    role: 'Planner',
    focus_areas: ['Requirements', 'Priorities', 'User Stories', 'Feature Planning'],
    tone: 'Strategic, user-centric, focused on outcomes',
    avatar_description: 'Kanban board with feature cards',
    visual_prompt: 'A strategic planner with a thoughtful expression, standing before a large kanban board filled with colorful user story cards and priority matrices. They hold a tablet showing roadmap timelines. Warm office lighting with whiteboards covered in user journey maps and feature prioritization frameworks.',
  },
  {
    name: 'Metablogger',
    role: 'Writer',
    focus_areas: ['Documentation', 'Blog Posts', 'Changelogs', 'Announcements'],
    tone: 'Narrative, engaging, translating technical work into stories',
    avatar_description: 'Quill pen writing on digital scroll',
    visual_prompt: 'A skilled writer with vintage-inspired glasses, working at a laptop with a Markdown editor open. Beside them are published blog posts, documentation drafts, and a digital quill pen icon. The workspace has warm library lighting with reference books and a cup of tea. Screens show polished blog layouts and engaging technical articles.',
  },
  {
    name: 'QA/Tester',
    role: 'Tester',
    focus_areas: ['Bug Reports', 'Test Scenarios', 'Validation', 'Quality Assurance'],
    tone: 'Thorough, detail-oriented, focused on edge cases',
    avatar_description: 'Checkmark shield with magnifying glass',
    visual_prompt: 'A meticulous tester with a magnifying glass and checklist, examining an application with bug reports and test scenarios spread out. Multiple devices show different testing scenarios, edge cases are highlighted, and red/green test results are visible. The scene has precise, organized lighting with labeled test cases and quality metrics.',
  },
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const token = authHeader.split(' ')[1]
    let palaceId = null

    if (!token.startsWith('gk_')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 403, headers: CORS_HEADERS })
    }
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('palace_id, active')
      .eq('guest_key', token)
      .single()
    if (agentError || !agent || !agent.active) {
      return NextResponse.json({ error: 'Invalid or inactive guest key' }, { status: 403, headers: CORS_HEADERS })
    }
    palaceId = agent.palace_id

    // Check if personas already exist for this palace
    const { data: existing, error: checkError } = await supabase
      .from('personas')
      .select('id')
      .eq('palace_id', palaceId)

    if (checkError) throw checkError

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Personas already exist',
        count: existing.length
      }, { headers: CORS_HEADERS })
    }

    // Insert initial personas
    const personasToInsert = INITIAL_PERSONAS.map(p => ({
      palace_id: palaceId,
      ...p,
      active: true,
    }))

    const { data: personas, error } = await supabase
      .from('personas')
      .insert(personasToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Seeded ${personas.length} initial personas`,
      personas
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Persona seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
