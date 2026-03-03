import { createSupabaseAdmin } from '../../../lib/supabase'
import { createClient } from '../../../utils/supabase/server'
import PostClient from './PostClient'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const supabase = createSupabaseAdmin()
    let query = supabase
      .from('blog_posts')
      .select('title, subtitle, excerpt')
      .eq('slug', slug)
      .eq('status', 'published')

    if (process.env.BLOG_HOME_PALACE_ID) {
      query = query.eq('palace_id', process.env.BLOG_HOME_PALACE_ID)
    }

    const { data: post } = await query.single()

    if (post) {
      return {
        title: `${post.title} — Memory Palace Blog`,
        description: post.excerpt || post.subtitle || '',
      }
    }
  } catch {}
  return { title: 'Post Not Found — Memory Palace Blog' }
}

export default async function BlogPostPage({ params, searchParams }) {
  const { slug } = await params
  const { preview } = await searchParams
  const isPreview = preview === 'true'

  let post = null
  try {
    const supabase = createSupabaseAdmin()

    if (isPreview) {
      // Preview mode: check Supabase cookie auth + palace ownership
      const authClient = await createClient()
      const { data: { user } } = await authClient.auth.getUser()

      if (user) {
        // Fetch the post without status filter
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!error && data) {
          // Verify the logged-in user owns this palace
          const { data: palace } = await supabase
            .from('palaces')
            .select('id')
            .eq('id', data.palace_id)
            .eq('owner_id', user.id)
            .single()

          if (palace) {
            post = data
          }
        }
      }
    }

    if (!post) {
      // Normal mode: published only
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')

      if (process.env.BLOG_HOME_PALACE_ID) {
        query = query.eq('palace_id', process.env.BLOG_HOME_PALACE_ID)
      }

      const { data, error } = await query.single()

      if (!error && data) post = data
    }
  } catch (e) {
    console.error('Blog post fetch error:', e)
  }

  if (!post) notFound()

  return <PostClient post={post} />
}
