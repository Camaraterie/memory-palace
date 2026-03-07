import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'
import { Client } from 'pg'

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

    const { data, error } = await supabase
        .from('palaces')
        .select('id')
        .eq('id', token)
        .single()
    if (error || !data) return null
    return { palace_id: data.id }
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
            // Semantic search via pgvector cosine similarity
            if (!Array.isArray(embedding) || embedding.length !== 768) {
                return NextResponse.json({ error: 'embedding must be number[768]' }, { status: 400 })
            }

            if (!process.env.DATABASE_URL) {
                return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
            }

            const client = new Client({ connectionString: process.env.DATABASE_URL })
            try {
                await client.connect()
                const vectorStr = `[${embedding.join(',')}]`
                const params = [vectorStr, auth.palace_id, room || null, limit]
                const result = await client.query(
                    `SELECT short_id, agent, session_name, room_slug, created_at,
                            1 - (embedding <=> $1::vector) as similarity
                     FROM memories
                     WHERE palace_id = $2::uuid AND embedding IS NOT NULL
                       AND ($3::text IS NULL OR room_slug = $3)
                     ORDER BY embedding <=> $1::vector
                     LIMIT $4`,
                    params
                )
                let memories = result.rows
                if (threshold !== undefined) {
                    memories = memories.filter(m => m.similarity >= threshold)
                }
                return NextResponse.json({ success: true, mode: 'semantic', memories })
            } finally {
                await client.end()
            }
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
