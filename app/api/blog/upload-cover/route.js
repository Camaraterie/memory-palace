import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // Require admin gk_ — owner only
    if (!token.startsWith('gk_')) {
      return NextResponse.json({ error: 'Admin key required.' }, { status: 403 })
    }

    const supabase = createSupabaseAdmin()

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('palace_id, permissions, active')
      .eq('guest_key', token)
      .single()

    if (agentError || !agent || !agent.active) {
      return NextResponse.json({ error: 'Invalid or inactive key' }, { status: 403 })
    }
    if (agent.permissions !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required.' }, { status: 403 })
    }
    const palace = { id: agent.palace_id }

    const formData = await request.formData()
    const image = formData.get('image')
    const slug = formData.get('slug')

    if (!image || !slug) {
      return NextResponse.json({ error: 'Missing image or slug parameter' }, { status: 400 })
    }

    const buffer = Buffer.from(await image.arrayBuffer())
    const ext = (image.name || 'image.png').split('.').pop() || 'png'
    const filePath = `${palace.id}/blog/${slug}.${ext}`

    const { error: uploadError } = await supabase
      .storage
      .from('memory-images')
      .upload(filePath, buffer, {
        contentType: image.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Cover upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('memory-images')
      .getPublicUrl(filePath)

    const imageUrl = publicUrlData.publicUrl

    // Update the blog post's cover_image field
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ cover_image: imageUrl, updated_at: new Date().toISOString() })
      .eq('slug', slug)
      .eq('palace_id', palace.id)

    if (updateError) {
      console.error('Cover update error:', updateError)
    }

    return NextResponse.json({ success: true, image_url: imageUrl })
  } catch (err) {
    console.error('Cover upload unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
