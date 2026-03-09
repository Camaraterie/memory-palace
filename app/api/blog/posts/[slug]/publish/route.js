import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../../../lib/supabase'
import { resolveAuth } from '../../../../../../lib/auth'

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

    // Read body first so palace_id is available for session auth path
    const body = await request.json()

    // Require admin permissions — owner only
    const auth = await resolveAuth(request, body.palace_id)
    if (!auth) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }
    if (auth.permissions !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required to publish.' }, { status: 403, headers: CORS_HEADERS })
    }

    const { action, metadata } = body

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

    if (post.palace_id !== auth.palace_id) {
      return NextResponse.json({ error: 'Post does not belong to this palace' }, { status: 403, headers: CORS_HEADERS })
    }

    const now = new Date().toISOString()
    const update = { updated_at: now }

    // Persist in-flight metadata (e.g. audience) sent from the dashboard
    if (metadata && typeof metadata === 'object') {
      update.metadata = metadata
    }

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
