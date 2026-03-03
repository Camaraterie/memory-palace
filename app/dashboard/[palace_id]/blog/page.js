import { createClient } from '../../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import BlogManager from './BlogManager'

export default async function BlogDashboardPage({ params }) {
  const { palace_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify ownership
  const { data: palace } = await supabase
    .from('palaces')
    .select('*')
    .eq('id', palace_id)
    .eq('owner_id', user.id)
    .single()

  if (!palace) {
    redirect('/dashboard')
  }

  // Fetch all blog posts for this palace (all statuses)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('palace_id', palace_id)
    .order('updated_at', { ascending: false })

  return <BlogManager palace={palace} initialPosts={posts || []} />
}
