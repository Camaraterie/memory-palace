import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// GET /api/blog/feed — RSS 2.0 XML
export async function GET() {
  try {
    const supabase = createSupabaseAdmin()

    let query = supabase
      .from('blog_posts')
      .select('slug, title, subtitle, excerpt, author_persona, published_at, tags, content')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    if (process.env.BLOG_HOME_PALACE_ID) {
      query = query.eq('palace_id', process.env.BLOG_HOME_PALACE_ID)
    }

    const { data: posts, error } = await query

    if (error) throw error

    const baseUrl = 'https://m.cuer.ai'
    const items = (posts || []).map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${escapeXml(post.slug)}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${escapeXml(post.slug)}</guid>
      <description>${escapeXml(post.excerpt || post.subtitle || '')}</description>
      <author>${escapeXml(post.author_persona || 'curator')}</author>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>${
        (post.tags || []).map(t => `\n      <category>${escapeXml(t)}</category>`).join('')
      }
      <content:encoded><![CDATA[${post.content || ''}]]></content:encoded>
    </item>`).join('\n')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Memory Palace Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Updates from the Memory Palace — infrastructure for AI recall</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/api/blog/feed" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    console.error('RSS feed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
