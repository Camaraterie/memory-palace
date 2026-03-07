import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'
import { buildDeepContextPrompt } from '../../../../lib/visualization'
import { generateImageFromPrompt } from '../../../../lib/gemini'

export const maxDuration = 60 // Allow up to 60s for image generation

async function resolveAuth(supabase, authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]

  if (token.startsWith('gk_')) {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('palace_id, permissions, active')
      .eq('guest_key', token)
      .single()
    if (error || !agent || !agent.active) return null
    if (!['write', 'admin'].includes(agent.permissions)) return null
    return { palace_id: agent.palace_id }
  }

  return null
}

export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin()

    // Auth verification
    const authHeader = request.headers.get('authorization')
    let palaceId = null

    // For dashboard context, check cookies if no auth header
    if (!authHeader) {
      // In this app, we might rely on the client passing the token. 
      // If we don't have an auth header, we can try to find the session, but let's assume the dashboard client passes the session token.
      // Wait, standard route.js using Next.js cookies works differently. Let's see if other API routes use headers or cookies.
      // Usually, client passes palace_id or token in header.
      // Actually, since createClient is usually for SSR and here we use createSupabaseAdmin, we'll just check if they passed a valid token.
      // Let's implement a fallback if they only pass palace_id and have a valid cookie session.
    }

    const auth = await resolveAuth(supabase, authHeader)
    
    // For simplicity in the dashboard, if they don't have a Bearer token but are logged in, we should ideally verify their session.
    // Let's verify session via standard SSR client if authHeader is missing.
    if (!auth) {
      // Wait, let's just require the dashboard to send the session access token as Bearer token.
      // If they do, resolveAuth will fail if it's not a gk_ or palace_id. Ah! If they send a Supabase auth token, `resolveAuth` above fails!
      // Let's use the standard user auth for dashboard requests.
      const { createClient } = require('../../../../utils/supabase/server')
      const userSupabase = await createClient()
      const { data: { user } } = await userSupabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      
      const body = await request.json()
      palaceId = body.palace_id
      
      // Verify ownership
      const { data: palace } = await supabase
        .from('palaces')
        .select('id')
        .eq('id', palaceId)
        .eq('owner_id', user.id)
        .single()
        
      if (!palace) {
        return NextResponse.json({ error: 'Unauthorized for this palace' }, { status: 403 })
      }
    } else {
      palaceId = auth.palace_id
      // Need to parse body here
      var body = await request.json()
    }

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
