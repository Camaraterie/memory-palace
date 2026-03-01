'use client'

import Link from 'next/link'

export function NavLink({ href, children, icon }) {
  return (
    <Link
      href={href}
      className="nav-link"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.85rem',
        borderRadius: '6px',
        border: '1px solid rgba(184, 134, 11, 0.12)',
        background: 'rgba(58, 54, 50, 0.4)',
        color: '#b8b3a8',
        textDecoration: 'none',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.65rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </Link>
  )
}

export function AtomIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill="#d4a017" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#b8860b" strokeWidth="1" transform="rotate(0 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#b8860b" strokeWidth="1" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#b8860b" strokeWidth="1" transform="rotate(120 12 12)" />
    </svg>
  )
}
