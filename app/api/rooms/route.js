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
        if (!['write', 'admin'].includes(data.permissions)) return null
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

// POST /api/rooms — create or update a room
export async function POST(request) {
    try {
        const supabase = createSupabaseAdmin()
        const authHeader = request.headers.get('authorization')
        const auth = await resolveAuth(supabase, authHeader)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { slug, name, intent, principles, decisions, file_patterns } = body

        if (!slug || !name) {
            return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
        }

        const now = new Date().toISOString()
        const roomData = {
            palace_id: auth.palace_id,
            slug,
            name,
            intent: intent || null,
            principles: principles || [],
            decisions: decisions || [],
            file_patterns: file_patterns || [],
            updated_at: now,
        }

        const { data, error } = await supabase
            .from('rooms')
            .upsert(roomData, { onConflict: 'palace_id,slug' })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, room: data })
    } catch (error) {
        console.error('rooms POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/rooms — list all rooms for the palace, with memory_count and last_activity
export async function GET(request) {
    try {
        const supabase = createSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const authParam = searchParams.get('auth')

        const authHeader = request.headers.get('authorization') ||
            (authParam ? `Bearer ${authParam}` : null)
        const auth = await resolveAuth(supabase, authHeader)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { data: rooms, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('palace_id', auth.palace_id)
            .order('updated_at', { ascending: false })

        if (error) throw error

        // Enrich with memory_count and last_activity
        const enriched = await Promise.all((rooms || []).map(async (room) => {
            const { count } = await supabase
                .from('memories')
                .select('id', { count: 'exact', head: true })
                .eq('palace_id', auth.palace_id)
                .eq('room_slug', room.slug)

            const { data: latest } = await supabase
                .from('memories')
                .select('created_at')
                .eq('palace_id', auth.palace_id)
                .eq('room_slug', room.slug)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            return {
                ...room,
                memory_count: count || 0,
                last_activity: latest?.created_at || null,
            }
        }))

        return NextResponse.json({ success: true, rooms: enriched })
    } catch (error) {
        console.error('rooms GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
