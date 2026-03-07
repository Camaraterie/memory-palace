import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../../../lib/supabase'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// POST /api/blog/posts/[slug]/publish — publish, unpublish, or reject a post (palace owner only)
export async function POST(request, { params }) {
  try {
    const { slug } = await params
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
      return NextResponse.json({ error: 'Admin permission required to publish.' }, { status: 403, headers: CORS_HEADERS })
    }
    const palace = { id: agent.palace_id }

    const body = await request.json()
    const { action } = body

    if (!['publish', 'unpublish', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be publish, unpublish, or reject' }, { status: 400, headers: CORS_HEADERS })
    }

    // Fetch the post and verify it belongs to this palace
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, palace_id, status, published_at')
      .eq('slug', slug)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: CORS_HEADERS })
    }

    if (post.palace_id !== palace.id) {
      return NextResponse.json({ error: 'Post does not belong to this palace' }, { status: 403, headers: CORS_HEADERS })
    }

    const now = new Date().toISOString()
    const update = { updated_at: now }

    if (action === 'publish') {
      update.status = 'published'
      if (!post.published_at) {
        update.published_at = now
      }
    } else if (action === 'unpublish') {
      update.status = 'draft'
      update.published_at = null
    } else if (action === 'reject') {
      update.status = 'rejected'
    }

    const { data: updated, error: updateError } = await supabase
      .from('blog_posts')
      .update(update)
      .eq('id', post.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ success: true, post: updated }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Blog publish error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
