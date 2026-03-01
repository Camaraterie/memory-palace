export const dynamic = 'force-dynamic'

import { TROUBLESHOOT_TEXT } from '../../troubleshoot/content'

export async function GET() {
    return new Response(TROUBLESHOOT_TEXT, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
        },
    })
}
