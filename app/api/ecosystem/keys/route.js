import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseAdmin } from '../../../../lib/supabase'
import { resolveAuth } from '../../../../lib/auth'

function sha256(input) {
    return crypto.createHash('sha256').update(input).digest('hex')
}

// Verify caller owns a palace that is a member of the ecosystem
async function verifyEcosystemAccess(supabase, auth, ecosystemSlug) {
    if (!auth) return null

    const { data: eco } = await supabase
        .from('ecosystems')
        .select('id')
        .eq('slug', ecosystemSlug)
        .single()

    if (!eco) return null

    // For federation keys, check ecosystem matches
    if (auth.federation) {
        return auth.ecosystem_id === eco.id ? eco : null
    }

    // For gk_ or session auth, check palace membership
    const { data: member } = await supabase
        .from('ecosystem_members')
        .select('id')
        .eq('ecosystem_id', eco.id)
        .eq('palace_id', auth.palace_id)
        .single()

    return member ? eco : null
}

// POST /api/ecosystem/keys — create a federation key
export async function POST(request) {
    try {
        const supabase = createSupabaseAdmin()
        const body = await request.json()
        const { ecosystem_slug, agent_name } = body

        if (!ecosystem_slug || !agent_name) {
            return NextResponse.json({ error: 'ecosystem_slug and agent_name are required' }, { status: 400 })
        }

        const auth = await resolveAuth(request)
        if (!auth || !['admin'].includes(auth.permissions)) {
            return NextResponse.json({ error: 'Unauthorized — admin permission required' }, { status: 401 })
        }

        const eco = await verifyEcosystemAccess(supabase, auth, ecosystem_slug)
        if (!eco) {
            return NextResponse.json({ error: 'Ecosystem not found or you are not a member' }, { status: 403 })
        }

        // Generate fk_ key: fk_ + 16 random hex bytes
        const rawKey = `fk_${crypto.randomBytes(16).toString('hex')}`
        const keyHash = sha256(rawKey)

        const { error } = await supabase
            .from('federation_keys')
            .insert({
                ecosystem_id: eco.id,
                key_hash: keyHash,
                agent_name,
                active: true,
            })

        if (error) throw error

        return NextResponse.json({
            success: true,
            federation_key: rawKey,
            agent_name,
            ecosystem_slug,
            note: 'Store this key securely. It will not be shown again.',
        })
    } catch (error) {
        console.error('ecosystem keys POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/ecosystem/keys — list federation keys (metadata only)
export async function GET(request) {
    try {
        const supabase = createSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const ecosystem_slug = searchParams.get('ecosystem_slug')

        if (!ecosystem_slug) {
            return NextResponse.json({ error: 'ecosystem_slug query param required' }, { status: 400 })
        }

        const auth = await resolveAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const eco = await verifyEcosystemAccess(supabase, auth, ecosystem_slug)
        if (!eco) {
            return NextResponse.json({ error: 'Ecosystem not found or you are not a member' }, { status: 403 })
        }

        const { data: keys, error } = await supabase
            .from('federation_keys')
            .select('agent_name, active, created_at')
            .eq('ecosystem_id', eco.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, keys: keys || [] })
    } catch (error) {
        console.error('ecosystem keys GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/ecosystem/keys — revoke a federation key by agent_name
export async function DELETE(request) {
    try {
        const supabase = createSupabaseAdmin()
        const body = await request.json()
        const { ecosystem_slug, agent_name } = body

        if (!ecosystem_slug || !agent_name) {
            return NextResponse.json({ error: 'ecosystem_slug and agent_name are required' }, { status: 400 })
        }

        const auth = await resolveAuth(request)
        if (!auth || !['admin'].includes(auth.permissions)) {
            return NextResponse.json({ error: 'Unauthorized — admin permission required' }, { status: 401 })
        }

        const eco = await verifyEcosystemAccess(supabase, auth, ecosystem_slug)
        if (!eco) {
            return NextResponse.json({ error: 'Ecosystem not found or you are not a member' }, { status: 403 })
        }

        const { error } = await supabase
            .from('federation_keys')
            .update({ active: false })
            .eq('ecosystem_id', eco.id)
            .eq('agent_name', agent_name)

        if (error) throw error

        return NextResponse.json({ success: true, revoked: agent_name })
    } catch (error) {
        console.error('ecosystem keys DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
