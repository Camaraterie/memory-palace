import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

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

// GET /api/rooms/[slug] — single room with linked memories
export async function GET(request, { params }) {
    try {
        const supabase = createSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const authParam = searchParams.get('auth')
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        const authHeader = request.headers.get('authorization') ||
            (authParam ? `Bearer ${authParam}` : null)
        const auth = await resolveAuth(supabase, authHeader)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const slug = params.slug

        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('palace_id', auth.palace_id)
            .eq('slug', slug)
            .single()

        if (roomError || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        const { data: memories, error: memError } = await supabase
            .from('memories')
            .select('short_id, agent, session_name, created_at, algorithm')
            .eq('palace_id', auth.palace_id)
            .eq('room_slug', slug)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (memError) throw memError

        return NextResponse.json({ success: true, room, memories: memories || [] })
    } catch (error) {
        console.error('rooms/[slug] GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
