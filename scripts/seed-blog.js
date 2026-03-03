// Seed the inaugural blog post
// Run: node scripts/seed-blog.js
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const inauguralPost = {
  slug: 'memory-palace-launch',
  title: 'Memory Palace: Infrastructure for AI Recall',
  subtitle: 'Why we built a visual memory system for agents, and what comes next.',
  author_persona: 'curator',
  status: 'published',
  published_at: new Date().toISOString(),
  tags: ['launch', 'vision', 'agents'],
  show_provenance: false,
  source_memories: [],
  social_variants: {
    twitter: 'We built Memory Palace — a visual memory system for AI agents.\n\nAfter each work session, agents encode what happened into a generated image. Future sessions load these images to restore context.\n\nIt works across Claude, Gemini, Codex, and any multimodal agent.\n\nhttps://m.cuer.ai',
    linkedin: 'Announcing Memory Palace — infrastructure for AI recall.\n\nThe problem: AI agents lose all context between sessions. Every new conversation starts from zero.\n\nOur approach: agents summarize each session into a generated image — a comic-strip panel with whiteboard text, character scenes, and an embedded QR code. Future agents read these images to restore project context at ~1,000 tokens per image.\n\nThe system is agent-agnostic (Claude, Gemini, Codex, ChatGPT), open, and composable.\n\nLearn more: https://m.cuer.ai'
  },
  metadata: {},
  excerpt: 'AI agents lose all context between sessions. Memory Palace fixes this by encoding session summaries into generated images that any multimodal agent can read.',
  content: `Every AI agent has the same problem: when the conversation ends, everything it learned disappears. The next session starts from zero. No matter how productive the work was, context evaporates.

Memory Palace is our answer to this. It is infrastructure for AI recall — a system that lets agents encode what happened into generated images, store them with cryptographic integrity, and load them back in future sessions.

## How it works

After each work session, the agent summarizes what it built, what decisions it made, and what comes next. This summary gets encoded into a **comic-strip panel image** — a multi-panel grid showing the agent's robot character at their workstation, whiteboard text with structured session data, artifact close-ups, and an embedded QR code linking back to the full context.

When a future session begins, the agent loads these images. Multimodal models extract the whiteboard text with near-perfect accuracy, giving the agent immediate orientation on project status — what was built, by whom, and what to do next.

Each image costs roughly 1,000 tokens of context, yet encodes far more information than 1,000 tokens of text could carry. The visual format is dense, portable, and works across any multimodal agent.

## Agent-agnostic by design

Memory Palace works with Claude Code, Gemini CLI, Codex, ChatGPT, OpenClaw, and any agent that can read images and make HTTP requests. Each agent gets a **robot character** — a distinctive visual identity that appears consistently across memory images. FORGE (Claude) has a navy-blue industrial frame. FLUX (Gemini) has an emerald crystalline chassis. ATLAS (Codex) is a wheeled surveying station.

These characters are not cosmetic. They solve a real problem: when multiple agents contribute to the same project, you need to know *who* did *what*. The robot characters make this instantly readable in any memory image.

## The lossless layer

Memory images are impressionistic by nature — they give you the gist, like human visual recall. But every image also contains an embedded QR code linking to the exact, uncompressed session data on CueR.ai. Scan the QR code and you get the full payload: every file path, every decision, every next step, with zero information loss.

This three-tier system — visual analysis, structured state JSON, and QR-linked lossless data — means agents can orient quickly from images alone, then drill into full detail when they need it.

## What comes next

We are building a **persona system** — named authorial voices that give the blog and memory system distinct perspectives. The curator persona writes architectural overviews. Other personas might focus on debugging stories, API changelogs, or tutorial content.

We are also building **meta-blogging** — agents that read their own memory images, synthesize patterns across sessions, and produce blog posts about what they have learned. The blog becomes a byproduct of the memory system itself.

Memory Palace is free and open. The skill file at \`m.cuer.ai/memory-palace-skill.md\` is everything an agent needs to get started. Give it to any AI agent and say \`/store\`.

---

*Memory Palace is built by the Camaraterie collective. The source is at github.com/Camaraterie/memory-palace.*`
}

async function seed() {
  // Check if post already exists
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', inauguralPost.slug)
    .single()

  if (existing) {
    console.log('Inaugural post already exists, updating...')
    const { error } = await supabase
      .from('blog_posts')
      .update(inauguralPost)
      .eq('id', existing.id)
    if (error) {
      console.error('Update error:', error)
      process.exit(1)
    }
    console.log('Updated.')
  } else {
    console.log('Creating inaugural post...')
    const { error } = await supabase
      .from('blog_posts')
      .insert(inauguralPost)
    if (error) {
      console.error('Insert error:', error)
      process.exit(1)
    }
    console.log('Created.')
  }

  console.log('Done! Visit /blog to see the post.')
}

seed()
