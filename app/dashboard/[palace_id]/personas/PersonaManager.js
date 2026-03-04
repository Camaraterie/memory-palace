'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const PERSONA_COLORS = {
  'Backend': '#4a9eff',
  'Frontend': '#ff6b6b',
  'DevOps': '#4ecdc4',
  'Product Manager': '#ffe66d',
  'Metablogger': '#c44dff',
  'QA/Tester': '#6bcb77',
}

function PersonaColorBadge({ name }) {
  const color = PERSONA_COLORS[name] || '#b89668'
  return (
    <div style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 8px ${color}66`,
      flexShrink: 0,
    }} />
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

export default function PersonaManager({ palace, initialPersonas }) {
  const [personas, setPersonas] = useState(initialPersonas)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPersona, setEditingPersona] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    focus_areas: '',
    tone: '',
    avatar_description: '',
    visual_prompt: '',
  })

  const showFeedback = useCallback((message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3000)
  }, [])

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/personas', {
        headers: { 'Authorization': `Bearer ${palace.id}` }
      })
      const data = await res.json()
      if (data.success) {
        setPersonas(data.personas)
      }
    } catch (err) {
      console.error('Failed to fetch personas:', err)
    }
  }, [palace.id])

  const seedPersonas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/personas/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${palace.id}` }
      })
      const data = await res.json()
      if (data.success) {
        showFeedback(data.message)
        await fetchPersonas()
      } else {
        showFeedback(data.error || 'Failed to seed personas', 'error')
      }
    } catch (err) {
      showFeedback(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        name: formData.name,
        role: formData.role,
        focus_areas: formData.focus_areas.split(',').map(s => s.trim()).filter(Boolean),
        tone: formData.tone || null,
        avatar_description: formData.avatar_description || null,
        visual_prompt: formData.visual_prompt || null,
      }

      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${palace.id}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success) {
        showFeedback('Persona created')
        setFormData({ name: '', role: '', focus_areas: '', tone: '', avatar_description: '', visual_prompt: '' })
        setShowCreateForm(false)
        await fetchPersonas()
      } else {
        showFeedback(data.error || 'Failed to create persona', 'error')
      }
    } catch (err) {
      showFeedback(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingPersona) return

    setLoading(true)
    try {
      const body = {
        id: editingPersona.id,
        name: formData.name,
        role: formData.role,
        focus_areas: formData.focus_areas.split(',').map(s => s.trim()).filter(Boolean),
        tone: formData.tone || null,
        avatar_description: formData.avatar_description || null,
        visual_prompt: formData.visual_prompt || null,
      }

      const res = await fetch('/api/personas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${palace.id}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success) {
        showFeedback('Persona updated')
        setEditingPersona(null)
        setFormData({ name: '', role: '', focus_areas: '', tone: '', avatar_description: '', visual_prompt: '' })
        await fetchPersonas()
      } else {
        showFeedback(data.error || 'Failed to update persona', 'error')
      }
    } catch (err) {
      showFeedback(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this persona?')) return

    setLoading(true)
    try {
      const res = await fetch('/api/personas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${palace.id}`,
        },
        body: JSON.stringify({ id, active: false }),
      })

      const data = await res.json()
      if (data.success) {
        showFeedback('Persona deactivated')
        await fetchPersonas()
      } else {
        showFeedback(data.error || 'Failed to deactivate persona', 'error')
      }
    } catch (err) {
      showFeedback(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (persona) => {
    setEditingPersona(persona)
    setFormData({
      name: persona.name,
      role: persona.role,
      focus_areas: persona.focus_areas?.join(', ') || '',
      tone: persona.tone || '',
      avatar_description: persona.avatar_description || '',
      visual_prompt: persona.visual_prompt || '',
    })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingPersona(null)
    setFormData({ name: '', role: '', focus_areas: '', tone: '', avatar_description: '', visual_prompt: '' })
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
                Personas
              </h1>
              <div style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--stone-text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginTop: '0.5rem',
              }}>
                {palace.name || palace.id} &middot; {personas.length} persona{personas.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {personas.length === 0 && (
                <button
                  onClick={seedPersonas}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    border: '1px solid var(--teal)',
                    background: 'rgba(46, 204, 164, 0.1)',
                    color: 'var(--teal)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Seeding...' : 'Seed Defaults'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm)
                  setEditingPersona(null)
                  setFormData({ name: '', role: '', focus_areas: '', tone: '', avatar_description: '', visual_prompt: '' })
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  border: '1px solid var(--brass)',
                  background: 'rgba(184,134,11,0.15)',
                  color: 'var(--brass)',
                  cursor: 'pointer',
                }}
              >
                {showCreateForm ? 'Cancel' : 'New Persona'}
              </button>
            </div>
          </div>
        </header>

        <Feedback message={feedback?.message} type={feedback?.type} />

        {/* Create/Edit Form */}
        {(showCreateForm || editingPersona) && (
          <div className="stone-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '0.875rem',
              fontFamily: 'var(--font-display)',
              color: 'var(--stone-text)',
              marginBottom: '1rem',
            }}>
              {editingPersona ? 'Edit Persona' : 'Create New Persona'}
            </h2>
            <form onSubmit={editingPersona ? handleUpdate : handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Backend"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Role *</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Developer"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Focus Areas (comma-separated)</label>
                <input
                  type="text"
                  value={formData.focus_areas}
                  onChange={e => setFormData({ ...formData, focus_areas: e.target.value })}
                  placeholder="e.g., APIs, Database, Authentication"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Tone</label>
                <input
                  type="text"
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="e.g., Technical, precise, focused on architecture"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Avatar Description</label>
                <input
                  type="text"
                  value={formData.avatar_description}
                  onChange={e => setFormData({ ...formData, avatar_description: e.target.value })}
                  placeholder="e.g., Server rack with glowing lights"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Visual Prompt (for AI-generated memory images)</label>
                <textarea
                  value={formData.visual_prompt}
                  onChange={e => setFormData({ ...formData, visual_prompt: e.target.value })}
                  placeholder="e.g., A focused developer wearing a warm beanie and round glasses, hunched over terminal windows..."
                  style={{
                    ...inputStyle,
                    minHeight: '100px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                  }}
                />
                <div style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--stone-text-dim)',
                  marginTop: '0.35rem',
                }}>
                  Detailed visual description for AI image generation - describes how the agent appears in memory dioramas
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '6px',
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    border: 'none',
                    background: 'var(--brass)',
                    color: '#1a1400',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    fontWeight: 700,
                  }}
                >
                  {loading ? 'Saving...' : (editingPersona ? 'Update' : 'Create')}
                </button>
                {editingPersona && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.625rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      border: '1px solid var(--brass-dim)',
                      background: 'transparent',
                      color: 'var(--stone-text-dim)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Persona List */}
        {personas.length === 0 ? (
          <div className="stone-tablet" style={{
            padding: '4rem',
            textAlign: 'center',
            color: 'var(--stone-text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            border: '1px dashed rgba(184,134,11,0.15)',
          }}>
            <p style={{ marginBottom: '1rem' }}>No personas defined yet.</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--brass-dim)' }}>Click "Seed Defaults" to create the initial personas, or "New Persona" to create a custom one.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {personas.map(persona => (
              <div key={persona.id} className="stone-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                  <PersonaColorBadge name={persona.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      color: 'var(--stone-text)',
                      marginBottom: '0.25rem',
                    }}>
                      {persona.name}
                    </h3>
                    <p style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--stone-text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      {persona.role}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => startEdit(persona)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'none',
                        border: '1px solid rgba(184,134,11,0.15)',
                        borderRadius: '4px',
                        color: 'var(--stone-text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.6rem',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(persona.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'none',
                        border: '1px solid rgba(217,74,74,0.15)',
                        borderRadius: '4px',
                        color: 'var(--accent-red)',
                        cursor: 'pointer',
                        fontSize: '0.6rem',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {persona.focus_areas && persona.focus_areas.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--brass)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Focus Areas
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {persona.focus_areas.map((area, i) => (
                        <span key={i} style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.15rem 0.5rem',
                          background: 'rgba(184,134,11,0.08)',
                          border: '1px solid rgba(184,134,11,0.15)',
                          borderRadius: '4px',
                          color: 'var(--stone-text-dim)',
                        }}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {persona.tone && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--brass)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Voice
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--stone-text-dim)', fontFamily: 'var(--font-display)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {persona.tone}
                    </p>
                  </div>
                )}

                {persona.avatar_description && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--brass)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Avatar
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--stone-text-dim)', fontFamily: 'var(--font-display)' }}>
                      {persona.avatar_description}
                    </p>
                  </div>
                )}

                {persona.visual_prompt && (
                  <div>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Visual Prompt
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--stone-text-dim)', fontFamily: 'var(--font-body)', lineHeight: 1.5, maxHeight: '120px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                      {persona.visual_prompt}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
