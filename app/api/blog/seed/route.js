import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '../../../../lib/supabase'

// POST /api/blog/seed — seed the inaugural blog post (auth required)
export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin()

    // Require palace_id auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let palaceId = null

    if (token.startsWith('gk_')) {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('palace_id, permissions, active')
        .eq('guest_key', token)
        .single()
      if (error || !agent || !agent.active || !['write', 'admin'].includes(agent.permissions)) {
        return NextResponse.json({ error: 'Invalid or insufficient permissions' }, { status: 403 })
      }
      palaceId = agent.palace_id
    } else {
      const { data: palace, error } = await supabase
        .from('palaces')
        .select('id')
        .eq('id', token)
        .single()
      if (error || !palace) {
        return NextResponse.json({ error: 'Invalid palace_id' }, { status: 403 })
      }
      palaceId = palace.id
    }

    const now = new Date().toISOString()
    const post = {
      palace_id: palaceId,
      slug: 'memory-palace-launch',
      title: 'Memory Palace: Infrastructure for AI Recall',
      subtitle: 'Why we built a visual memory system for agents, and what comes next.',
      author_persona: 'curator',
      status: 'published',
      published_at: now,
      updated_at: now,
      tags: ['launch', 'vision', 'agents'],
      show_provenance: false,
      source_memories: [],
      social_variants: {
        twitter: 'We built Memory Palace \u2014 a visual memory system for AI agents.\n\nAfter each work session, agents encode what happened into a generated image. Future sessions load these images to restore context.\n\nIt works across Claude, Gemini, Codex, and any multimodal agent.\n\nhttps://m.cuer.ai',
        linkedin: 'Announcing Memory Palace \u2014 infrastructure for AI recall.\n\nThe problem: AI agents lose all context between sessions. Every new conversation starts from zero.\n\nOur approach: agents summarize each session into a generated image \u2014 a comic-strip panel with whiteboard text, character scenes, and an embedded QR code. Future agents read these images to restore project context at ~1,000 tokens per image.\n\nThe system is agent-agnostic (Claude, Gemini, Codex, ChatGPT), open, and composable.\n\nLearn more: https://m.cuer.ai'
      },
      metadata: {},
      excerpt: 'AI agents lose all context between sessions. Memory Palace fixes this by encoding session summaries into generated images that any multimodal agent can read.',
      content: `Every AI agent has the same problem: when the conversation ends, everything it learned disappears. The next session starts from zero. No matter how productive the work was, context evaporates.

Memory Palace is our answer to this. It is infrastructure for AI recall \u2014 a system that lets agents encode what happened into generated images, store them with cryptographic integrity, and load them back in future sessions.

## How it works

After each work session, the agent summarizes what it built, what decisions it made, and what comes next. This summary gets encoded into a **comic-strip panel image** \u2014 a multi-panel grid showing the agent\u2019s robot character at their workstation, whiteboard text with structured session data, artifact close-ups, and an embedded QR code linking back to the full context.

When a future session begins, the agent loads these images. Multimodal models extract the whiteboard text with near-perfect accuracy, giving the agent immediate orientation on project status \u2014 what was built, by whom, and what to do next.

Each image costs roughly 1,000 tokens of context, yet encodes far more information than 1,000 tokens of text could carry. The visual format is dense, portable, and works across any multimodal agent.

## Agent-agnostic by design

Memory Palace works with Claude Code, Gemini CLI, Codex, ChatGPT, OpenClaw, and any agent that can read images and make HTTP requests. Each agent gets a **robot character** \u2014 a distinctive visual identity that appears consistently across memory images. FORGE (Claude) has a navy-blue industrial frame. FLUX (Gemini) has an emerald crystalline chassis. ATLAS (Codex) is a wheeled surveying station.

These characters are not cosmetic. They solve a real problem: when multiple agents contribute to the same project, you need to know *who* did *what*. The robot characters make this instantly readable in any memory image.

## The lossless layer

Memory images are impressionistic by nature \u2014 they give you the gist, like human visual recall. But every image also contains an embedded QR code linking to the exact, uncompressed session data on CueR.ai. Scan the QR code and you get the full payload: every file path, every decision, every next step, with zero information loss.

This three-tier system \u2014 visual analysis, structured state JSON, and QR-linked lossless data \u2014 means agents can orient quickly from images alone, then drill into full detail when they need it.

## What comes next

We are building a **persona system** \u2014 named authorial voices that give the blog and memory system distinct perspectives. The curator persona writes architectural overviews. Other personas might focus on debugging stories, API changelogs, or tutorial content.

We are also building **meta-blogging** \u2014 agents that read their own memory images, synthesize patterns across sessions, and produce blog posts about what they have learned. The blog becomes a byproduct of the memory system itself.

Memory Palace is free and open. The skill file at \`m.cuer.ai/memory-palace-skill.md\` is everything an agent needs to get started. Give it to any AI agent and say \`/store\`.

---

*Memory Palace is built by the Camaraterie collective. The source is at github.com/Camaraterie/memory-palace.*`
    }

    // Upsert
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', post.slug)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('blog_posts')
        .update(post)
        .eq('id', existing.id)
      if (error) throw error
      return NextResponse.json({ success: true, action: 'updated', slug: post.slug })
    } else {
      const { error } = await supabase
        .from('blog_posts')
        .insert(post)
      if (error) throw error
      return NextResponse.json({ success: true, action: 'created', slug: post.slug })
    }
  } catch (error) {
    console.error('Blog seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
