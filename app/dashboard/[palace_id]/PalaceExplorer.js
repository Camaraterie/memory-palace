'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function PalaceExplorer({ palace, initialMemories }) {
    const [view, setView] = useState('gallery') // gallery, timeline, state
    const [selectedMemory, setSelectedMemory] = useState(null)
    const [palaceData, setPalaceData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterAgent, setFilterAgent] = useState('')
    const [filterPersona, setFilterPersona] = useState('')
    const [isVisualizing, setIsVisualizing] = useState(false)
    const [palaceVisual, setPalaceVisual] = useState(null)

    const handleVisualizePalace = async () => {
        setIsVisualizing(true)
        try {
            const res = await fetch('/api/palace/visualize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scope: 'full', palace_id: palace.id }),
            })
            const data = await res.json()
            if (data.success) {
                setPalaceVisual(data.image_url)
            } else {
                alert(data.error || 'Visualization failed')
            }
        } catch (err) {
            console.error(err)
            alert('Visualization failed')
        } finally {
            setIsVisualizing(false)
        }
    }

    useEffect(() => {
        const fetchPalaceData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/palace?palace_id=${palace.id}`)
                const data = await res.json()
                if (data.success) {
                    setPalaceData(data)
                }
            } catch (err) {
                console.error('Failed to fetch palace data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchPalaceData()
    }, [palace.id])

    // Merge initial server-side memories with live API data if available
    // Fix: Only override with live data if it actually contains memories.
    // If the live fetch fails or returns empty (e.g. pending DB migrations), fallback to initialMemories.
    const allMemories = (palaceData?.chain?.length > 0 ? palaceData.chain : null) || initialMemories?.map(m => ({
        short_id: m.short_id,
        agent: m.agent,
        summary: m.session_name,
        created_at: m.created_at,
        image_url: m.image_url,
        personas: m.personas || null,
        room: m.status
    }))

    // Get unique agents for filter chips
    const uniqueAgents = [...new Set((allMemories || []).map(m => m.agent).filter(Boolean))]

    // Get unique personas for filter chips
    const uniquePersonas = [...new Set((allMemories || []).flatMap(m => m.personas || []).filter(Boolean))]

    // Apply filters
    const memories = (allMemories || []).filter(m => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            const matchSummary = (m.summary || '').toLowerCase().includes(q)
            const matchAgent = (m.agent || '').toLowerCase().includes(q)
            const matchRoom = (m.room || '').toLowerCase().includes(q)
            if (!matchSummary && !matchAgent && !matchRoom) return false
        }
        if (filterAgent && m.agent !== filterAgent) return false
        if (filterPersona && (!m.personas || !m.personas.includes(filterPersona))) return false
        return true
    })

    const sectionHeader = (title) => (
        <h2 style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--brass)',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        }}>
            {title}
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(184,134,11,0.3), transparent)' }}></span>
        </h2>
    )

    return (
        <div className="stone-surface" style={{ minHeight: '100vh' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Header */}
                <header style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(184,134,11,0.15)', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
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
                                <Link href={`/dashboard/${palace.id}/personas`} style={{
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Personas
                                </Link>
                                <Link href={`/dashboard/${palace.id}/blog`} style={{
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                                    </svg>
                                    Blog
                                </Link>
                            </div>
                            <h1 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'clamp(2rem, 5vw, 3rem)',
                                fontWeight: 300,
                                color: 'var(--stone-text)',
                                marginBottom: '0.5rem',
                                letterSpacing: '-0.01em',
                            }}>
                                {palace.name || 'Unnamed Palace'}
                            </h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
                                <span style={{
                                    fontSize: '0.625rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--stone-text-dim)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    padding: '0.25rem 0.5rem',
                                    background: 'rgba(58,54,50,0.6)',
                                    border: '1px solid rgba(184,134,11,0.12)',
                                    borderRadius: '4px',
                                }}>
                                    ID: {palace.id}
                                </span>
                                {palaceData?.repo && (
                                    <a href={palaceData.repo} target="_blank" rel="noopener noreferrer" style={{
                                        fontSize: '0.625rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--teal)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.15em',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                    }}>
                                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                        Source Repository
                                    </a>
                                )}
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            background: 'rgba(58,54,50,0.6)',
                            padding: '0.25rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(184,134,11,0.12)',
                        }}>
                            {['gallery', 'timeline', 'state'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
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
                                        ...(view === v ? {
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
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    {(view === 'gallery' || view === 'timeline') && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search memories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(26, 24, 20, 0.6)',
                                    border: '1px solid var(--brass-dim)',
                                    borderRadius: '6px',
                                    color: 'var(--stone-text)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    minWidth: 200,
                                }}
                            />
                            {uniqueAgents.map(agent => (
                                <button
                                    key={agent}
                                    onClick={() => setFilterAgent(filterAgent === agent ? '' : agent)}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '100px',
                                        fontSize: '0.625rem',
                                        fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid',
                                        ...(filterAgent === agent ? {
                                            background: 'rgba(184,134,11,0.15)',
                                            borderColor: 'var(--brass)',
                                            color: 'var(--brass)',
                                        } : {
                                            background: 'transparent',
                                            borderColor: 'rgba(184,134,11,0.2)',
                                            color: 'var(--stone-text-dim)',
                                        }),
                                    }}
                                >
                                    {agent}
                                </button>
                            ))}
                            {uniquePersonas.map(persona => (
                                <button
                                    key={persona}
                                    onClick={() => setFilterPersona(filterPersona === persona ? '' : persona)}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '100px',
                                        fontSize: '0.625rem',
                                        fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid',
                                        ...(filterPersona === persona ? {
                                            background: 'rgba(74,127,217,0.15)',
                                            borderColor: 'var(--teal)',
                                            color: 'var(--teal)',
                                        } : {
                                            background: 'transparent',
                                            borderColor: 'rgba(74,127,217,0.2)',
                                            color: 'var(--stone-text-dim)',
                                        }),
                                    }}
                                >
                                    {persona}
                                </button>
                            ))}
                            {(searchQuery || filterAgent || filterPersona) && (
                                <button
                                    onClick={() => { setSearchQuery(''); setFilterAgent(''); setFilterPersona('') }}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '100px',
                                        fontSize: '0.625rem',
                                        fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        background: 'rgba(217,74,74,0.1)',
                                        border: '1px solid rgba(217,74,74,0.2)',
                                        color: 'var(--accent-red)',
                                    }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main style={{ minHeight: '50vh' }}>
                    {view === 'gallery' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '1.5rem',
                        }}>
                            {memories?.map((memory) => (
                                <div
                                    key={memory.short_id}
                                    onClick={() => setSelectedMemory(memory)}
                                    className="stone-card"
                                    style={{
                                        padding: 0,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        aspectRatio: '1',
                                        position: 'relative',
                                        background: 'var(--stone-dark)',
                                        overflow: 'hidden',
                                    }}>
                                        {memory.image_url ? (
                                            <Image
                                                src={memory.image_url}
                                                alt={memory.summary || 'Memory'}
                                                fill
                                                style={{ objectFit: 'cover', transition: 'transform 0.7s', opacity: 0.85 }}
                                            />
                                        ) : (
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--stone-text-dim)',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.625rem',
                                                textTransform: 'uppercase',
                                            }}>
                                                No Visual Encoded
                                            </div>
                                        )}
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            right: '0.75rem',
                                            background: 'rgba(42,39,36,0.85)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.625rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: 'var(--brass)',
                                            border: '1px solid rgba(184,134,11,0.2)',
                                        }}>
                                            {memory.short_id}
                                        </div>
                                    </div>
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{
                                            fontSize: '0.625rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: 'var(--stone-text-dim)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}>
                                            <span>{memory.agent}</span>
                                            <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {memory.personas && memory.personas.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.35rem',
                                                marginBottom: '0.5rem',
                                            }}>
                                                {memory.personas.map(persona => (
                                                    <span key={persona} style={{
                                                        fontSize: '0.6rem',
                                                        fontFamily: 'var(--font-mono)',
                                                        padding: '0.15rem 0.5rem',
                                                        background: 'rgba(74,127,217,0.1)',
                                                        border: '1px solid rgba(74,127,217,0.2)',
                                                        borderRadius: '4px',
                                                        color: 'var(--teal)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                    }}>
                                                        {persona}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <h3 style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '1.1rem',
                                            color: 'var(--stone-text)',
                                            lineHeight: 1.3,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {memory.summary || 'Untitled Session'}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'timeline' && (
                        <div style={{ maxWidth: '50rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {memories?.map((memory, idx) => (
                                <div
                                    key={memory.short_id}
                                    onClick={() => setSelectedMemory(memory)}
                                    className="stone-card"
                                    style={{
                                        display: 'flex',
                                        gap: '1.5rem',
                                        padding: '1rem 1.5rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            marginTop: '0.5rem',
                                            zIndex: 1,
                                            transition: 'all 0.2s',
                                            ...(idx === 0 ? {
                                                background: 'var(--brass)',
                                                boxShadow: '0 0 10px rgba(184,134,11,0.5)',
                                            } : {
                                                background: 'var(--stone-light)',
                                            }),
                                        }}></div>
                                        {idx !== memories.length - 1 && (
                                            <div style={{ width: 1, flex: 1, background: 'rgba(184,134,11,0.15)', margin: '0.5rem 0' }}></div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, paddingBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                            <h4 style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '1.25rem',
                                                color: 'var(--stone-text)',
                                            }}>
                                                {memory.summary}
                                            </h4>
                                            <span style={{
                                                fontSize: '0.625rem',
                                                fontFamily: 'var(--font-mono)',
                                                color: 'var(--stone-text-dim)',
                                                flexShrink: 0,
                                                marginLeft: '1rem',
                                            }}>{new Date(memory.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '0.625rem',
                                                fontFamily: 'var(--font-mono)',
                                                color: 'var(--brass)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.15em',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '4px',
                                                background: 'rgba(184,134,11,0.05)',
                                                border: '1px solid rgba(184,134,11,0.1)',
                                            }}>
                                                {memory.agent}
                                            </span>
                                            {memory.personas && memory.personas.length > 0 && memory.personas.map(persona => (
                                                <span key={persona} style={{
                                                    fontSize: '0.6rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    padding: '0.15rem 0.5rem',
                                                    background: 'rgba(74,127,217,0.1)',
                                                    border: '1px solid rgba(74,127,217,0.2)',
                                                    borderRadius: '4px',
                                                    color: 'var(--teal)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    {persona}
                                                </span>
                                            ))}
                                            {memory.room && (
                                                <span style={{
                                                    fontSize: '0.625rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    color: 'var(--teal)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.15em',
                                                }}>
                                                    in {memory.room}
                                                </span>
                                            )}
                                            {memory.outcome && (
                                                <span style={{
                                                    fontSize: '0.625rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.15em',
                                                    color: memory.outcome === 'succeeded' ? 'var(--accent-green)' : 'var(--accent-red)',
                                                }}>
                                                    {memory.outcome}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: 64,
                                        height: 64,
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(184,134,11,0.12)',
                                        flexShrink: 0,
                                        filter: 'grayscale(0.5)',
                                        transition: 'filter 0.3s',
                                    }}>
                                        {memory.image_url ? (
                                            <Image src={memory.image_url} alt="" fill style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ background: 'var(--stone-dark)', width: '100%', height: '100%' }}></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'state' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '2rem',
                        }}>
                            {/* Palace State Visualization */}
                            <div className="stone-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                                    {sectionHeader('Deep State Projection')}
                                    <button
                                        onClick={handleVisualizePalace}
                                        disabled={isVisualizing}
                                        style={{
                                            padding: '0.5rem 1.5rem',
                                            background: 'linear-gradient(135deg, rgba(184,134,11,0.15) 0%, rgba(74,157,110,0.15) 100%)',
                                            border: '1px solid rgba(184,134,11,0.3)',
                                            color: 'var(--brass)',
                                            borderRadius: '100px',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.65rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            cursor: isVisualizing ? 'not-allowed' : 'pointer',
                                            opacity: isVisualizing ? 0.7 : 1,
                                        }}
                                    >
                                        {isVisualizing ? 'Projecting...' : '✨ Visualize Domain'}
                                    </button>
                                </div>
                                {palaceVisual && (
                                    <div style={{ width: '100%', aspectRatio: '21/9', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(184,134,11,0.2)' }}>
                                        <Image src={palaceVisual} alt="Palace State" fill style={{ objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div>
                                    {sectionHeader('Open Next Steps')}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {palaceData?.open_next_steps?.length > 0 ? (
                                            palaceData.open_next_steps.map((step, i) => (
                                                <div key={i} className="stone-tablet" style={{
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    fontFamily: 'var(--font-display)',
                                                    color: 'var(--stone-text-dim)',
                                                }}>
                                                    <span style={{ color: 'var(--brass)', fontFamily: 'var(--font-mono)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                                                    {step}
                                                </div>
                                            ))
                                        ) : (
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
                                                No pending directives.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {sectionHeader('Active Agents')}
                                    <div className="brass-frame" style={{ overflow: 'hidden' }}>
                                        {(palaceData?.agents || []).map((agent, i) => (
                                            <div key={i} style={{
                                                padding: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                borderBottom: i < (palaceData?.agents?.length || 0) - 1 ? '1px solid rgba(184,134,11,0.1)' : 'none',
                                            }}>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: 'var(--accent-green)',
                                                    boxShadow: '0 0 8px rgba(74,157,110,0.4)',
                                                }}></div>
                                                <div>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--stone-text)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{agent.name}</div>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--stone-text-dim)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>{agent.permissions} &middot; joined {new Date(agent.joined).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="stone-card" style={{
                                        marginTop: '1.5rem',
                                        padding: '1.5rem',
                                        background: 'rgba(184,134,11,0.04)',
                                        borderColor: 'rgba(184,134,11,0.15)',
                                    }}>
                                        <div style={{
                                            fontSize: '0.625rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: 'var(--brass)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            marginBottom: '1rem',
                                        }}>Palace Stats</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', color: 'var(--stone-text)' }}>{allMemories?.length || 0}</div>
                                                <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--stone-text-dim)', textTransform: 'uppercase' }}>Total Memories</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', color: 'var(--stone-text)' }}>{Object.keys(palaceData?.rooms || {}).length}</div>
                                                <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--stone-text-dim)', textTransform: 'uppercase' }}>Rooms Defined</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {sectionHeader('Rooms Topology')}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {Object.entries(palaceData?.rooms || {}).length > 0 ? (
                                        Object.entries(palaceData.rooms).map(([name, data]) => (
                                            <div key={name} className="stone-card" style={{ padding: '1.25rem' }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.625rem',
                                                    color: 'var(--brass)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.15em',
                                                    marginBottom: '0.5rem',
                                                }}>{name}</h4>
                                                <p style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--stone-text-dim)',
                                                    lineHeight: 1.6,
                                                    fontStyle: 'italic',
                                                }}>{data.description || 'No domain description encoded.'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="stone-tablet" style={{
                                            gridColumn: '1 / -1',
                                            padding: '3rem',
                                            textAlign: 'center',
                                            color: 'var(--stone-text-dim)',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            border: '1px dashed rgba(184,134,11,0.15)',
                                        }}>
                                            Spacial domains not yet defined.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Memory Detail Modal */}
            {selectedMemory && (
                <MemoryDetail
                    shortId={selectedMemory.short_id}
                    imageUrl={selectedMemory.image_url}
                    palaceId={palace.id}
                    onClose={() => setSelectedMemory(null)}
                />
            )}
        </div>
    )
}

function MemoryDetail({ shortId, imageUrl, palaceId, onClose }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isDrafting, setIsDrafting] = useState(false)
    const [draftStatus, setDraftStatus] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/q/${shortId}`, {
                    headers: { 'Accept': 'application/json' },
                })
                const json = await res.json()
                setData(json)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [shortId])

    const handleDraftFromMemory = async () => {
        if (!data || !data.payload) return
        setIsDrafting(true)
        setDraftStatus(null)

        const payload = data.payload
        const title = payload.session_name || 'Untitled Memory Session'
        const slug = `draft-${shortId}-${Date.now()}`
        
        let content = `# ${title}\n\n`
        if (payload.status) content += `**Status:** ${payload.status}\n\n`
        
        if (payload.built && payload.built.length > 0) {
            content += `## What was built\n`
            payload.built.forEach(item => content += `- ${item}\n`)
            content += `\n`
        }
        
        if (payload.decisions && payload.decisions.length > 0) {
            content += `## Key Decisions\n`
            payload.decisions.forEach(item => content += `- ${item}\n`)
            content += `\n`
        }
        
        if (payload.next_steps && payload.next_steps.length > 0) {
            content += `## Next Steps\n`
            payload.next_steps.forEach(item => content += `- ${item}\n`)
            content += `\n`
        }

        try {
            const res = await fetch('/api/blog/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    palace_id: palaceId,
                    slug,
                    title,
                    content,
                    cover_image: imageUrl,
                    tags: ['memory-draft'],
                    source_memories: [shortId],
                    status: 'draft',
                    show_provenance: true
                })
            })
            
            const result = await res.json()
            if (result.success) {
                setDraftStatus('success')
            } else {
                setDraftStatus('error')
                console.error(result.error)
            }
        } catch (err) {
            console.error(err)
            setDraftStatus('error')
        } finally {
            setIsDrafting(false)
        }
    }

    const payload = data?.payload || {}

    const sectionTitle = (title) => (
        <h3 style={{
            fontSize: '0.625rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--brass)',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        }}>
            {title}
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(184,134,11,0.2), transparent)' }}></span>
        </h3>
    )

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(42,39,36,0.95)',
            backdropFilter: 'blur(8px)',
        }}>
            <div className="brass-frame-strong" style={{
                width: '100%',
                maxWidth: '64rem',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Close button mobile */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 10,
                        padding: '0.5rem',
                        color: 'var(--stone-text-dim)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'block',
                    }}
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem 2.5rem',
                    borderBottom: '1px solid var(--brass-dim)',
                    background: 'rgba(58,54,50,0.5)',
                }}>
                    <div>
                        <div style={{
                            fontSize: '0.625rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--brass)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em',
                            marginBottom: '0.25rem',
                        }}>
                            MEMORY CAPSULE &middot; {shortId}
                        </div>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                            fontWeight: 300,
                            color: 'var(--stone-text)',
                        }}>
                            {loading ? 'Loading...' : (payload.session_name || 'Untitled Session')}
                        </h2>
                    </div>
                    {!loading && (
                        <div>
                            <button
                                onClick={handleDraftFromMemory}
                                disabled={isDrafting || draftStatus === 'success'}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: draftStatus === 'success' ? 'rgba(74,157,110,0.15)' : 'rgba(184,134,11,0.15)',
                                    color: draftStatus === 'success' ? '#4a9d6e' : 'var(--brass)',
                                    border: `1px solid ${draftStatus === 'success' ? 'rgba(74,157,110,0.3)' : 'rgba(184,134,11,0.3)'}`,
                                    borderRadius: '4px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    cursor: (isDrafting || draftStatus === 'success') ? 'not-allowed' : 'pointer',
                                    opacity: isDrafting ? 0.7 : 1,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                {isDrafting ? 'Drafting...' : draftStatus === 'success' ? 'Draft Saved' : 'Draft Blog Post'}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem', gap: '1rem' }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                border: '2px solid rgba(184,134,11,0.1)',
                                borderTop: '2px solid var(--brass)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}></div>
                            <div style={{
                                fontSize: '0.625rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--stone-text-dim)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                            }}>Scanning Ciphertext...</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5rem' }}>
                            {/* Meta Sidebar */}
                            <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                                <div style={{
                                    aspectRatio: '1',
                                    position: 'relative',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '2px solid var(--brass-dim)',
                                    background: 'var(--stone-dark)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    maxHeight: 400,
                                }}>
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt="" fill style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--stone-text-dim)',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.625rem',
                                            textTransform: 'uppercase',
                                            textAlign: 'center',
                                            padding: '2rem',
                                        }}>
                                            No Visual Projection Encoded
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ borderTop: '1px solid rgba(184,134,11,0.12)', borderBottom: '1px solid rgba(184,134,11,0.12)' }}>
                                        {[
                                            { label: 'Agent Character', value: data.agent, dot: true },
                                            { label: 'Observation Date', value: new Date(data.created_at).toLocaleString() },
                                            {
                                                label: 'Session Outcome',
                                                value: payload.outcome || 'Unknown',
                                                color: payload.outcome === 'succeeded' ? 'var(--accent-green)' : 'var(--accent-red)',
                                            },
                                        ].map(({ label, value, dot, color }) => (
                                            <div key={label} style={{ padding: '1rem 0', borderBottom: '1px solid rgba(184,134,11,0.08)' }}>
                                                <div style={{
                                                    fontSize: '0.625rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    color: 'var(--stone-text-dim)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.15em',
                                                    marginBottom: '0.25rem',
                                                }}>{label}</div>
                                                <div style={{
                                                    fontSize: '0.9rem',
                                                    fontFamily: 'var(--font-display)',
                                                    color: color || 'var(--stone-text)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                }}>
                                                    {dot && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brass)' }}></div>}
                                                    {value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Narrative Context */}
                                    {payload.conversation_context && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            {sectionTitle('Narrative Context')}
                                            <p style={{
                                                color: 'var(--stone-text-dim)',
                                                lineHeight: 1.8,
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '1.05rem',
                                                fontStyle: 'italic',
                                            }}>
                                                {payload.conversation_context}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content sections */}
                            <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                {payload.built?.length > 0 && (
                                    <section>
                                        {sectionTitle('Artifacts Constructed')}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {payload.built.map((item, i) => (
                                                <div key={i} className="stone-tablet" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{ color: 'var(--brass)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>&#x25C8;</span>
                                                    <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.decisions?.length > 0 && (
                                    <section>
                                        {sectionTitle('Architectural Decisions')}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {payload.decisions.map((decision, i) => (
                                                <div key={i} className="stone-tablet" style={{ position: 'relative', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '-0.5rem',
                                                        left: '-0.25rem',
                                                        fontSize: '2rem',
                                                        color: 'rgba(184,134,11,0.15)',
                                                        fontFamily: 'var(--font-display)',
                                                        lineHeight: 1,
                                                    }}>&ldquo;</span>
                                                    {decision}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.next_steps?.length > 0 && (
                                    <section>
                                        {sectionTitle('Future Directives')}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {payload.next_steps.map((step, i) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--stone-text)',
                                                    padding: '1rem',
                                                    background: 'rgba(184,134,11,0.04)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(184,134,11,0.1)',
                                                }}>
                                                    <div style={{
                                                        flexShrink: 0,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        background: 'rgba(184,134,11,0.08)',
                                                        border: '1px solid rgba(184,134,11,0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.625rem',
                                                        fontFamily: 'var(--font-mono)',
                                                        color: 'var(--brass)',
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                    <span style={{ lineHeight: 1.5 }}>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.files?.length > 0 && (
                                    <section>
                                        {sectionTitle('Modified Symbols')}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {payload.files.map((file, i) => (
                                                <code key={i} style={{
                                                    padding: '0.15rem 0.5rem',
                                                    background: 'rgba(74,127,217,0.06)',
                                                    border: '1px solid rgba(74,127,217,0.12)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.625rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    color: 'var(--teal)',
                                                }}>
                                                    {file}
                                                </code>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.blockers?.length > 0 && (
                                    <section style={{
                                        padding: '1.5rem',
                                        background: 'rgba(217,74,74,0.04)',
                                        border: '1px solid rgba(217,74,74,0.15)',
                                        borderRadius: '12px',
                                    }}>
                                        <h3 style={{
                                            fontSize: '0.625rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: 'var(--accent-red)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3em',
                                            marginBottom: '1rem',
                                        }}>Critical Impasse</h3>
                                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {payload.blockers.map((blocker, i) => (
                                                <li key={i} style={{
                                                    fontSize: '0.9rem',
                                                    color: 'var(--accent-red)',
                                                    display: 'flex',
                                                    gap: '0.75rem',
                                                    lineHeight: 1.5,
                                                }}>
                                                    <span style={{ fontWeight: 700 }}>!</span> {blocker}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '1.5rem 2.5rem',
                    borderTop: '1px solid var(--brass-dim)',
                    background: 'rgba(58,54,50,0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{
                        fontSize: '0.625rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--stone-text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                    }}>
                        Secure Handoff Protocol Active
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a
                            href={`/q/${shortId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                textAlign: 'center',
                                padding: '0.5rem 1.5rem',
                                border: '1px solid var(--brass-dim)',
                                borderRadius: '100px',
                                fontSize: '0.625rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--stone-text-dim)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                textDecoration: 'none',
                            }}
                        >
                            JSON Ledger
                        </a>
                        <button
                            onClick={onClose}
                            style={{
                                textAlign: 'center',
                                padding: '0.5rem 2rem',
                                background: 'var(--brass)',
                                color: '#1a1400',
                                borderRadius: '100px',
                                fontSize: '0.625rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
