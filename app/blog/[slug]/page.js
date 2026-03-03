import { createSupabaseAdmin } from '../../../lib/supabase'
import PostClient from './PostClient'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const supabase = createSupabaseAdmin()
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, subtitle, excerpt')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (post) {
      return {
        title: `${post.title} — Memory Palace Blog`,
        description: post.excerpt || post.subtitle || '',
      }
    }
  } catch {}
  return { title: 'Post Not Found — Memory Palace Blog' }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params

  let post = null
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!error && data) post = data
  } catch (e) {
    console.error('Blog post fetch error:', e)
  }

  if (!post) notFound()

  return <PostClient post={post} />
}
