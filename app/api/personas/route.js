import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'
import { resolveAuth } from '../../../lib/auth'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET /api/personas — list personas (auth required)
export async function GET(request) {
  try {
    const supabase = createSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    // Session path: ?palace_id=<uuid> (no token needed, session cookie used)
    const palaceIdParam = searchParams.get('palace_id')

    const auth = await resolveAuth(request, palaceIdParam)
    if (!auth) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name, role, focus_areas, tone, avatar_description, visual_prompt, active, created_at')
      .eq('palace_id', auth.palace_id)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, personas: personas || [] }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Personas list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}

// POST /api/personas — create a new persona
export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin()

    // Read body first so palace_id is available for session auth path
    const body = await request.json()

    const auth = await resolveAuth(request, body.palace_id)
    if (!auth) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const { name, role, focus_areas, tone, avatar_description, visual_prompt, active = true } = body

    if (!name || !role) {
      return NextResponse.json({ error: 'name and role are required' }, { status: 400, headers: CORS_HEADERS })
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        palace_id: auth.palace_id,
        name,
        role,
        focus_areas: focus_areas || [],
        tone: tone || null,
        avatar_description: avatar_description || null,
        visual_prompt: visual_prompt || null,
        active,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, persona }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Persona create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}

// PUT /api/personas — update an existing persona
export async function PUT(request) {
  try {
    const supabase = createSupabaseAdmin()

    // Read body first so palace_id is available for session auth path
    const body = await request.json()

    const auth = await resolveAuth(request, body.palace_id)
    if (!auth) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const { id, name, role, focus_areas, tone, avatar_description, visual_prompt, active } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (focus_areas !== undefined) updateData.focus_areas = focus_areas
    if (tone !== undefined) updateData.tone = tone
    if (avatar_description !== undefined) updateData.avatar_description = avatar_description
    if (visual_prompt !== undefined) updateData.visual_prompt = visual_prompt
    if (active !== undefined) updateData.active = active

    const { data: persona, error } = await supabase
      .from('personas')
      .update(updateData)
      .eq('id', id)
      .eq('palace_id', auth.palace_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, persona }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Persona update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
