import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET /api/blog/posts — list published posts (public, no auth)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createSupabaseAdmin()

    let query = supabase
      .from('blog_posts')
      .select('id, slug, title, subtitle, excerpt, author_persona, cover_image, status, tags, published_at, created_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (process.env.BLOG_HOME_PALACE_ID) {
      query = query.eq('palace_id', process.env.BLOG_HOME_PALACE_ID)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: posts, error, count } = await query

    if (error) throw error

    return NextResponse.json({ posts: posts || [], total: count || 0 }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Blog list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}

// POST /api/blog/posts — create or update a post (auth required)
export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin()

    // Auth: palace_id or guest_key with write permission
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: CORS_HEADERS })
    }

    const token = authHeader.split(' ')[1]
    let palaceId = null
    let isOwner = false

    if (token.startsWith('gk_')) {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('palace_id, permissions, active')
        .eq('guest_key', token)
        .single()
      if (error || !agent || !agent.active) {
        return NextResponse.json({ error: 'Invalid or inactive guest key' }, { status: 403, headers: CORS_HEADERS })
      }
      if (!['write', 'admin'].includes(agent.permissions)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403, headers: CORS_HEADERS })
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
      isOwner = true
    }

    const body = await request.json()
    const { slug, title, content, subtitle, excerpt, author_persona, cover_image, status, tags, source_memories, show_provenance, social_variants, metadata } = body

    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'slug, title, and content are required' }, { status: 400, headers: CORS_HEADERS })
    }

    // Guest keys can only create/update drafts — not publish directly
    if (!isOwner && status === 'published') {
      return NextResponse.json({ error: 'Guest keys cannot publish directly. Submit as draft for owner review.' }, { status: 403, headers: CORS_HEADERS })
    }

    // Check if slug exists for this palace (upsert)
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id, palace_id, status')
      .eq('slug', slug)
      .single()

    const now = new Date().toISOString()
    const record = {
      palace_id: palaceId,
      slug,
      title,
      content,
      subtitle: subtitle || null,
      excerpt: excerpt || content.slice(0, 280).replace(/\n/g, ' '),
      author_persona: author_persona || 'curator',
      cover_image: cover_image || null,
      status: status || 'draft',
      tags: tags || [],
      source_memories: source_memories || [],
      show_provenance: show_provenance || false,
      social_variants: social_variants || {},
      metadata: metadata || {},
      updated_at: now,
    }

    // Auto-set published_at when status changes to published
    if (record.status === 'published') {
      if (!existing || existing.status !== 'published') {
        record.published_at = now
      }
    }

    let post
    if (existing && existing.palace_id === palaceId) {
      // Update
      const { data, error } = await supabase
        .from('blog_posts')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      post = data
    } else if (existing) {
      return NextResponse.json({ error: 'Slug already exists for another palace' }, { status: 409, headers: CORS_HEADERS })
    } else {
      // Create
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      post = data
    }

    return NextResponse.json({ success: true, post }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Blog create/update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
