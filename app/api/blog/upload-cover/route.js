import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'
import { resolveAuth } from '../../../../lib/auth'

export async function POST(request) {
  try {
    // Read formData first — body can only be consumed once.
    // palace_id is passed as a FormData field from the dashboard session path.
    const formData = await request.formData()
    const image = formData.get('image')
    const slug = formData.get('slug')
    const palaceIdField = formData.get('palace_id') || null

    // resolveAuth only reads request.headers and request.url, not body — safe to call after formData
    const auth = await resolveAuth(request, palaceIdField)
    if (!auth) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }
    if (auth.permissions !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required.' }, { status: 403 })
    }

    if (!image || !slug) {
      return NextResponse.json({ error: 'Missing image or slug parameter' }, { status: 400 })
    }

    const supabase = createSupabaseAdmin()

    const buffer = Buffer.from(await image.arrayBuffer())
    const ext = (image.name || 'image.png').split('.').pop() || 'png'
    const filePath = `${auth.palace_id}/blog/${slug}.${ext}`

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
      .eq('palace_id', auth.palace_id)

    if (updateError) {
      console.error('Cover update error:', updateError)
    }

    return NextResponse.json({ success: true, image_url: imageUrl })
  } catch (err) {
    console.error('Cover upload unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
