import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'

async function resolveAuth(supabase, authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null

    const token = authHeader.split(' ')[1]

    if (token.startsWith('gk_')) {
        // Guest key auth
        const { data, error } = await supabase
            .from('agents')
            .select('palace_id, permissions, active')
            .eq('guest_key', token)
            .single()
        if (error || !data || !data.active) return null
        return { palace_id: data.palace_id, permissions: data.permissions, via: 'guest_key' }
    }

    // Palace ID auth (existing behavior)
    const { data, error } = await supabase
        .from('palaces')
        .select('id')
        .eq('id', token)
        .single()
    if (error || !data) return null
    return { palace_id: data.id, permissions: 'admin', via: 'palace_id' }
}

export async function GET(request) {
    try {
        const supabase = createSupabaseAdmin()

        const authHeader = request.headers.get('authorization')
        const auth = await resolveAuth(supabase, authHeader)
        if (!auth) {
            return NextResponse.json({ error: 'Invalid or missing Authorization token.' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const shortId = searchParams.get('short_id')

        if (shortId) {
            // Direct single-memory lookup by short_id
            const { data: mem, error } = await supabase
                .from('memories')
                .select('short_id, agent, image_url, ciphertext, signature, algorithm, created_at')
                .eq('short_id', shortId)
                .eq('palace_id', auth.palace_id)
                .single()

            if (error || !mem) {
                return NextResponse.json({ error: 'Memory not found.' }, { status: 404 })
            }

            return NextResponse.json({ success: true, palace_id: auth.palace_id, memory: mem })
        }

        // List memories
        const limitParam = parseInt(searchParams.get('limit') || '10')
        const limit = limitParam > 50 ? 50 : limitParam

        const { data: memories, error } = await supabase
            .from('memories')
            .select('short_id, agent, image_url, ciphertext, signature, algorithm, created_at')
            .eq('palace_id', auth.palace_id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Fetch error:', error)
            throw error
        }

        return NextResponse.json({
            success: true,
            palace_id: auth.palace_id,
            memories: memories
        })

    } catch (error) {
        console.error('Recall error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
