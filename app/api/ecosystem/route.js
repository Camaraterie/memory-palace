import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'
import { resolveAuth } from '../../../lib/auth'

// POST /api/ecosystem — create an ecosystem
export async function POST(request) {
    try {
        const supabase = createSupabaseAdmin()
        const body = await request.json()
        const { slug, name, description } = body

        if (!slug || !name) {
            return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
        }

        const auth = await resolveAuth(request)
        if (!auth || !['write', 'admin'].includes(auth.permissions)) {
            return NextResponse.json({ error: 'Unauthorized — write or admin permission required' }, { status: 401 })
        }

        // Determine owner_id: session user or look up palace owner
        let owner_id = null
        if (auth.palace_id) {
            const { data: palace } = await supabase
                .from('palaces')
                .select('owner_id')
                .eq('id', auth.palace_id)
                .single()
            owner_id = palace?.owner_id || null
        }

        const { data, error } = await supabase
            .from('ecosystems')
            .insert({ slug, name, description: description || null, owner_id })
            .select('id, slug')
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: `Ecosystem slug "${slug}" already exists` }, { status: 409 })
            }
            throw error
        }

        return NextResponse.json({ success: true, ...data })
    } catch (error) {
        console.error('ecosystem POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/ecosystem — list ecosystems the caller belongs to
export async function GET(request) {
    try {
        const supabase = createSupabaseAdmin()
        const auth = await resolveAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // If federation key, return the single ecosystem it belongs to
        if (auth.federation) {
            const { data: eco } = await supabase
                .from('ecosystems')
                .select('id, slug, name, description, created_at')
                .eq('id', auth.ecosystem_id)
                .single()

            if (!eco) return NextResponse.json({ success: true, ecosystems: [] })

            const { data: members } = await supabase
                .from('ecosystem_members')
                .select('palace_id')
                .eq('ecosystem_id', eco.id)

            const palaceIds = (members || []).map(m => m.palace_id)
            const { data: palaces } = await supabase
                .from('palaces')
                .select('id, slug, name, description')
                .in('id', palaceIds)

            return NextResponse.json({
                success: true,
                ecosystems: [{ ...eco, palaces: palaces || [] }]
            })
        }

        // For gk_ or session auth, find ecosystems via the caller's palace
        const palace_id = auth.palace_id
        const { data: memberships } = await supabase
            .from('ecosystem_members')
            .select('ecosystem_id')
            .eq('palace_id', palace_id)

        if (!memberships?.length) {
            return NextResponse.json({ success: true, ecosystems: [] })
        }

        const ecoIds = memberships.map(m => m.ecosystem_id)
        const { data: ecosystems } = await supabase
            .from('ecosystems')
            .select('id, slug, name, description, created_at')
            .in('id', ecoIds)

        // Enrich each ecosystem with its member palaces
        const enriched = await Promise.all((ecosystems || []).map(async (eco) => {
            const { data: members } = await supabase
                .from('ecosystem_members')
                .select('palace_id')
                .eq('ecosystem_id', eco.id)

            const palaceIds = (members || []).map(m => m.palace_id)
            const { data: palaces } = await supabase
                .from('palaces')
                .select('id, slug, name, description')
                .in('id', palaceIds)

            return { ...eco, palaces: palaces || [] }
        }))

        return NextResponse.json({ success: true, ecosystems: enriched })
    } catch (error) {
        console.error('ecosystem GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
