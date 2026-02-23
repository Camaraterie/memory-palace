import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request, context) {
    try {
        const params = await context.params
        const shortId = params.id
        const supabase = createSupabaseAdmin()

        const { data: memoryData, error } = await supabase
            .from('memories')
            .select('*')
            .eq('short_id', shortId)
            .single()

        if (error || !memoryData) {
            return new NextResponse('Memory Record Not Found', { status: 404 })
        }

        // Try to parse ciphertext as JSON — if it parses, it's a plaintext payload
        // If it doesn't parse, it's encrypted and needs CLI decryption
        let payload = null
        let encrypted = true
        try {
            payload = JSON.parse(memoryData.ciphertext)
            encrypted = false
        } catch (e) {
            // ciphertext is encrypted — can't serve plaintext
        }

        const response = {
            short_id: shortId,
            agent: memoryData.agent,
            session_name: memoryData.session_name,
            created_at: memoryData.created_at,
            encrypted: encrypted,
            skill: 'https://m.cuer.ai/memory-palace-skill.md',
            install: 'npm i -g mempalace',
            recover: `mempalace recover ${shortId}`,
        }

        if (!encrypted && payload) {
            // Serve the full readable session context
            response.payload = {
                session_name: payload.session_name,
                agent: payload.agent,
                status: payload.status,
                outcome: payload.outcome,
                built: payload.built,
                decisions: payload.decisions,
                next_steps: payload.next_steps,
                files: payload.files,
                blockers: payload.blockers,
                conversation_context: payload.conversation_context,
                repo: payload.repo,
                branch: payload.branch,
            }
        } else {
            // Can't decrypt — give the agent instructions
            response.note = 'This memory is encrypted. Use the CLI to decrypt: mempalace recover ' + shortId
            response.ciphertext = memoryData.ciphertext
            response.signature = memoryData.signature
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
