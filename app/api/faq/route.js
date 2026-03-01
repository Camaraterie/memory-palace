export const dynamic = 'force-dynamic'

import { FAQ_TEXT } from '../../faq/content'

export async function GET() {
    return new Response(FAQ_TEXT, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
        },
    })
}
