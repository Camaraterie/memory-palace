'use client'

import { useState, useEffect } from 'react'
import Hero, { NeuralOverlay } from '../components/Hero'

const SKILL_URL = '/memory-palace-skill.md'

export default function LandingPage() {
  const [skillContent, setSkillContent] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(SKILL_URL)
      .then(r => r.text())
      .then(setSkillContent)
      .catch(() => setSkillContent('# Error loading skill file'))
  }, [])

  const copySkill = async () => {
    try {
      await navigator.clipboard.writeText(skillContent)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = skillContent
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const downloadSkill = () => {
    const blob = new Blob([skillContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'memory-palace-skill.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const agents = [
    {
      name: 'FORGE',
      aka: 'Claude Code',
      color: '#4A90D9',
      desc: 'The Craftsman — navy apron, precision tools, wooden workbench. Builds with intention.',
    },
    {
      name: 'FLUX',
      aka: 'Gemini CLI',
      color: '#34A853',
      desc: 'The Alchemist — emerald lab coat, glass beakers, colorful liquids. Transmutes ideas into images.',
    },
    {
      name: 'ATLAS',
      aka: 'Codex',
      color: '#F5A623',
      desc: 'The Cartographer — tan vest, blueprints, rulers and compasses. Maps the territory.',
    },
    {
      name: 'INDEX',
      aka: 'OpenClaw',
      color: '#9B59B6',
      desc: 'The Librarian — burgundy cardigan, leather-bound books, tall shelves. Indexes everything.',
    },
  ]

  return (
    <div className="landing-page stone-surface" style={{ position: 'relative' }}>

      <NeuralOverlay />

      <Hero copySkill={copySkill} downloadSkill={downloadSkill} copied={copied} />

      {/* ═══ Onboarding Comic ═══ */}
      <section className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="stone-label">How It Works</div>
        <h2 className="stone-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          From skill file to persistent memory
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginTop: '2.5rem',
        }}>
          {[
            { step: '01', title: 'Give the skill to any agent', text: 'Copy the skill file and tell your agent to use it. Works with Claude Code, Gemini CLI, Codex, OpenClaw — anything that reads markdown.' },
            { step: '02', title: 'Work, then say /store', text: 'The agent summarizes the session, generates a memory image with a QR code linking to the full lossless record.' },
            { step: '03', title: 'Next session: /recall', text: 'The agent loads memory images for context. Need perfect detail? Scan the QR code and get everything back.' },
          ].map(({ step, title, text }) => (
            <div key={step} className="stone-card">
              <div className="engraved" style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 300,
                lineHeight: 1,
                marginBottom: '1rem',
              }}>{step}</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: 'var(--stone-text)',
              }}>{title}</h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--stone-text-dim)',
                lineHeight: 1.7,
              }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="stone-divider" style={{ margin: '0 auto' }}></div>

      {/* ═══ Three-Tier Architecture ═══ */}
      <section className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="stone-label">Architecture</div>
        <h2 className="stone-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          Three tiers of recall
        </h2>
        <p className="stone-body">
          Every memory can be accessed at three levels of fidelity.
          Agents start cheap and go deeper only when they need to.
        </p>

        <div style={{
          marginTop: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 700,
          gap: 0,
        }}>
          {[
            {
              num: '1',
              title: 'Visual analysis',
              cost: '~1,000 tokens',
              text: 'The agent looks at the memory image. Recognizes the character, reads whiteboard text, infers the scene. Fast, cheap, approximate — like human recall.',
              highlight: false,
            },
            {
              num: '2',
              title: 'State JSON',
              cost: 'Structured index',
              text: 'The agent reads the palace state file — precise summaries, artifact paths, linked chain of memories. Compact, accurate, machine-readable.',
              highlight: false,
            },
            {
              num: '3',
              title: 'QR scan — lossless recall',
              cost: 'Powered by CueR.ai',
              text: 'The agent scans the QR code in the image, follows the URL, and retrieves the exact prompt that generated the image — complete session with zero information loss.',
              highlight: true,
            },
          ].map((tier, idx) => (
            <div key={tier.num}>
              <div className={tier.highlight ? 'stone-card' : 'stone-tablet'} style={{
                width: '100%',
                ...(tier.highlight ? {
                  borderColor: 'rgba(184, 134, 11, 0.3)',
                  background: 'linear-gradient(135deg, rgba(58,54,50,0.8) 0%, rgba(184,134,11,0.06) 100%)',
                } : {}),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div className="engraved" style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    fontWeight: 300,
                    lineHeight: 1,
                    width: '2rem',
                    textAlign: 'center',
                    flexShrink: 0,
                    ...(tier.highlight ? { color: 'var(--gold)' } : {}),
                  }}>{tier.num}</div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--stone-text)' }}>{tier.title}</h3>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.05em',
                      color: tier.highlight ? 'var(--gold)' : 'var(--stone-text-dim)',
                    }}>{tier.cost}</span>
                  </div>
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--stone-text-dim)',
                  lineHeight: 1.7,
                  paddingLeft: '3rem',
                }}>{tier.text}</p>
              </div>
              {idx < 2 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
                  <svg width="2" height="32" viewBox="0 0 2 32">
                    <line x1="1" y1="0" x2="1" y2="32" stroke="var(--brass-dim)" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="stone-divider"></div>

      {/* ═══ CueR.ai Infrastructure ═══ */}
      <section className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="stone-label">Infrastructure</div>
        <h2 className="stone-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          CueR.ai makes it lossless
        </h2>
        <p className="stone-body">
          Without CueR.ai, Memory Palace is a useful lossy compression scheme — images that
          approximate what happened. With CueR.ai, every image contains a QR code that
          resolves to the full, uncompressed context.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginTop: '2.5rem',
        }}>
          {[
            { icon: '\u{1F517}', title: 'Short URL generation', text: 'Every memory gets a qr.cuer.ai short link. 25 characters that encode unlimited context.' },
            { icon: '\u{1F4E6}', title: 'Prompt hosting', text: 'The full session summary — every file path, decision, blocker — stored and served instantly.' },
            { icon: '\u{1F4F1}', title: 'Reliable QR scanning', text: 'QReader-powered scanning that works on AI-generated images — angled, stylized, or in complex scenes.' },
            { icon: '\u{1F3DB}', title: 'Self-distributing', text: 'Point the QR at the skill file. Anyone who sees a memory image can scan it and start using the system.' },
          ].map(({ icon, title, text }) => (
            <div key={title} className="stone-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
              <h4 style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: 'var(--stone-text)',
              }}>{title}</h4>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--stone-text-dim)',
                lineHeight: 1.6,
              }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="stone-divider"></div>

      {/* ═══ Agent Roster ═══ */}
      <section className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="stone-label">Agent Roster</div>
        <h2 className="stone-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          Every agent gets a character
        </h2>
        <p className="stone-body" style={{ marginBottom: '0.5rem' }}>
          Nano Banana Pro maintains character consistency across image generations.
          You always know who did what at a glance.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginTop: '2.5rem',
        }}>
          {agents.map((agent) => (
            <div key={agent.name} className="portrait-frame" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: agent.color,
                  boxShadow: `0 0 8px ${agent.color}40`,
                  flexShrink: 0,
                }}></div>
                <div>
                  <h4 style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--stone-text)',
                    letterSpacing: '0.05em',
                  }}>{agent.name}</h4>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--stone-text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>{agent.aka}</div>
                </div>
              </div>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--stone-text-dim)',
                lineHeight: 1.5,
              }}>{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="stone-divider" style={{ margin: '0 auto' }}></div>

      {/* ═══ Skill Preview ═══ */}
      <section className="section" id="skill" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="stone-label">The Skill File</div>
        <h2 className="stone-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          This is the entire product
        </h2>
        <p className="stone-body">
          One markdown file. Give it to any agent. No SDK, no database, no signup.
        </p>

        <div className="brass-code-viewer" style={{ marginTop: '2.5rem' }}>
          <div className="viewer-header">
            <span>memory-palace-skill.md</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="brass-btn" onClick={downloadSkill}>Download</button>
              <button className={`brass-btn ${copied ? 'copied' : ''}`} onClick={copySkill}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <pre>
            {skillContent || 'Loading skill file...'}
          </pre>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{
        textAlign: 'center',
        padding: '8rem 2rem',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(184,134,11,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}></div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 500,
          marginBottom: '1.5rem',
          position: 'relative',
          color: 'var(--stone-text)',
        }}>Start remembering</h2>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--stone-text-dim)',
          maxWidth: 500,
          margin: '0 auto 2.5rem',
          lineHeight: 1.7,
          position: 'relative',
        }}>
          Copy the skill file. Set your Gemini API key. Tell your agent to use it.
          Your first <code style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>/store</code> is
          one command away.
        </p>
        <button className="stone-btn-primary stone-btn" onClick={copySkill} style={{ position: 'relative' }}>
          {copied ? 'Copied to clipboard' : 'Copy the Skill File'}
        </button>
      </section>

      {/* ═══ Footer ═══ */}
      <footer style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(184, 134, 11, 0.1)',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--stone-text-dim)' }}>
          Memory Palace is free and open.{' '}
          <a href="https://cuer.ai" style={{ color: 'var(--brass)', textDecoration: 'none' }}>CueR.ai</a> is the infrastructure that makes it lossless.
          {' '}&middot;{' '}
          <a href={SKILL_URL} style={{ color: 'var(--brass-dim)', textDecoration: 'none' }}>Raw skill file</a>
          {' '}&middot;{' '}
          <a href="/docs" style={{ color: 'var(--brass-dim)', textDecoration: 'none' }}>Documentation</a>
          {' '}&middot;{' '}
          <a href="https://github.com/Camaraterie/memory-palace" target="_blank" rel="noopener" style={{ color: 'var(--brass-dim)', textDecoration: 'none' }}>GitHub</a>
        </p>
      </footer>
    </div>
  )
}
