'use client'

import { useState } from 'react'

const SKILL_URL = 'https://m.cuer.ai/memory-palace-skill.md'

export default function AudienceToggle() {
  const [audience, setAudience] = useState<'agent' | 'human'>('agent')
  const [copied, setCopied] = useState(false)

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

      {/* Segmented Control */}
      <div className="segmented-control" role="tablist" aria-label="Audience selector">
        <button
          className={`segmented-control-option ${audience === 'agent' ? 'segmented-control-active' : ''}`}
          role="tab"
          aria-selected={audience === 'agent'}
          onClick={() => setAudience('agent')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="4" />
            <circle cx="9" cy="16" r="1" fill="currentColor" />
            <circle cx="15" cy="16" r="1" fill="currentColor" />
          </svg>
          I'm an Agent
        </button>
        <button
          className={`segmented-control-option ${audience === 'human' ? 'segmented-control-active' : ''}`}
          role="tab"
          aria-selected={audience === 'human'}
          onClick={() => setAudience('human')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          I'm a Human
        </button>
      </div>

      {/* Agent Panel */}
      {audience === 'agent' && (
        <div className="audience-panel" role="tabpanel" key="agent">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="stone-label">For AI Agents</div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--stone-text)',
              marginBottom: '0.5rem',
              lineHeight: 1.3,
            }}>Read the skill file to begin</h3>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--stone-text-dim)',
              lineHeight: 1.6,
            }}>
              Point your agent at this URL at session start. It contains every command,
              API endpoint, and workflow you need.
            </p>
          </div>

          {/* Skill URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <div className="brass-terminal" style={{ justifyContent: 'space-between', width: '100%', display: 'flex' }}>
              <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', minWidth: 0, flex: 1 }}>
                <span className="prompt">$</span> {SKILL_URL}
              </code>
              <button
                className="brass-btn"
                onClick={() => copyText(SKILL_URL)}
                style={{ flexShrink: 0, marginLeft: '0.5rem' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* /onboard command */}
            <div className="brass-terminal" style={{ width: '100%', display: 'flex' }}>
              <code style={{ fontSize: '0.8rem' }}>
                <span className="prompt">&gt;</span> /onboard
              </code>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--stone-text-dim)',
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
              }}>quick-start</span>
            </div>
          </div>

          {/* Link Cards */}
          <div className="audience-link-cards" style={{ marginTop: '1rem', width: '100%' }}>
            <a href="/docs" className="audience-link-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              API Reference
            </a>
            <a href="/onboard" className="audience-link-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Onboarding
            </a>
            <a href="/skill" className="audience-link-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              Full Skill File
            </a>
            <a href="/troubleshoot" className="audience-link-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Troubleshooting
            </a>
          </div>
        </div>
      )}

      {/* Human Panel */}
      {audience === 'human' && (
        <div className="audience-panel" role="tabpanel" key="human">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="stone-label">For Humans</div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--stone-text)',
              marginBottom: '0.5rem',
              lineHeight: 1.3,
            }}>Your AI remembers everything</h3>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--stone-text-dim)',
              lineHeight: 1.6,
            }}>
              Persistent memory across sessions — stored as illustrated images with QR codes.
              No database, no SDK — just one markdown file.
            </p>
          </div>

          {/* Getting Started Steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            width: '100%',
          }}>
            {[
              { step: '01', title: 'Log in', text: 'Sign in with GitHub. You get a palace ID and a guest key for your agents.' },
              { step: '02', title: 'Give the skill', text: 'Paste the skill URL into your agent\'s system prompt or session start.' },
              { step: '03', title: 'Start working', text: 'Your agent stores and recalls memories automatically.' },
            ].map(({ step, title, text }) => (
              <div key={step} className="stone-card" style={{ padding: '1.25rem' }}>
                <div className="engraved" style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 300,
                  lineHeight: 1,
                  marginBottom: '0.6rem',
                }}>{step}</div>
                <h4 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  color: 'var(--stone-text)',
                }}>{title}</h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--stone-text-dim)',
                  lineHeight: 1.5,
                }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Link Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
          }}>
            <a href="/faq" className="stone-btn" style={{ fontSize: '0.85rem', padding: '0.65rem 1.5rem' }}>FAQ</a>
            <a href="/docs" className="stone-btn" style={{ fontSize: '0.85rem', padding: '0.65rem 1.5rem' }}>Docs</a>
            <a href="/troubleshoot" className="stone-btn" style={{ fontSize: '0.85rem', padding: '0.65rem 1.5rem' }}>Troubleshooting</a>
            <a href="/login" className="stone-btn stone-btn-primary" style={{ fontSize: '0.85rem', padding: '0.65rem 1.5rem' }}>Log in</a>
          </div>
        </div>
      )}
    </div>
  )
}
