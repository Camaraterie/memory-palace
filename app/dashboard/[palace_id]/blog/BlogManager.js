'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { parseMarkdown, renderBlock } from '../../../../lib/markdown'

const STATUS_COLORS = {
  draft: { bg: 'rgba(217,167,47,0.12)', border: 'rgba(217,167,47,0.3)', text: '#d9a72f' },
  published: { bg: 'rgba(74,157,110,0.12)', border: 'rgba(74,157,110,0.3)', text: '#4a9d6e' },
  rejected: { bg: 'rgba(217,74,74,0.12)', border: 'rgba(217,74,74,0.3)', text: '#d94a4a' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft
  return (
    <span style={{
      fontSize: '0.6rem',
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontWeight: 700,
    }}>
      {status}
    </span>
  )
}

function DevlogBadge() {
  return (
    <span style={{
      fontSize: '0.55rem',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      padding: '0.15rem 0.4rem',
      borderRadius: '3px',
      background: 'rgba(217,167,47,0.12)',
      border: '1px solid rgba(217,167,47,0.3)',
      color: '#d9a72f',
    }}>
      DEVLOG
    </span>
  )
}

function Feedback({ message, type }) {
  if (!message) return null
  const color = type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'
  return (
    <div style={{
      fontSize: '0.75rem',
      fontFamily: 'var(--font-mono)',
      color,
      padding: '0.4rem 0.75rem',
      background: type === 'error' ? 'rgba(217,74,74,0.08)' : 'rgba(74,157,110,0.08)',
      border: `1px solid ${type === 'error' ? 'rgba(217,74,74,0.2)' : 'rgba(74,157,110,0.2)'}`,
      borderRadius: '4px',
      marginTop: '0.5rem',
    }}>
      {message}
    </div>
  )
}

export default function BlogManager({ palace, initialPosts, memories }) {
  const [posts, setPosts] = useState(initialPosts)
  const [filter, setFilter] = useState('all')
  const [expandedSlug, setExpandedSlug] = useState(null)
  const [editData, setEditData] = useState({})
  const [feedback, setFeedback] = useState({})
  const [confirmAction, setConfirmAction] = useState(null)
  const [saving, setSaving] = useState({})
  const [memoryPickerSlug, setMemoryPickerSlug] = useState(null)
  const fileInputRef = useRef(null)

  const memoriesWithImages = (memories || []).filter(m => m.image_url)

  const showFeedback = useCallback((slug, message, type = 'success') => {
    setFeedback(prev => ({ ...prev, [slug]: { message, type } }))
    setTimeout(() => setFeedback(prev => {
      const next = { ...prev }
      delete next[slug]
      return next
    }), 3000)
  }, [])

  const filtered = posts.filter(p => {
    if (filter === 'all') return true
    if (filter === 'drafts') return p.status === 'draft'
    if (filter === 'published') return p.status === 'published'
    if (filter === 'rejected') return p.status === 'rejected'
    return true
  })

  const toggleExpand = (slug) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null)
    } else {
      setExpandedSlug(slug)
      const post = posts.find(p => p.slug === slug)
      if (post && !editData[slug]) {
        setEditData(prev => ({
          ...prev,
          [slug]: {
            title: post.title || '',
            subtitle: post.subtitle || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            tags: (post.tags || []).join(', '),
            author_persona: post.author_persona || 'curator',
            cover_image: post.cover_image || '',
            source_memories: (post.source_memories || []).join(', '),
            show_provenance: post.show_provenance || false,
            audience: post.metadata?.audience || 'all',
          },
        }))
      }
    }
  }

  const updateField = (slug, field, value) => {
    setEditData(prev => ({
      ...prev,
      [slug]: { ...prev[slug], [field]: value },
    }))
  }

  const saveDraft = async (slug) => {
    setSaving(prev => ({ ...prev, [slug]: true }))
    try {
      const data = editData[slug]
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      const sourceMemories = data.source_memories ? data.source_memories.split(',').map(t => t.trim()).filter(Boolean) : []

      const currentPost = posts.find(p => p.slug === slug)

      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          palace_id: palace.id,
          slug,
          title: data.title,
          subtitle: data.subtitle || null,
          content: data.content,
          excerpt: data.excerpt || null,
          author_persona: data.author_persona || 'curator',
          cover_image: data.cover_image || null,
          tags,
          source_memories: sourceMemories,
          show_provenance: data.show_provenance,
          status: 'draft',
          metadata: { ...(currentPost?.metadata || {}), audience: data.audience || 'all' },
        }),
      })

      const result = await res.json()
      if (result.success) {
        setPosts(prev => prev.map(p => p.slug === slug ? result.post : p))
        showFeedback(slug, 'Draft saved')
      } else {
        showFeedback(slug, result.error || 'Save failed', 'error')
      }
    } catch (err) {
      showFeedback(slug, err.message, 'error')
    } finally {
      setSaving(prev => ({ ...prev, [slug]: false }))
    }
  }

  const publishAction = async (slug, action) => {
    setSaving(prev => ({ ...prev, [slug]: true }))
    try {
      const res = await fetch(`/api/blog/posts/${slug}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          palace_id: palace.id,
          action,
          // Carry in-flight audience so publish always persists the current selector value
          ...(editData[slug] ? {
            metadata: {
              ...(posts.find(p => p.slug === slug)?.metadata || {}),
              audience: editData[slug].audience || 'all',
            },
          } : {}),
        }),
      })

      const result = await res.json()
      if (result.success) {
        setPosts(prev => prev.map(p => p.slug === slug ? result.post : p))
        showFeedback(slug, action === 'publish' ? 'Published' : action === 'unpublish' ? 'Unpublished' : 'Rejected')
      } else {
        showFeedback(slug, result.error || `${action} failed`, 'error')
      }
    } catch (err) {
      showFeedback(slug, err.message, 'error')
    } finally {
      setSaving(prev => ({ ...prev, [slug]: false }))
      setConfirmAction(null)
    }
  }

  const handleCoverUpload = async (slug) => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setSaving(prev => ({ ...prev, [slug]: true }))
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('slug', slug)
      formData.append('palace_id', palace.id)

      const res = await fetch('/api/blog/upload-cover', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()
      if (result.success) {
        updateField(slug, 'cover_image', result.image_url)
        setPosts(prev => prev.map(p => p.slug === slug ? { ...p, cover_image: result.image_url } : p))
        showFeedback(slug, 'Cover image uploaded')
      } else {
        showFeedback(slug, result.error || 'Upload failed', 'error')
      }
    } catch (err) {
      showFeedback(slug, err.message, 'error')
    } finally {
      setSaving(prev => ({ ...prev, [slug]: false }))
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAutoGenerateCover = async (slug) => {
    setSaving(prev => ({ ...prev, [slug]: true }))
    showFeedback(slug, 'Generating deep state cover...', 'success')
    try {
      const res = await fetch('/api/palace/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'blog', target_id: slug, palace_id: palace.id }),
      })

      const result = await res.json()
      if (result.success) {
        updateField(slug, 'cover_image', result.image_url)
        setPosts(prev => prev.map(p => p.slug === slug ? { ...p, cover_image: result.image_url } : p))
        showFeedback(slug, 'Deep AI Cover generated successfully!')
      } else {
        showFeedback(slug, result.error || 'Generation failed', 'error')
      }
    } catch (err) {
      showFeedback(slug, err.message, 'error')
    } finally {
      setSaving(prev => ({ ...prev, [slug]: false }))
    }
  }

  const handleTwoClickAction = (slug, action) => {
    if (confirmAction && confirmAction.slug === slug && confirmAction.action === action) {
      publishAction(slug, action)
    } else {
      setConfirmAction({ slug, action })
      setTimeout(() => setConfirmAction(prev => {
        if (prev?.slug === slug && prev?.action === action) return null
        return prev
      }), 4000)
    }
  }

  const handleRevise = (slug) => {
    const data = editData[slug]
    const prompt = `I need help revising this blog post draft. I want to make it an actual compelling blog post, rather than just a dev log. 
Can you act as a writing partner? We should talk conversationally to refine it, focusing on the "WHY" (e.g., why are we building this, what is the purpose), establishing the tone, and incorporating the characters.

Here is the current draft:
---
TITLE: ${data.title}
SUBTITLE: ${data.subtitle || ''}

${data.content}
---

Please start by asking me a few questions about the purpose, audience, and the story we want to tell.`

    navigator.clipboard.writeText(prompt).then(() => {
      showFeedback(slug, 'Revision prompt copied to clipboard!')
    }).catch(err => {
      showFeedback(slug, 'Failed to copy prompt', 'error')
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(26, 24, 20, 0.6)',
    border: '1px solid var(--brass-dim)',
    borderRadius: '6px',
    color: 'var(--stone-text)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    outline: 'none',
  }

  const labelStyle = {
    fontSize: '0.625rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--brass)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '0.35rem',
    display: 'block',
  }

  const btnBase = {
    padding: '0.4rem 1rem',
    borderRadius: '100px',
    fontSize: '0.625rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  }

  return (
    <div className="stone-surface" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(184,134,11,0.15)', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <Link href="/dashboard" style={{
                  color: 'var(--stone-text-dim)',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Palaces
                </Link>
                <Link href={`/dashboard/${palace.id}`} style={{
                  color: 'var(--stone-text-dim)',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Memories
                </Link>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 300,
                color: 'var(--stone-text)',
                letterSpacing: '-0.01em',
              }}>
                Blog Manager
              </h1>
              <div style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--stone-text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginTop: '0.5rem',
              }}>
                {palace.name || palace.id} &middot; {posts.length} post{posts.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Filter chips */}
            <div style={{
              display: 'flex',
              background: 'rgba(58,54,50,0.6)',
              padding: '0.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(184,134,11,0.12)',
            }}>
              {['all', 'drafts', 'published', 'rejected'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ...(filter === f ? {
                      background: 'var(--brass)',
                      color: '#1a1400',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(184,134,11,0.2)',
                    } : {
                      background: 'transparent',
                      color: 'var(--stone-text-dim)',
                    }),
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Post list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.length === 0 && (
            <div className="stone-tablet" style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--stone-text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              border: '1px dashed rgba(184,134,11,0.15)',
            }}>
              No {filter === 'all' ? '' : filter} posts found.
            </div>
          )}

          {filtered.map(post => {
            const isExpanded = expandedSlug === post.slug
            const data = editData[post.slug] || {}
            const fb = feedback[post.slug]
            const isSaving = saving[post.slug]
            const previewBlocks = data.content ? parseMarkdown(data.content) : []

            return (
              <div key={post.slug} className="stone-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card header — click to expand */}
                <div
                  onClick={() => toggleExpand(post.slug)}
                  style={{
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <StatusBadge status={post.status} />
                      {post.metadata?.audience === 'technical' && <DevlogBadge />}
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.1rem',
                        color: 'var(--stone-text)',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {post.title}
                      </h3>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      {post.subtitle && (
                        <span style={{
                          fontSize: '0.8rem',
                          color: 'var(--stone-text-dim)',
                          fontFamily: 'var(--font-display)',
                        }}>
                          {post.subtitle}
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.625rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--brass)',
                        textTransform: 'uppercase',
                      }}>
                        {post.author_persona || 'curator'}
                      </span>
                      {post.tags?.length > 0 && (
                        <span style={{
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--stone-text-dim)',
                        }}>
                          {post.tags.join(', ')}
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--stone-text-dim)',
                      }}>
                        {new Date(post.updated_at || post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <svg
                    width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{
                      color: 'var(--stone-text-dim)',
                      flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded edit panel */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid rgba(184,134,11,0.1)',
                    padding: '1.5rem',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2rem',
                    }}>
                      {/* Left column — form */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={labelStyle}>Title</label>
                          <input
                            type="text"
                            value={data.title || ''}
                            onChange={e => updateField(post.slug, 'title', e.target.value)}
                            style={inputStyle}
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>Subtitle</label>
                          <input
                            type="text"
                            value={data.subtitle || ''}
                            onChange={e => updateField(post.slug, 'subtitle', e.target.value)}
                            style={inputStyle}
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>Content (Markdown)</label>
                          <textarea
                            value={data.content || ''}
                            onChange={e => updateField(post.slug, 'content', e.target.value)}
                            style={{
                              ...inputStyle,
                              height: '400px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              lineHeight: 1.6,
                              resize: 'vertical',
                            }}
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>Excerpt</label>
                          <textarea
                            value={data.excerpt || ''}
                            onChange={e => updateField(post.slug, 'excerpt', e.target.value)}
                            style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={labelStyle}>Tags (comma-separated)</label>
                            <input
                              type="text"
                              value={data.tags || ''}
                              onChange={e => updateField(post.slug, 'tags', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Author Persona</label>
                            <input
                              type="text"
                              value={data.author_persona || ''}
                              onChange={e => updateField(post.slug, 'author_persona', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Audience</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                              { value: 'all', label: '🌍 All audiences' },
                              { value: 'technical', label: '⚙ Technical / devlog' },
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                onClick={() => updateField(post.slug, 'audience', value)}
                                style={{
                                  ...btnBase,
                                  ...(data.audience === value ? {
                                    background: value === 'all'
                                      ? 'rgba(184,134,11,0.25)'
                                      : 'rgba(74,127,157,0.25)',
                                    color: value === 'all' ? 'var(--brass)' : '#4a9d8e',
                                    border: `1px solid ${value === 'all' ? 'rgba(184,134,11,0.4)' : 'rgba(74,157,157,0.4)'}`,
                                  } : {
                                    background: 'transparent',
                                    color: 'var(--stone-text-dim)',
                                    border: '1px solid rgba(184,134,11,0.15)',
                                  }),
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <p style={{
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--stone-text-dim)',
                            marginTop: '0.35rem',
                            fontStyle: 'italic',
                          }}>
                            Technical posts are hidden from the human view of the blog
                          </p>
                        </div>

                        <div>
                          <label style={labelStyle}>Cover Image</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={data.cover_image || ''}
                              onChange={e => updateField(post.slug, 'cover_image', e.target.value)}
                              placeholder="URL or upload"
                              style={{ ...inputStyle, flex: 1 }}
                            />
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={() => handleCoverUpload(post.slug)}
                              style={{ display: 'none' }}
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSaving}
                              style={{
                                ...btnBase,
                                background: 'transparent',
                                border: '1px solid var(--brass-dim)',
                                color: 'var(--stone-text-dim)',
                                flexShrink: 0,
                              }}
                            >
                              Upload
                            </button>
                            {memoriesWithImages.length > 0 && (
                              <button
                                onClick={() => setMemoryPickerSlug(post.slug)}
                                disabled={isSaving}
                                style={{
                                  ...btnBase,
                                  background: 'rgba(184,134,11,0.1)',
                                  border: '1px solid var(--brass-dim)',
                                  color: 'var(--brass)',
                                  flexShrink: 0,
                                }}
                              >
                                Memories
                              </button>
                            )}
                            <button
                              onClick={() => handleAutoGenerateCover(post.slug)}
                              disabled={isSaving}
                              style={{
                                ...btnBase,
                                background: 'linear-gradient(135deg, rgba(74,157,110,0.15) 0%, rgba(74,127,217,0.15) 100%)',
                                border: '1px solid rgba(74,157,110,0.3)',
                                color: '#4a9d6e',
                                flexShrink: 0,
                              }}
                            >
                              ✨ Deep AI Cover
                            </button>
                          </div>
                          {data.cover_image && (
                            <div style={{
                              marginTop: '0.5rem',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid rgba(184,134,11,0.1)',
                              background: 'var(--stone-dark)',
                            }}>
                              <img src={data.cover_image} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={labelStyle}>Source Memories (comma-separated short_ids)</label>
                          <input
                            type="text"
                            value={data.source_memories || ''}
                            onChange={e => updateField(post.slug, 'source_memories', e.target.value)}
                            style={inputStyle}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            id={`prov-${post.slug}`}
                            checked={data.show_provenance || false}
                            onChange={e => updateField(post.slug, 'show_provenance', e.target.checked)}
                            style={{ accentColor: 'var(--brass)' }}
                          />
                          <label htmlFor={`prov-${post.slug}`} style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--stone-text-dim)',
                          }}>
                            Show provenance (source memory links)
                          </label>
                        </div>
                      </div>

                      {/* Right column — preview */}
                      <div style={{
                        background: 'rgba(26, 24, 20, 0.4)',
                        border: '1px solid rgba(184,134,11,0.08)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        overflowY: 'auto',
                        maxHeight: '800px',
                      }}>
                        <div style={{
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--brass-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.2em',
                          marginBottom: '1rem',
                        }}>
                          Preview
                        </div>

                        {data.cover_image && (
                          <div style={{
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '1rem',
                            background: 'var(--stone-dark)',
                          }}>
                            <img src={data.cover_image} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                          </div>
                        )}

                        {data.title && (
                          <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: 'var(--stone-text)',
                            marginBottom: '0.25rem',
                          }}>
                            {data.title}
                          </h2>
                        )}

                        {data.subtitle && (
                          <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.95rem',
                            color: 'var(--stone-text-dim)',
                            marginBottom: '1rem',
                          }}>
                            {data.subtitle}
                          </p>
                        )}

                        <div>
                          {previewBlocks.map((block, idx) => renderBlock(block, idx))}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(184,134,11,0.1)',
                      flexWrap: 'wrap',
                    }}>
                      <button
                        onClick={() => saveDraft(post.slug)}
                        disabled={isSaving}
                        style={{
                          ...btnBase,
                          background: 'rgba(184,134,11,0.15)',
                          color: 'var(--brass)',
                          opacity: isSaving ? 0.5 : 1,
                        }}
                      >
                        {isSaving ? 'Saving...' : 'Save Draft'}
                      </button>

                      <button
                        onClick={() => handleRevise(post.slug)}
                        disabled={isSaving}
                        style={{
                          ...btnBase,
                          background: 'rgba(74,127,217,0.15)',
                          color: 'var(--teal)',
                          border: '1px solid rgba(74,127,217,0.3)',
                          opacity: isSaving ? 0.5 : 1,
                        }}
                      >
                        Revise with Agent
                      </button>

                      <button
                        onClick={() => handleTwoClickAction(post.slug, 'publish')}
                        disabled={isSaving}
                        style={{
                          ...btnBase,
                          background: confirmAction?.slug === post.slug && confirmAction?.action === 'publish'
                            ? '#4a9d6e' : 'rgba(74,157,110,0.15)',
                          color: confirmAction?.slug === post.slug && confirmAction?.action === 'publish'
                            ? '#fff' : '#4a9d6e',
                          opacity: isSaving ? 0.5 : 1,
                        }}
                      >
                        {confirmAction?.slug === post.slug && confirmAction?.action === 'publish'
                          ? 'Confirm Publish?' : 'Publish'}
                      </button>

                      {post.status === 'published' && (
                        <button
                          onClick={() => handleTwoClickAction(post.slug, 'unpublish')}
                          disabled={isSaving}
                          style={{
                            ...btnBase,
                            background: 'transparent',
                            border: '1px solid var(--brass-dim)',
                            color: 'var(--stone-text-dim)',
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          {confirmAction?.slug === post.slug && confirmAction?.action === 'unpublish'
                            ? 'Confirm Unpublish?' : 'Unpublish'}
                        </button>
                      )}

                      {post.status !== 'rejected' && (
                        <button
                          onClick={() => handleTwoClickAction(post.slug, 'reject')}
                          disabled={isSaving}
                          style={{
                            ...btnBase,
                            background: confirmAction?.slug === post.slug && confirmAction?.action === 'reject'
                              ? '#d94a4a' : 'transparent',
                            border: `1px solid ${confirmAction?.slug === post.slug && confirmAction?.action === 'reject'
                              ? '#d94a4a' : 'rgba(217,74,74,0.2)'}`,
                            color: confirmAction?.slug === post.slug && confirmAction?.action === 'reject'
                              ? '#fff' : 'var(--accent-red)',
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          {confirmAction?.slug === post.slug && confirmAction?.action === 'reject'
                            ? 'Confirm Reject?' : 'Reject'}
                        </button>
                      )}

                      <a
                        href={`/blog/${post.slug}${post.status !== 'published' ? '?preview=true' : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...btnBase,
                          background: 'transparent',
                          border: '1px solid rgba(184,134,11,0.15)',
                          color: 'var(--stone-text-dim)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Preview
                      </a>

                      <Feedback message={fb?.message} type={fb?.type} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Memory Image Picker Modal */}
      {memoryPickerSlug && (
        <div
          onClick={() => setMemoryPickerSlug(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(42,39,36,0.95)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="brass-frame-strong"
            style={{
              width: '100%',
              maxWidth: '64rem',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--brass-dim)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--brass)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3em',
                }}>
                  Select Cover Image
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--stone-text-dim)',
                  marginTop: '0.25rem',
                }}>
                  Choose a memory image to use as the blog post cover
                </div>
              </div>
              <button
                onClick={() => setMemoryPickerSlug(null)}
                style={{
                  padding: '0.5rem',
                  color: 'var(--stone-text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              alignContent: 'start',
            }}>
              {memoriesWithImages.map(memory => (
                <div
                  key={memory.short_id}
                  onClick={() => {
                    updateField(memoryPickerSlug, 'cover_image', memory.image_url)
                    setPosts(prev => prev.map(p =>
                      p.slug === memoryPickerSlug ? { ...p, cover_image: memory.image_url } : p
                    ))
                    showFeedback(memoryPickerSlug, 'Cover image set from memory')
                    setMemoryPickerSlug(null)
                  }}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(184,134,11,0.15)',
                    transition: 'all 0.2s',
                    background: 'var(--stone-dark)',
                  }}
                >
                  <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={memory.image_url}
                      alt={memory.session_name || memory.short_id}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--brass)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '0.2rem',
                    }}>
                      {memory.short_id} &middot; {memory.agent}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--stone-text)',
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {memory.session_name || 'Untitled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
