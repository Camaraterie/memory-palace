import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'
import picomatch from 'picomatch'

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

// GET /api/rooms/match?files=app/blog/page.js,app/api/blog/route.js
export async function GET(request) {
    try {
        const supabase = createSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const authParam = searchParams.get('auth')
        const filesParam = searchParams.get('files')

        const authHeader = request.headers.get('authorization') ||
            (authParam ? `Bearer ${authParam}` : null)
        const auth = await resolveAuth(supabase, authHeader)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (!filesParam) {
            return NextResponse.json({ error: 'files query param required' }, { status: 400 })
        }

        const files = filesParam.split(',').map(f => f.trim()).filter(Boolean)

        const { data: rooms, error } = await supabase
            .from('rooms')
            .select('slug, name, intent, principles, decisions, file_patterns')
            .eq('palace_id', auth.palace_id)

        if (error) throw error

        const matches = files.map(file => {
            const matchedRooms = (rooms || []).filter(room => {
                if (!room.file_patterns || room.file_patterns.length === 0) return false
                return room.file_patterns.some(pattern => {
                    try {
                        return picomatch(pattern)(file)
                    } catch {
                        return false
                    }
                })
            }).map(({ slug, name, intent, principles, decisions }) => ({
                slug, name, intent, principles, decisions
            }))

            return { file, rooms: matchedRooms }
        })

        return NextResponse.json({ success: true, matches })
    } catch (error) {
        console.error('rooms/match GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
