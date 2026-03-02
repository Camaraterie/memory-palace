'use client'

import { useState } from 'react'

function inlineFormatLine(text) {
  const result = []
  const re = /(\*\*([^*\n]+)\*\*)|(`([^`\n]+)`)|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s),\]]+)/g
  let lastIndex = 0
  let match

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index))
    if (match[1]) {
      result.push(<strong key={match.index}>{match[2]}</strong>)
    } else if (match[3]) {
      result.push(
        <code key={match.index} style={{
          fontFamily: 'var(--font-mono)',
          background: 'rgba(184,134,11,0.12)',
          padding: '0.1em 0.35em',
          borderRadius: '3px',
          fontSize: '0.875em',
          color: 'var(--brass)',
        }}>{match[4]}</code>
      )
    } else if (match[5]) {
      result.push(<a key={match.index} href={match[6]} style={{ color: 'var(--brass)', wordBreak: 'break-all' }}>{match[5]}</a>)
    } else {
      result.push(<a key={match.index} href={match[7]} style={{ color: 'var(--brass)', wordBreak: 'break-all' }}>{match[7]}</a>)
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex))
  return result
}

function inlineFormat(text) {
  const lines = text.split('\n')
  if (lines.length === 1) return inlineFormatLine(text)
  return lines.flatMap((line, idx) => {
    const formatted = inlineFormatLine(line)
    return idx < lines.length - 1
      ? [...formatted, <br key={`br${idx}`} />]
      : formatted
  })
}

function parseMarkdown(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    // H1 — skip page title
    if (/^# [^#]/.test(line)) { i++; continue }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      i++; continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      i++; continue
    }
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      i++; continue
    }

    if (line.startsWith('```')) {
      const openLen = (line.match(/^`+/) || ['```'])[0].length
      const lang = line.slice(openLen).trim()
      const codeLines = []
      let depth = 1
      i++
      while (i < lines.length) {
        const cl = lines[i]
        const fm = cl.match(/^(`+)/)
        if (fm && fm[1].length >= openLen) {
          const afterFence = cl.slice(fm[1].length).trim()
          if (afterFence === '') {
            depth--
            if (depth === 0) { i++; break }
            codeLines.push(cl)
          } else {
            depth++
            codeLines.push(cl)
          }
        } else {
          codeLines.push(cl)
        }
        i++
      }
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') })
      continue
    }

    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    const paraLines = []
    while (i < lines.length) {
      const l = lines[i]
      if (!l.trim()) { i++; break }
      if (/^#{1,3} /.test(l) || l.startsWith('```') || l.startsWith('- ') ||
          /^\d+\. /.test(l) || l.trim() === '---') break
      paraLines.push(l)
      i++
    }
    if (paraLines.length) blocks.push({ type: 'p', text: paraLines.join('\n') })
  }

  return blocks
}

const codeStyle = {
  background: 'rgba(26, 24, 20, 0.7)',
  border: '1px solid rgba(184, 134, 11, 0.15)',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  margin: '0.5rem 0 0.75rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  lineHeight: 1.7,
  color: 'var(--brass)',
  overflowX: 'auto',
  whiteSpace: 'pre',
}

function renderBlock(block, idx) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={idx} style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--stone-text)',
          marginTop: '2rem',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid rgba(184, 134, 11, 0.15)',
        }}>{inlineFormat(block.text)}</h2>
      )
    case 'h3':
      return (
        <h3 key={idx} style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--stone-text)',
          marginTop: '1.5rem',
          marginBottom: '0.4rem',
        }}>{inlineFormat(block.text)}</h3>
      )
    case 'hr':
      return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(184,134,11,0.12)', margin: '1.5rem 0' }} />
    case 'code':
      return <pre key={idx} style={codeStyle}>{block.text}</pre>
    case 'ul':
      return (
        <ul key={idx} style={{ margin: '0.5rem 0 0.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {block.items.map((item, ii) => (
            <li key={ii} style={{ color: 'var(--stone-text-dim)', fontSize: '0.95rem', lineHeight: 1.7 }}>{inlineFormat(item)}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={idx} style={{ margin: '0.5rem 0 0.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {block.items.map((item, ii) => (
            <li key={ii} style={{ color: 'var(--stone-text-dim)', fontSize: '0.95rem', lineHeight: 1.7 }}>{inlineFormat(item)}</li>
          ))}
        </ol>
      )
    case 'p':
      return (
        <p key={idx} style={{
          color: 'var(--stone-text-dim)',
          fontSize: '0.95rem',
          lineHeight: 1.8,
          marginBottom: '0.75rem',
        }}>{inlineFormat(block.text)}</p>
      )
    default:
      return null
  }
}

export default function ForkSkillClient({ content, shortId }) {
  const [copied, setCopied] = useState(false)
  const blocks = parseMarkdown(content)

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
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          marginBottom: '2.5rem',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'var(--stone-text)',
              }}>Skill Fork</h1>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--stone-text-dim)',
                marginTop: '0.3rem',
              }}>{shortId}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              <a
                href={`/q/${shortId}`}
                style={{
                  color: 'var(--brass-dim)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                }}
                target="_blank" rel="noreferrer"
              >
                View capsule →
              </a>
              <button className={`brass-btn ${copied ? 'copied' : ''}`} onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
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
        </div>

        {/* Rendered content */}
        <div>
          {blocks.map((block, idx) => renderBlock(block, idx))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--stone-text-dim)', fontFamily: 'var(--font-mono)' }}>
            Your personalized Memory Palace skill. Fetch this URL at the start of each session.
          </p>
        </div>

      </div>
    </div>
  )
}
