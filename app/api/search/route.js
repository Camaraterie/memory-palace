import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'

async function resolveAuth(supabase, authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    const token = authHeader.split(' ')[1]

    if (token.startsWith('gk_')) {
        const { data, error } = await supabase
            .from('agents')
            .select('palace_id, permissions, active')
            .eq('guest_key', token)
            .single()
        if (error || !data || !data.active) return null
        return { palace_id: data.palace_id }
    }

    return null
}

// POST /api/search
// Body: { embedding?: number[768], query?: string, room?: string, limit?: number, threshold?: number }
export async function POST(request) {
    try {
        const supabase = createSupabaseAdmin()
        const authHeader = request.headers.get('authorization')
        const auth = await resolveAuth(supabase, authHeader)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { embedding, query, room, limit = 10, threshold } = body

        if (!embedding && !query) {
            return NextResponse.json({ error: 'embedding or query required' }, { status: 400 })
        }

        if (embedding) {
            // Semantic search via pgvector cosine similarity (Supabase RPC)
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

            return NextResponse.json({ success: true, mode: 'semantic', memories: data || [] })
        } else {
            // Keyword fallback via Supabase full-text search on ciphertext
            let q = supabase
                .from('memories')
                .select('short_id, agent, session_name, room_slug, created_at')
                .eq('palace_id', auth.palace_id)
                .ilike('ciphertext', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (room) {
                q = q.eq('room_slug', room)
            }

            const { data, error } = await q
            if (error) throw error

            return NextResponse.json({ success: true, mode: 'keyword', memories: data || [] })
        }
    } catch (error) {
        console.error('search error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
