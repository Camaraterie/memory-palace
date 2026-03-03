'use client'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BlogClient({ posts }) {
  return (
    <div className="stone-surface" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

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
          }}>Blog</h1>
          <p style={{
            color: 'var(--stone-text-dim)',
            marginTop: '0.75rem',
            fontSize: '1rem',
            lineHeight: 1.7,
          }}>
            Updates from Memory Palace — infrastructure for AI recall.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p style={{
            color: 'var(--stone-text-dim)',
            fontSize: '0.95rem',
            textAlign: 'center',
            padding: '3rem 0',
          }}>
            No posts yet. Check back soon.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article className="stone-card" style={{
                  padding: '1.5rem',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}>
                  {post.cover_image && (
                    <div style={{
                      marginBottom: '1rem',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      aspectRatio: '16/7',
                      background: 'rgba(26, 24, 20, 0.5)',
                    }}>
                      <img
                        src={post.cover_image}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.6rem',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--brass-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {post.author_persona || 'curator'}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--stone-text-dim)',
                    }}>
                      {formatDate(post.published_at)}
                    </span>
                  </div>

                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--stone-text)',
                    lineHeight: 1.3,
                    marginBottom: '0.3rem',
                  }}>
                    {post.title}
                  </h2>

                  {post.subtitle && (
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      color: 'var(--stone-text-dim)',
                      lineHeight: 1.5,
                      marginBottom: '0.5rem',
                    }}>
                      {post.subtitle}
                    </p>
                  )}

                  {post.excerpt && (
                    <p style={{
                      color: 'var(--stone-text-dim)',
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      marginBottom: '0.75rem',
                    }}>
                      {post.excerpt}
                    </p>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {post.tags.map((tag, ti) => (
                        <span key={ti} style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          color: 'var(--brass)',
                          background: 'rgba(184, 134, 11, 0.08)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '3px',
                          border: '1px solid rgba(184, 134, 11, 0.15)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </a>
            ))}
          </div>
        )}

        {/* Agent-readable section */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(184, 134, 11, 0.1)',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--stone-text-dim)',
            marginBottom: '0.5rem',
          }}>
            Agent access
          </p>
          <div style={{
            background: 'rgba(26, 24, 20, 0.7)',
            border: '1px solid rgba(184, 134, 11, 0.15)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--brass)',
            overflowX: 'auto',
            whiteSpace: 'pre',
            lineHeight: 1.8,
          }}>
{`GET /api/blog/posts              → JSON list of published posts
GET /api/blog/posts/:slug        → single post as JSON
GET /api/blog/feed               → RSS 2.0 feed`}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--stone-text-dim)' }}>
            <a href="/docs" style={{ color: 'var(--brass)', textDecoration: 'none' }}>Docs</a>
            {' '}&middot;{' '}
            <a href="/faq" style={{ color: 'var(--brass)', textDecoration: 'none' }}>FAQ</a>
            {' '}&middot;{' '}
            <a href="/api/blog/feed" style={{ color: 'var(--brass)', textDecoration: 'none' }}>RSS Feed</a>
          </p>
        </div>

      </div>
    </div>
  )
}
