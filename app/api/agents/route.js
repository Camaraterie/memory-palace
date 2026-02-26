import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'
import crypto from 'crypto'

function generateGuestKey() {
    return 'gk_' + crypto.randomBytes(16).toString('hex')
}

async function resolvePalaceId(supabase, authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    const token = authHeader.split(' ')[1]
    const { data, error } = await supabase
        .from('palaces')
        .select('id')
        .eq('id', token)
        .single()
    if (error || !data) return null
    return data.id
}

// POST   /api/agents — create a guest key for an agent
// GET    /api/agents — list agents for this palace
// DELETE /api/agents — permanently delete an agent by agent_name (hard delete)

export async function POST(request) {
    const supabase = createSupabaseAdmin()
    const palaceId = await resolvePalaceId(supabase, request.headers.get('authorization'))
    if (!palaceId) {
        return NextResponse.json({ error: 'Invalid Palace API Key.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { agent_name, permissions = 'read' } = body

    if (!agent_name || typeof agent_name !== 'string' || !agent_name.trim()) {
        return NextResponse.json({ error: 'agent_name is required.' }, { status: 400 })
    }

    if (!['read', 'write', 'admin'].includes(permissions)) {
        return NextResponse.json({ error: 'permissions must be read, write, or admin.' }, { status: 400 })
    }

    const trimmedName = agent_name.trim()
    const guest_key = generateGuestKey()

    const { data, error } = await supabase
        .from('agents')
        .insert([{ palace_id: palaceId, agent_name: trimmedName, guest_key, permissions }])
        .select('id, agent_name, guest_key, permissions, active, created_at')
        .single()

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json(
                { error: `Agent '${trimmedName}' already exists. Revoke (delete) it first.` },
                { status: 409 }
            )
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, agent: data }, { status: 201 })
}

export async function GET(request) {
    const supabase = createSupabaseAdmin()
    const palaceId = await resolvePalaceId(supabase, request.headers.get('authorization'))
    if (!palaceId) {
        return NextResponse.json({ error: 'Invalid Palace API Key.' }, { status: 403 })
    }

    const { data, error } = await supabase
        .from('agents')
        .select('id, agent_name, guest_key, permissions, active, created_at')
        .eq('palace_id', palaceId)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, agents: data })
}

export async function DELETE(request) {
    const supabase = createSupabaseAdmin()
    const palaceId = await resolvePalaceId(supabase, request.headers.get('authorization'))
    if (!palaceId) {
        return NextResponse.json({ error: 'Invalid Palace API Key.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { agent_name } = body

    if (!agent_name) {
        return NextResponse.json({ error: 'agent_name is required.' }, { status: 400 })
    }

    // Hard delete — row is gone, name can be immediately reused
    const { data, error } = await supabase
        .from('agents')
        .delete()
        .eq('palace_id', palaceId)
        .eq('agent_name', agent_name)
        .select('id, agent_name')
        .single()

    if (error || !data) {
        return NextResponse.json({ error: `Agent '${agent_name}' not found.` }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: data })
}
