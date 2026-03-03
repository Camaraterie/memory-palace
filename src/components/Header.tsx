import Link from 'next/link'
import { createClient } from '../../utils/supabase/server'
import { NavLink, AtomIcon } from './HeaderClient'

function BookIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ToolIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function RssIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

export default function Header() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0.75rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(48, 44, 40, 0.9)',
      borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    }}>
      {/* Brand */}
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        color: '#f0ede6',
      }}>
        <AtomIcon />
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            lineHeight: 1,
            color: 'var(--stone-text)',
          }}>
            Memory Palace
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            color: 'var(--brass)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            lineHeight: 1,
            marginTop: '0.2rem',
          }}>
            Infrastructure for AI Recall
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <div className="nav-links-desktop" style={{ display: 'flex', gap: '0.5rem' }}>
          <NavLink href="/faq" icon={<HelpIcon />}>FAQ</NavLink>
          <NavLink href="/troubleshoot" icon={<ToolIcon />}>Troubleshoot</NavLink>
          <NavLink href="/docs" icon={<BookIcon />}>Docs</NavLink>
          <NavLink href="/blog" icon={<RssIcon />}>Blog</NavLink>
        </div>
        
        <div style={{ width: '1px', height: '1.5rem', background: 'rgba(184, 134, 11, 0.2)', margin: '0 0.5rem' }}></div>
        
        <Link
          href="/login"
          className="stone-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            transition: 'all 0.2s',
            boxShadow: '0 2px 10px rgba(184, 134, 11, 0.25)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Login
        </Link>
      </div>
    </nav>
  )
}
