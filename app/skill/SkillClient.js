'use client'

import { useState } from 'react'

export default function SkillClient({ content }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'memory-palace-skill.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stone-surface" style={{
      minHeight: '100vh',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid rgba(184, 134, 11, 0.12)',
        }}>
          <div>
            <a href="/" style={{
              color: 'var(--brass-dim)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              m.cuer.ai
            </a>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 400,
              marginTop: '0.5rem',
              color: 'var(--stone-text)',
            }}>Memory Palace Skill</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="brass-btn" onClick={download} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button className={`brass-btn ${copied ? 'copied' : ''}`} onClick={copy} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              {copied ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="brass-code-viewer">
          <div className="viewer-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              memory-palace-skill.md
            </span>
          </div>
          <pre>
            {content}
          </pre>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: 'var(--stone-text-dim)',
        }}>
          Give this file to any AI agent. That&apos;s it.{' '}
          <a href="/" style={{ color: 'var(--brass)', textDecoration: 'none' }}>Learn more &rarr;</a>
        </p>
      </div>
    </div>
  )
}
