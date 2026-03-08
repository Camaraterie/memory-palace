import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'
import { buildDeepContextPrompt } from '../../../../lib/visualization'
import { generateImageFromPrompt } from '../../../../lib/gemini'
import { resolveAuth } from '../../../../lib/auth'

export const maxDuration = 60 // Allow up to 60s for image generation

export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin()

    // Read body first so we can pass palace_id to resolveAuth for session path
    const body = await request.json()

    const auth = await resolveAuth(request, body.palace_id)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!['write', 'admin'].includes(auth.permissions)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const palaceId = auth.palace_id
    const { scope, target_id } = body

    if (!['blog', 'room', 'full'].includes(scope)) {
      return NextResponse.json({ error: 'Invalid scope. Must be blog, room, or full.' }, { status: 400 })
    }

    // 1. Build Deep Context Prompt
    const prompt = await buildDeepContextPrompt(supabase, palaceId, scope, target_id)

    // 2. Call Gemini
    const imageBuffer = await generateImageFromPrompt(prompt)

    // 3. Upload to Supabase Storage
    const timestamp = Date.now()
    const fileName = `${scope}-${target_id || 'state'}-${timestamp}.png`
    const filePath = `${palaceId}/visualizations/${scope}/${fileName}`

    const { error: uploadErr } = await supabase.storage
      .from('memory-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadErr) throw uploadErr

    const { data: publicUrlData } = supabase.storage
      .from('memory-images')
      .getPublicUrl(filePath)

    const imageUrl = publicUrlData.publicUrl

    // 4. Update specific record if needed
    if (scope === 'blog') {
      await supabase
        .from('blog_posts')
        .update({ cover_image: imageUrl })
        .eq('palace_id', palaceId)
        .eq('slug', target_id)
    } else if (scope === 'room') {
      // If we had a cover_image column on rooms we could update it here.
    }

    return NextResponse.json({ success: true, image_url: imageUrl, prompt_used: prompt })
  } catch (error) {
    console.error('Visualization error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
