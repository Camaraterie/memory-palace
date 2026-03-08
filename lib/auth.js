//
// lib/auth.js — Authentication for Memory Palace API routes.
//
// Two paths:
//
//   1. gk_ token  — external callers (CLI, agents). Pass as:
//                   Authorization: Bearer gk_<token>
//                   OR ?auth=gk_<token> query param
//
//   2. Session    — dashboard browser. No token needed.
//                   Supabase cookie session is verified server-side.
//                   Caller must pass claimedPalaceId; ownership is confirmed
//                   against palaces.owner_id = user.id.
//
// Returns: { palace_id, permissions, agent_name? } or null (unauthorized)
// permissions: 'read' | 'write' | 'admin'  (session path always returns 'admin')
//
// Usage in a route:
//
//   // palace_id from body/query, read before calling if from body
//   const auth = await resolveAuth(request, claimedPalaceId)
//   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//

import { createSupabaseAdmin } from './supabase'

export async function resolveAuth(request, claimedPalaceId = null) {
  // Extract token from Authorization: Bearer or ?auth= query param
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const queryAuth = searchParams.get('auth')
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || queryAuth

  const supabase = createSupabaseAdmin()

  // Path 1: gk_ token — external callers (CLI, agents)
  if (token && token.startsWith('gk_')) {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('palace_id, permissions, active, agent_name')
      .eq('guest_key', token)
      .single()
    if (error || !agent || !agent.active) return null
    return {
      palace_id: agent.palace_id,
      permissions: agent.permissions,
      agent_name: agent.agent_name,
    }
  }

  // Path 2: Supabase session — dashboard browser
  if (claimedPalaceId) {
    const { createClient } = await import('../utils/supabase/server')
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) return null

    const { data: palace } = await supabase
      .from('palaces')
      .select('id')
      .eq('id', claimedPalaceId)
      .eq('owner_id', user.id)
      .single()

    if (!palace) return null
    return { palace_id: claimedPalaceId, permissions: 'admin' }
  }

  return null
}
