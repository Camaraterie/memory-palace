'use client'

const DOCS = [
    {
        id: 'skill',
        title: 'The Skill File',
        url: 'https://m.cuer.ai/skill',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/memory-palace-skill.md',
        description: 'The foundation of the system. Give this markdown file to any agent to enable Memory Palace commands.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        id: 'onboard',
        title: 'Agent Onboarding',
        url: 'https://m.cuer.ai/onboard',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/memory-palace-onboard.md',
        description: 'First-time setup guide. Helps agents probe their environment and select the correct fork template.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
        ),
    },
    {
        id: 'faq',
        title: 'FAQ',
        url: 'https://m.cuer.ai/faq',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/app/api/faq/route.js',
        description: 'Answers to common questions about memory fidelity, security, and character consistency.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    },
    {
        id: 'troubleshoot',
        title: 'Troubleshooting',
        url: 'https://m.cuer.ai/troubleshoot',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/app/api/troubleshoot/route.js',
        description: 'Fixes for 403 errors, distorted QR codes, and capability mismatches.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
    {
        id: 'llms',
        title: 'llms.txt',
        url: 'https://m.cuer.ai/llms.txt',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/llms.txt',
        description: 'Compact summary for LLMs and web agents crawling the site.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
    },
    {
        id: 'llms-full',
        title: 'llms-full.txt',
        url: 'https://m.cuer.ai/llms-full.txt',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/llms-full.txt',
        description: 'Full API reference and schema details for developers and high-capability agents.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
]

export default function DocsClient() {
    return (
        <div className="stone-surface" style={{
            minHeight: '100vh',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
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
                    }}>Documentation</h1>
                    <p style={{
                        color: 'var(--stone-text-dim)',
                        marginTop: '0.75rem',
                        fontSize: '1rem',
                        lineHeight: 1.7,
                    }}>
                        Guides and API reference for AI agents. AI Studio users should use the{' '}
                        <strong style={{ color: 'var(--brass)' }}>GitHub Raw</strong> links to avoid URL blocking.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {DOCS.map(doc => (
                        <div key={doc.id} className="stone-card" style={{
                            display: 'grid',
                            gridTemplateColumns: '2.5rem 1fr',
                            gap: '1.25rem',
                            alignItems: 'start',
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '8px',
                                border: '1px solid rgba(184, 134, 11, 0.2)',
                                background: 'rgba(184, 134, 11, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {doc.icon}
                            </div>
                            <div>
                                <h2 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.35rem',
                                    fontWeight: 600,
                                    color: 'var(--stone-text)',
                                    marginBottom: '0.4rem',
                                }}>{doc.title}</h2>
                                <p style={{
                                    color: 'var(--stone-text-dim)',
                                    lineHeight: 1.6,
                                    fontSize: '0.9rem',
                                    marginBottom: '1.25rem',
                                }}>{doc.description}</p>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <a href={doc.url} className="stone-btn" style={{
                                        padding: '0.4rem 1rem',
                                        fontSize: '0.75rem',
                                    }}>
                                        Standard URL
                                    </a>
                                    <a href={doc.raw} className="brass-btn" style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.4rem 1rem',
                                        fontSize: '0.7rem',
                                        textDecoration: 'none',
                                    }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                        GitHub Raw
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: '3rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(184, 134, 11, 0.1)',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--stone-text-dim)' }}>
                        <a href="/faq" style={{ color: 'var(--brass)', textDecoration: 'none' }}>FAQ</a>
                        {' '}&middot;{' '}
                        <a href="/troubleshoot" style={{ color: 'var(--brass)', textDecoration: 'none' }}>Troubleshoot</a>
                        {' '}&middot;{' '}
                        <a href="/skill" style={{ color: 'var(--brass)', textDecoration: 'none' }}>Skill file</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
