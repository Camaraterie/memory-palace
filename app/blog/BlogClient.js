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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article className="stone-card" style={{
                  display: 'flex',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                  alignItems: 'flex-start',
                }}>
                  {/* Thumbnail on the right */}
                  {post.cover_image && (
                    <div style={{
                      flexShrink: 0,
                      width: '120px',
                      height: '120px',
                      borderRadius: '4px',
                      border: '2px solid var(--brass-dim)',
                      background: 'var(--stone-dark)',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(184, 134, 11, 0.15)',
                    }}>
                      <img
                        src={post.cover_image}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          imageRendering: 'pixelated',
                        }}
                      />
                    </div>
                  )}

                  {/* Text content on the left */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        color: 'var(--brass-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}>
                        {post.author_persona || 'curator'}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        color: 'var(--stone-text-dim)',
                      }}>
                        {formatDate(post.published_at)}
                      </span>
                    </div>

                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--stone-text)',
                      lineHeight: 1.3,
                      marginBottom: '0.25rem',
                    }}>
                      {post.title}
                    </h2>

                    {post.subtitle && (
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.9rem',
                        color: 'var(--stone-text-dim)',
                        lineHeight: 1.4,
                        marginBottom: '0.5rem',
                      }}>
                        {post.subtitle}
                      </p>
                    )}

                    {post.excerpt && (
                      <p style={{
                        color: 'var(--stone-text-dim)',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        marginBottom: '0.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {post.excerpt}
                      </p>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {post.tags.map((tag, ti) => (
                          <span key={ti} style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.6rem',
                            color: 'var(--brass)',
                            background: 'rgba(184, 134, 11, 0.08)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px',
                            border: '1px solid rgba(184, 134, 11, 0.15)',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
