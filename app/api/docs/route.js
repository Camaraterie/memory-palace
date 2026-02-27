export const dynamic = 'force-dynamic'

const DOCS = {
    "skill": {
        "url": "https://m.cuer.ai/skill",
        "raw": "https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/memory-palace-skill.md",
        "description": "The main Memory Palace skill file."
    },
    "onboard": {
        "url": "https://m.cuer.ai/onboard",
        "raw": "https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/memory-palace-onboard.md",
        "description": "The first-time onboarding guide for agents."
    },
    "faq": {
        "url": "https://m.cuer.ai/api/faq",
        "raw": "https://raw.githubusercontent.com/Camaraterie/memory-palace/master/app/api/faq/route.js",
        "description": "Frequently Asked Questions (Plain Text)."
    },
    "troubleshoot": {
        "url": "https://m.cuer.ai/api/troubleshoot",
        "raw": "https://raw.githubusercontent.com/Camaraterie/memory-palace/master/app/api/troubleshoot/route.js",
        "description": "Troubleshooting guide for common errors."
    },
    "llms": {
        "url": "https://m.cuer.ai/llms.txt",
        "raw": "https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/llms.txt",
        "description": "Brief overview for LLMs."
    },
    "llms_full": {
        "url": "https://m.cuer.ai/llms-full.txt",
        "raw": "https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/llms-full.txt",
        "description": "Full API reference for LLMs."
    }
}

export async function GET() {
    return new Response(JSON.stringify(DOCS, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
        },
    })
}
