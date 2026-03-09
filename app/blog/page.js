import { createSupabaseAdmin } from '../../lib/supabase'
import BlogClient from './BlogClient'

export const revalidate = 60

export const metadata = {
  title: 'Blog — Memory Palace',
  description: 'Updates from Memory Palace — infrastructure for AI recall.',
}

export default async function BlogPage() {
  let posts = []
  try {
    const supabase = createSupabaseAdmin()
    let query = supabase
      .from('blog_posts')
      .select('id, slug, title, subtitle, excerpt, author_persona, cover_image, tags, published_at, created_at, palace_id, metadata')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)

    if (process.env.BLOG_HOME_PALACE_ID) {
      query = query.eq('palace_id', process.env.BLOG_HOME_PALACE_ID)
    }

    const { data, error } = await query

    if (!error && data) posts = data
  } catch (e) {
    console.error('Blog page fetch error:', e)
  }

  return <BlogClient posts={posts} />
}
