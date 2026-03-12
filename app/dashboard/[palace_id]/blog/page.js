import { createClient } from '../../../../utils/supabase/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'
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

  // Fetch memories with images for direct cover linking
  const { data: memories } = await supabase
    .from('memories')
    .select('short_id, agent, session_name, image_url, created_at')
    .eq('palace_id', palace_id)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })

  // Fetch recent generated/uploaded blog assets from storage so users can reuse them quickly
  const admin = createSupabaseAdmin()
  const storageAssetPaths = [`${palace_id}/blog`, `${palace_id}/visualizations/blog`]
  const assetImages = []

  for (const folder of storageAssetPaths) {
    const { data: files } = await admin
      .storage
      .from('memory-images')
      .list(folder, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } })

    if (!files || !Array.isArray(files)) continue

    files.forEach((file) => {
      if (!file?.name) return
      const fullPath = `${folder}/${file.name}`
      const { data: publicUrlData } = admin.storage.from('memory-images').getPublicUrl(fullPath)
      if (!publicUrlData?.publicUrl) return

      assetImages.push({
        id: `asset:${fullPath}`,
        image_url: publicUrlData.publicUrl,
        label: file.name,
        created_at: file.created_at || null,
        source: folder.includes('/visualizations/') ? 'visualization' : 'upload',
      })
    })
  }

  // Add existing post covers too (for quick reuse + dedupe support in client)
  ;(posts || []).forEach((post) => {
    if (!post?.cover_image) return
    assetImages.push({
      id: `post:${post.slug}`,
      image_url: post.cover_image,
      label: post.title || post.slug,
      created_at: post.updated_at || post.created_at || null,
      source: 'post-cover',
      slug: post.slug,
      source_memories: post.source_memories || [],
    })
  })

  return (
    <BlogManager
      palace={palace}
      initialPosts={posts || []}
      memories={memories || []}
      assetImages={assetImages}
    />
  )
}
