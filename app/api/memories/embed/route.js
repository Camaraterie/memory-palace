import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

// PATCH /api/memories/embed — update embedding for a given short_id
// Auth: palace_id only (owner operation for backfill)
export async function PATCH(request) {
    try {
        const supabase = createSupabaseAdmin()
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const token = authHeader.split(' ')[1]
        // Only palace_id auth (not guest keys) for backfill operations
        const { data: palace, error: palaceError } = await supabase
            .from('palaces')
            .select('id')
            .eq('id', token)
            .single()

        if (palaceError || !palace) {
            return NextResponse.json({ error: 'Unauthorized — palace_id required' }, { status: 403 })
        }

        const body = await request.json()
        const { short_id, embedding } = body

        if (!short_id) {
            return NextResponse.json({ error: 'short_id required' }, { status: 400 })
        }

        if (!Array.isArray(embedding) || embedding.length !== 768 ||
            !embedding.every(v => typeof v === 'number' && isFinite(v))) {
            return NextResponse.json({ error: 'embedding must be number[768]' }, { status: 400 })
        }

        const vectorStr = `[${embedding.join(',')}]`

        const { error } = await supabase
            .from('memories')
            .update({ embedding: vectorStr })
            .eq('short_id', short_id)
            .eq('palace_id', palace.id)

        if (error) throw error

        return NextResponse.json({ success: true, short_id })
    } catch (error) {
        console.error('memories/embed PATCH error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/memories/embed — list memories without embeddings (for backfill)
export async function GET(request) {
    try {
        const supabase = createSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const authParam = searchParams.get('auth')
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        const authHeader = request.headers.get('authorization') ||
            (authParam ? `Bearer ${authParam}` : null)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const token = authHeader.split(' ')[1]
        const { data: palace, error: palaceError } = await supabase
            .from('palaces')
            .select('id')
            .eq('id', token)
            .single()

        if (palaceError || !palace) {
            return NextResponse.json({ error: 'Unauthorized — palace_id required' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('memories')
            .select('short_id, session_name, agent, ciphertext, room_slug, created_at')
            .eq('palace_id', palace.id)
            .is('embedding', null)
            .eq('algorithm', 'plaintext')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return NextResponse.json({ success: true, memories: data || [], count: data?.length || 0 })
    } catch (error) {
        console.error('memories/embed GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
