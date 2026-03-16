import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'
import { resolveAuth } from '../../../../lib/auth'

// POST /api/ecosystem/members — add a palace to an ecosystem
export async function POST(request) {
    try {
        const supabase = createSupabaseAdmin()
        const body = await request.json()
        const { ecosystem_slug, palace_id } = body

        if (!ecosystem_slug || !palace_id) {
            return NextResponse.json({ error: 'ecosystem_slug and palace_id are required' }, { status: 400 })
        }

        // Auth: caller must own the palace being added, or be session owner of the ecosystem
        const auth = await resolveAuth(request, palace_id)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the caller controls the palace being added
        if (auth.palace_id !== palace_id) {
            return NextResponse.json({ error: 'You can only add palaces you control' }, { status: 403 })
        }

        // Look up the ecosystem
        const { data: eco, error: ecoErr } = await supabase
            .from('ecosystems')
            .select('id')
            .eq('slug', ecosystem_slug)
            .single()

        if (ecoErr || !eco) {
            return NextResponse.json({ error: `Ecosystem "${ecosystem_slug}" not found` }, { status: 404 })
        }

        const { data, error } = await supabase
            .from('ecosystem_members')
            .insert({ ecosystem_id: eco.id, palace_id })
            .select('id, ecosystem_id, palace_id, joined_at')
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Palace is already a member of this ecosystem' }, { status: 409 })
            }
            throw error
        }

        return NextResponse.json({ success: true, member: data })
    } catch (error) {
        console.error('ecosystem members POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/ecosystem/members — remove a palace from an ecosystem
export async function DELETE(request) {
    try {
        const supabase = createSupabaseAdmin()
        const body = await request.json()
        const { ecosystem_slug, palace_id } = body

        if (!ecosystem_slug || !palace_id) {
            return NextResponse.json({ error: 'ecosystem_slug and palace_id are required' }, { status: 400 })
        }

        const auth = await resolveAuth(request, palace_id)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (auth.palace_id !== palace_id) {
            return NextResponse.json({ error: 'You can only remove palaces you control' }, { status: 403 })
        }

        const { data: eco } = await supabase
            .from('ecosystems')
            .select('id')
            .eq('slug', ecosystem_slug)
            .single()

        if (!eco) {
            return NextResponse.json({ error: `Ecosystem "${ecosystem_slug}" not found` }, { status: 404 })
        }

        const { error } = await supabase
            .from('ecosystem_members')
            .delete()
            .eq('ecosystem_id', eco.id)
            .eq('palace_id', palace_id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('ecosystem members DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
