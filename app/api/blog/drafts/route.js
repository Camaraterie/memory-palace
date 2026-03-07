import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET /api/blog/drafts — list all drafts (palace owner only, no guest keys)
export async function GET(request) {
  try {
    const supabase = createSupabaseAdmin()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const token = authHeader.split(' ')[1]

    // Require admin gk_ — owner only
    if (!token.startsWith('gk_')) {
      return NextResponse.json({ error: 'Admin key required.' }, { status: 403, headers: CORS_HEADERS })
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('palace_id, permissions, active')
      .eq('guest_key', token)
      .single()

    if (agentError || !agent || !agent.active) {
      return NextResponse.json({ error: 'Invalid or inactive key' }, { status: 403, headers: CORS_HEADERS })
    }
    if (agent.permissions !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required.' }, { status: 403, headers: CORS_HEADERS })
    }
    const palace = { id: agent.palace_id }

    const { data: drafts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('palace_id', palace.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ drafts: drafts || [] }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Blog drafts list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
