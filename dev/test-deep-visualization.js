import { createSupabaseAdmin } from '../lib/supabase.js'
import { buildDeepContextPrompt } from '../lib/visualization.js'

async function runTest() {
  try {
    const supabase = createSupabaseAdmin()
    const palaceId = process.env.BLOG_HOME_PALACE_ID || '7a5c5dd2-093e-4b66-b3ce-b026076e87a1'

    console.log('--- Testing Blog Scope ---')
    const blogPrompt = await buildDeepContextPrompt(supabase, palaceId, 'blog', 'the-palace-learns-to-remember-why')
    console.log(blogPrompt)
    console.log('\n=================================\n')

    console.log('--- Testing Room Scope ---')
    const roomPrompt = await buildDeepContextPrompt(supabase, palaceId, 'room', 'infra')
    console.log(roomPrompt)
    console.log('\n=================================\n')

    console.log('--- Testing Full Scope ---')
    const fullPrompt = await buildDeepContextPrompt(supabase, palaceId, 'full', null)
    console.log(fullPrompt)
    console.log('\n=================================\n')

    console.log('Test completed successfully.')
  } catch (err) {
    console.error('Test failed:', err)
  }
}

runTest()