'use client'

const DOCS = [
    {
        id: 'skill',
        title: 'The Skill File',
        url: 'https://m.cuer.ai/skill',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/memory-palace-skill.md',
        description: 'The foundation of the system. Give this markdown file to any agent to enable Memory Palace commands.',
    },
    {
        id: 'onboard',
        title: 'Agent Onboarding',
        url: 'https://m.cuer.ai/onboard',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/memory-palace-onboard.md',
        description: 'First-time setup guide. Helps agents probe their environment and select the correct fork template.',
    },
    {
        id: 'faq',
        title: 'FAQ',
        url: 'https://m.cuer.ai/api/faq',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/app/api/faq/route.js',
        description: 'Answers to common questions about memory fidelity, security, and character consistency.',
    },
    {
        id: 'troubleshoot',
        title: 'Troubleshooting',
        url: 'https://m.cuer.ai/api/troubleshoot',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/app/api/troubleshoot/route.js',
        description: 'Fixes for 403 errors, distorted QR codes, and capability mismatches.',
    },
    {
        id: 'llms',
        title: 'llms.txt',
        url: 'https://m.cuer.ai/llms.txt',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/llms.txt',
        description: 'Compact summary for LLMs and web agents crawling the site.',
    },
    {
        id: 'llms-full',
        title: 'llms-full.txt',
        url: 'https://m.cuer.ai/llms-full.txt',
        raw: 'https://raw.githubusercontent.com/Camaraterie/memory-palace/master/public/llms-full.txt',
        description: 'Full API reference and schema details for developers and high-capability agents.',
    },
]

export default function DocsClient() {
    return (
        <div style={{
            minHeight: '100vh',
            padding: '4rem 2rem',
            maxWidth: '900px',
            margin: '0 auto',
        }}>
            <div style={{ marginBottom: '4rem' }}>
                <a href="/" style={{
                    color: 'var(--gold-dim)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                }}>← Back to Palace</a>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3rem',
                    fontWeight: 400,
                    marginTop: '1rem',
                    color: 'var(--text-primary)',
                }}>Documentation</h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)',
                    marginTop: '1rem',
                    lineHeight: 1.6,
                    maxWidth: '600px',
                }}>
                    Guides and API reference for AI agents. AI Studio users should use the 
                    <strong style={{ color: 'var(--gold)' }}> GitHub Raw</strong> links to avoid URL blocking.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gap: '2rem',
            }}>
                {DOCS.map(doc => (
                    <div key={doc.id} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '2rem',
                        transition: 'border-color 0.2s',
                    }} className="docs-card">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem',
                        }}>
                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.5rem',
                                fontWeight: 400,
                                color: 'var(--gold)',
                            }}>{doc.title}</h2>
                        </div>
                        <p style={{
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            marginBottom: '1.5rem',
                        }}>{doc.description}</p>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                        }}>
                            <a href={doc.url} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                Standard URL
                            </a>
                            <a href={doc.raw} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'rgba(245, 166, 35, 0.2)' }}>
                                GitHub Raw (AI Studio)
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <footer style={{
                marginTop: '6rem',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '0.9rem',
            }}>
                All documentation is served as plain text or markdown for easy consumption by agents.
            </footer>

            <style jsx>{`
                .docs-card:hover {
                    border-color: rgba(245, 166, 35, 0.3) !important;
                }
            `}</style>
        </div>
    )
}
