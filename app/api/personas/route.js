import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET /api/personas — list personas (auth required)
export async function GET(request) {
  try {
    const supabase = createSupabaseAdmin()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const token = authHeader.split(' ')[1]
    let palaceId = null

    if (token.startsWith('gk_')) {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('palace_id, active')
        .eq('guest_key', token)
        .single()
      if (error || !agent || !agent.active) {
        return NextResponse.json({ error: 'Invalid or inactive guest key' }, { status: 403, headers: CORS_HEADERS })
      }
      palaceId = agent.palace_id
    } else {
      const { data: palace, error } = await supabase
        .from('palaces')
        .select('id')
        .eq('id', token)
        .single()
      if (error || !palace) {
        return NextResponse.json({ error: 'Invalid palace_id' }, { status: 403, headers: CORS_HEADERS })
      }
      palaceId = palace.id
    }

    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name, role, focus_areas, tone, avatar_description, active, created_at')
      .eq('palace_id', palaceId)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, personas: personas || [] }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Personas list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
