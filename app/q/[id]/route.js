import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request, context) {
    try {
        const params = await context.params
        const shortId = params.id
        const supabase = createSupabaseAdmin()

        const { data: memoryData, error } = await supabase
            .from('memories')
            .select('short_id, agent, created_at, ciphertext')
            .eq('short_id', shortId)
            .single()

        if (error || !memoryData) {
            return new NextResponse('Memory Record Not Found', { status: 404 })
        }

        // Determine if encrypted without leaking the ciphertext
        let encrypted = true
        try {
            JSON.parse(memoryData.ciphertext)
            encrypted = false
        } catch (e) {
            // encrypted
        }

        const response = {
            short_id: shortId,
            agent: memoryData.agent,

            created_at: memoryData.created_at,
            encrypted: encrypted,
            skill: 'https://m.cuer.ai/memory-palace-skill.md',
            install: 'npm i -g mempalace',
            recover: `mempalace recover ${shortId}`,
        }

        if (encrypted) {
            response.note = 'This memory is encrypted. Use the CLI to decrypt: mempalace recover ' + shortId
        }

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, max-age=3600',
                'X-LLM-Skill': 'https://m.cuer.ai/memory-palace-skill.md',
                'X-LLM-Hint': 'This is a Memory Palace record. Install: npm i -g mempalace. Recover: mempalace recover ' + shortId,
            },
        })
    } catch (error) {
        return new NextResponse(error.message, { status: 500 })
    }
}
