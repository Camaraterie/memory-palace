'use client'

import React from 'react'

// Inline formatting: **bold**, `code`, [text](url), bare URLs
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

export function inlineFormat(text) {
  const lines = text.split('\n')
  if (lines.length === 1) return inlineFormatLine(text)
  return lines.flatMap((line, idx) => {
    const formatted = inlineFormatLine(line)
    return idx < lines.length - 1
      ? [...formatted, <br key={`br${idx}`} />]
      : formatted
  })
}

function parseTableRow(line) {
  if (!line || !line.includes('|')) return []
  return line.split('|').slice(1, -1).map(c => c.trim())
}

export function parseMarkdown(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    // H1 — skip (page has its own title)
    if (/^# [^#]/.test(line)) { i++; continue }

    // H2
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      i++; continue
    }

    // H3
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      i++; continue
    }

    // H4
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: line.slice(5).trim() })
      i++; continue
    }

    // Horizontal rule
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      i++; continue
    }

    // Fenced code block — depth tracking handles nested fences
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

    // Blockquote
    if (line.startsWith('> ') || line === '>') {
      const quoteLines = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^> ?/, ''))
        i++
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') })
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines.filter(l => !/^\|[\s\-:|]+\|$/.test(l.trim()))
      const headers = parseTableRow(rows[0] || '')
      const bodyRows = rows.slice(1).map(parseTableRow)
      blocks.push({ type: 'table', headers, rows: bodyRows })
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Paragraph
    const paraLines = []
    while (i < lines.length) {
      const l = lines[i]
      if (!l.trim()) { i++; break }
      if (/^#{1,4} /.test(l) || l.startsWith('```') || l.startsWith('> ') || l === '>' ||
          l.startsWith('|') || l.startsWith('- ') || /^\d+\. /.test(l) || l.trim() === '---') break
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

const listItemStyle = {
  color: 'var(--stone-text-dim)',
  fontSize: '0.95rem',
  lineHeight: 1.7,
}

export function renderBlock(block, idx) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={idx} style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.35rem',
          fontWeight: 600,
          color: 'var(--stone-text)',
          marginTop: '2.25rem',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid rgba(184, 134, 11, 0.15)',
        }}>{inlineFormat(block.text)}</h2>
      )
    case 'h3':
      return (
        <h3 key={idx} style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--stone-text)',
          marginTop: '1.75rem',
          marginBottom: '0.5rem',
        }}>{inlineFormat(block.text)}</h3>
      )
    case 'h4':
      return (
        <h4 key={idx} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--brass)',
          marginTop: '1.25rem',
          marginBottom: '0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>{inlineFormat(block.text)}</h4>
      )
    case 'hr':
      return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(184,134,11,0.12)', margin: '2rem 0' }} />
    case 'code':
      return (
        <div key={idx} className="brass-code-viewer" style={{ margin: '1rem 0' }}>
          {block.lang && (
            <div className="viewer-header">
              <span>{block.lang}</span>
            </div>
          )}
          <pre>{block.text}</pre>
        </div>
      )
    case 'blockquote':
      return (
        <blockquote key={idx} style={{
          margin: '0.75rem 0',
          padding: '0.75rem 1rem',
          borderLeft: '3px solid var(--brass-dim)',
          background: 'rgba(184, 134, 11, 0.05)',
          borderRadius: '0 4px 4px 0',
          color: 'var(--stone-text)',
          fontSize: '0.95rem',
          lineHeight: 1.7,
        }}>{inlineFormat(block.text)}</blockquote>
      )
    case 'ul':
      return (
        <ul key={idx} style={{ margin: '0.5rem 0 0.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {block.items.map((item, ii) => (
            <li key={ii} style={listItemStyle}>{inlineFormat(item)}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={idx} style={{ margin: '0.5rem 0 0.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {block.items.map((item, ii) => (
            <li key={ii} style={listItemStyle}>{inlineFormat(item)}</li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div key={idx} style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr>
                {block.headers.map((cell, ci) => (
                  <th key={ci} style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    color: 'var(--brass)',
                    borderBottom: '1px solid rgba(184, 134, 11, 0.25)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>{inlineFormat(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '0.4rem 0.75rem',
                      color: 'var(--stone-text-dim)',
                      borderBottom: '1px solid rgba(184, 134, 11, 0.08)',
                      lineHeight: 1.5,
                    }}>{inlineFormat(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
