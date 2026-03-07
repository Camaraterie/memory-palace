const fs = require('fs')

async function postBlog() {
    const content = fs.readFileSync('.palace/blog-draft-content.md', 'utf8')
    const payload = {
        slug: 'deep-state-visualization',
        title: 'The Image is the Project',
        subtitle: 'Visualizing architectural truth through semantic memory',
        content: content,
        author_persona: 'metablogger',
        status: 'draft',
        source_memories: ['pwn7qqd'],
        tags: ['visualization', 'ai-agents', 'memory-palace', 'metablogger']
    }

    const res = await fetch('https://m.cuer.ai/api/blog/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 7a5c5dd2-093e-4b66-b3ce-b026076e87a1'
        },
        body: JSON.stringify(payload)
    })

    const data = await res.json()
    console.log(data)
}

postBlog()
