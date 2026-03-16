//
// lib/auth.js — Authentication for Memory Palace API routes.
//
// Three paths:
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
//   3. fk_ token  — federation key (cross-palace read-only). Pass as:
//                   Authorization: Bearer fk_<token>
//                   OR ?auth=fk_<token> query param
//                   Returns { palace_ids: [...], ecosystem_id, permissions: 'read',
//                             agent_name, federation: true }
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

import crypto from 'crypto'
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

  // Path 3: fk_ federation key — cross-palace read-only
  if (token && token.startsWith('fk_')) {
    const keyHash = crypto.createHash('sha256').update(token).digest('hex')
    const { data: fk, error: fkErr } = await supabase
      .from('federation_keys')
      .select('ecosystem_id, agent_name, active')
      .eq('key_hash', keyHash)
      .single()
    if (fkErr || !fk || !fk.active) return null

    // Look up all palace_ids in this ecosystem
    const { data: members } = await supabase
      .from('ecosystem_members')
      .select('palace_id')
      .eq('ecosystem_id', fk.ecosystem_id)

    const palaceIds = (members || []).map(m => m.palace_id)
    if (!palaceIds.length) return null

    return {
      palace_ids: palaceIds,
      palace_id: palaceIds[0],  // convenience — first palace for routes that expect singular
      ecosystem_id: fk.ecosystem_id,
      permissions: 'read',
      agent_name: fk.agent_name,
      federation: true,
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
