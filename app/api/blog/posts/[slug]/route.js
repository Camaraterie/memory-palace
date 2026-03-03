import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../../lib/supabase'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET /api/blog/posts/[slug] — single post (public)
export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const supabase = createSupabaseAdmin()

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: CORS_HEADERS })
    }

    return NextResponse.json({ success: true, post }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Blog post fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
}
