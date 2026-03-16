import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'
import { resolveAuth } from '../../../lib/auth'

// POST /api/search
// Body: { embedding?: number[768], query?: string, room?: string, limit?: number, threshold?: number }
export async function POST(request) {
    try {
        const supabase = createSupabaseAdmin()
        const body = await request.json()
        const auth = await resolveAuth(request, body.palace_id)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { embedding, query, room, limit = 10, threshold } = body

        if (!embedding && !query) {
            return NextResponse.json({ error: 'embedding or query required' }, { status: 400 })
        }

        // Federation search: fan out across all palaces in the ecosystem
        if (auth.federation) {
            return await federationSearch(supabase, auth, { embedding, query, room, limit, threshold })
        }

        // Single-palace search (gk_ or session auth)
        if (embedding) {
            if (!Array.isArray(embedding) || embedding.length !== 768) {
                return NextResponse.json({ error: 'embedding must be number[768]' }, { status: 400 })
            }

            const { data, error: rpcError } = await supabase.rpc('search_memories', {
                query_embedding: `[${embedding.join(',')}]`,
                palace_id_param: auth.palace_id,
                room_filter: room || null,
                match_count: limit,
                similarity_threshold: threshold || 0.0,
            })

            if (rpcError) throw rpcError

            const memories = (data || []).map(m => ({ ...m, palace_id: auth.palace_id }))
            return NextResponse.json({ success: true, mode: 'semantic', memories })
        } else {
            let q = supabase
                .from('memories')
                .select('short_id, agent, session_name, room_slug, latent_intent, created_at')
                .eq('palace_id', auth.palace_id)
                .ilike('ciphertext', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (room) {
                q = q.eq('room_slug', room)
            }

            const { data, error } = await q
            if (error) throw error

            const memories = (data || []).map(m => ({ ...m, palace_id: auth.palace_id }))
            return NextResponse.json({ success: true, mode: 'keyword', memories })
        }
    } catch (error) {
        console.error('search error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function federationSearch(supabase, auth, { embedding, query, room, limit, threshold }) {
    const palaceIds = auth.palace_ids

    if (embedding) {
        if (!Array.isArray(embedding) || embedding.length !== 768) {
            return NextResponse.json({ error: 'embedding must be number[768]' }, { status: 400 })
        }

        // Fan out semantic search across all palaces
        const results = await Promise.all(palaceIds.map(async (pid) => {
            const { data, error } = await supabase.rpc('search_memories', {
                query_embedding: `[${embedding.join(',')}]`,
                palace_id_param: pid,
                room_filter: room || null,
                match_count: limit,
                similarity_threshold: threshold || 0.0,
            })
            if (error) return []
            return (data || []).map(m => ({ ...m, palace_id: pid }))
        }))

        // Merge, sort by similarity descending, take top limit
        const merged = results.flat().sort((a, b) => (b.similarity || 0) - (a.similarity || 0)).slice(0, limit)

        return NextResponse.json({ success: true, mode: 'semantic', federation: true, memories: merged })
    } else {
        // Fan out keyword search across all palaces
        const results = await Promise.all(palaceIds.map(async (pid) => {
            let q = supabase
                .from('memories')
                .select('short_id, agent, session_name, room_slug, latent_intent, created_at')
                .eq('palace_id', pid)
                .ilike('ciphertext', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (room) {
                q = q.eq('room_slug', room)
            }

            const { data, error } = await q
            if (error) return []
            return (data || []).map(m => ({ ...m, palace_id: pid }))
        }))

        // Merge, sort by created_at descending, take top limit
        const merged = results.flat()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit)

        return NextResponse.json({ success: true, mode: 'keyword', federation: true, memories: merged })
    }
}
