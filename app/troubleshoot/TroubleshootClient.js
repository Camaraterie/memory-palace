'use client'

import { useState } from 'react'

function linkify(text) {
  const urlRe = /(https?:\/\/[^\s)]+)/g
  const parts = text.split(urlRe)
  return parts.map((part, i) =>
    urlRe.test(part)
      ? <a key={i} href={part} style={{ color: 'var(--brass)', wordBreak: 'break-all' }}>{part}</a>
      : part
  )
}

function parseContent(text) {
  const lines = text.split('\n')
  // Skip header lines (# title, # url) and leading ---
  let start = 0
  while (start < lines.length && (lines[start].startsWith('#') || lines[start].trim() === '---' || !lines[start].trim())) {
    if (lines[start].startsWith('## ')) break // stop at first real ## heading
    start++
  }

  // Split remaining into sections by ---
  const body = lines.slice(start).join('\n')
  const rawSections = body.split(/\n---\n/).filter(s => s.trim())

  return rawSections.map(section => {
    const sLines = section.split('\n')
    let heading = null
    const blocks = []
    let i = 0

    // First non-empty line starting with ## is the heading
    while (i < sLines.length) {
      const line = sLines[i]
      if (!line.trim()) { i++; continue }
      if (line.startsWith('## ')) {
        heading = line.slice(3)
        i++
        break
      }
      // If no ## heading, use the first line as heading
      heading = line
      i++
      break
    }

    // Parse remaining lines into blocks
    while (i < sLines.length) {
      const line = sLines[i]

      if (!line.trim()) { i++; continue }

      // Bullet list
      if (line.startsWith('- ')) {
        const items = []
        while (i < sLines.length && sLines[i].startsWith('- ')) {
          items.push(sLines[i].slice(2))
          i++
        }
        blocks.push({ type: 'list', items })
        continue
      }

      // Indented line (2+ spaces) — code/command block
      if (line.match(/^  \S/)) {
        const codeLines = []
        while (i < sLines.length && (sLines[i].startsWith('  ') || !sLines[i].trim())) {
          codeLines.push(sLines[i])
          i++
        }
        while (codeLines.length && !codeLines[codeLines.length - 1].trim()) codeLines.pop()
        blocks.push({ type: 'code', text: codeLines.map(l => l.replace(/^  /, '')).join('\n') })
        continue
      }

      // Regular paragraph
      const paraLines = []
      while (i < sLines.length && sLines[i].trim() &&
        !sLines[i].startsWith('- ') &&
        !sLines[i].startsWith('## ') &&
        !sLines[i].match(/^  \S/)) {
        paraLines.push(sLines[i])
        i++
      }
      if (paraLines.length) {
        blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
      }
    }

    return { heading, blocks }
  }).filter(s => s.heading)
}

function isFix(text) {
  return /^Fix:/i.test(text) || /^Diagnosis:/i.test(text)
}

export default function TroubleshootClient({ content }) {
  const [copied, setCopied] = useState(false)
  const sections = parseContent(content)

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

  return (
    <div className="stone-surface" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          marginBottom: '3rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(184, 134, 11, 0.12)',
        }}>
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
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 600,
            marginTop: '0.75rem',
            color: 'var(--stone-text)',
          }}>Troubleshooting</h1>
          <p style={{
            color: 'var(--stone-text-dim)',
            marginTop: '0.75rem',
            fontSize: '1rem',
            lineHeight: 1.7,
          }}>
            Common errors, their causes, and how to fix them.
          </p>
          <button className={`brass-btn ${copied ? 'copied' : ''}`} onClick={copy} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '1rem',
          }}>
            {copied ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied raw markdown
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy as markdown
              </>
            )}
          </button>
        </div>

        {/* Troubleshoot Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {sections.map((section, si) => (
            <article key={si} style={{
              paddingBottom: si < sections.length - 1 ? '2.5rem' : 0,
              borderBottom: si < sections.length - 1 ? '1px solid rgba(184, 134, 11, 0.1)' : 'none',
            }}>
              {/* Error heading — monospace, looks like an error label */}
              <h2 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--stone-text)',
                marginBottom: '1rem',
                lineHeight: 1.4,
                padding: '0.5rem 0.85rem',
                background: 'rgba(184, 134, 11, 0.06)',
                borderLeft: '3px solid var(--brass-dim)',
                borderRadius: '0 4px 4px 0',
              }}>
                {section.heading}
              </h2>

              {/* Content blocks */}
              {section.blocks.map((block, bi) => {
                if (block.type === 'paragraph') {
                  const isFixLine = isFix(block.text)
                  return (
                    <p key={bi} style={{
                      color: isFixLine ? 'var(--stone-text)' : 'var(--stone-text-dim)',
                      fontSize: '0.95rem',
                      lineHeight: 1.8,
                      marginBottom: '0.75rem',
                      ...(isFixLine ? {
                        fontWeight: 500,
                        paddingLeft: '0.75rem',
                        borderLeft: '2px solid var(--accent-green)',
                      } : {}),
                    }}>
                      {linkify(block.text)}
                    </p>
                  )
                }

                if (block.type === 'list') {
                  return (
                    <ul key={bi} style={{
                      margin: '0.5rem 0 0.75rem 0',
                      paddingLeft: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                    }}>
                      {block.items.map((item, ii) => (
                        <li key={ii} style={{
                          color: 'var(--stone-text-dim)',
                          fontSize: '0.95rem',
                          lineHeight: 1.7,
                        }}>
                          {linkify(item)}
                        </li>
                      ))}
                    </ul>
                  )
                }

                if (block.type === 'code') {
                  return (
                    <pre key={bi} style={{
                      background: 'rgba(26, 24, 20, 0.7)',
                      border: '1px solid rgba(184, 134, 11, 0.15)',
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                      margin: '0.5rem 0 0.75rem 0',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      lineHeight: 1.7,
                      color: 'var(--brass)',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {linkify(block.text)}
                    </pre>
                  )
                }

                return null
              })}
            </article>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--stone-text-dim)' }}>
            Still stuck?{' '}
            <a href="/faq" style={{ color: 'var(--brass)', textDecoration: 'none' }}>FAQ</a>
            {' '}&middot;{' '}
            <a href="/skill" style={{ color: 'var(--brass)', textDecoration: 'none' }}>Skill file</a>
            {' '}&middot;{' '}
            <a href="/docs" style={{ color: 'var(--brass)', textDecoration: 'none' }}>All docs</a>
          </p>
        </div>
      </div>
    </div>
  )
}
