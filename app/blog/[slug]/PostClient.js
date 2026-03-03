'use client'

import { useState } from 'react'
import { parseMarkdown, renderBlock } from '../../../lib/markdown'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PostClient({ post }) {
  const [showSocial, setShowSocial] = useState(false)
  const blocks = parseMarkdown(post.content)
  const hasSocial = post.social_variants && Object.keys(post.social_variants).length > 0
  const hasProvenance = post.show_provenance && post.source_memories && post.source_memories.length > 0

  return (
    <div className="stone-surface" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(184, 134, 11, 0.12)',
        }}>
          <a href="/blog" style={{
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
            Blog
          </a>

          {post.cover_image && (
            <div style={{
              marginTop: '1rem',
              borderRadius: '6px',
              overflow: 'hidden',
              background: 'rgba(26, 24, 20, 0.5)',
            }}>
              <img
                src={post.cover_image}
                alt=""
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </div>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 600,
            marginTop: '1rem',
            color: 'var(--stone-text)',
            lineHeight: 1.2,
          }}>
            {post.title}
          </h1>

          {post.subtitle && (
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              color: 'var(--stone-text-dim)',
              marginTop: '0.5rem',
              lineHeight: 1.5,
            }}>
              {post.subtitle}
            </p>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--brass)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(184, 134, 11, 0.08)',
              padding: '0.2rem 0.5rem',
              borderRadius: '3px',
              border: '1px solid rgba(184, 134, 11, 0.15)',
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

          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {post.tags.map((tag, ti) => (
                <span key={ti} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--brass-dim)',
                  background: 'rgba(184, 134, 11, 0.05)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '3px',
                  border: '1px solid rgba(184, 134, 11, 0.1)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post body */}
        <div>
          {blocks.map((block, idx) => renderBlock(block, idx))}
        </div>

        {/* Provenance section */}
        {hasProvenance && (
          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--brass)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem',
            }}>
              Built from memories
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {post.source_memories.map((memId, mi) => (
                <a
                  key={mi}
                  href={`/q/${memId}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--brass)',
                    textDecoration: 'none',
                    background: 'rgba(184, 134, 11, 0.08)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(184, 134, 11, 0.15)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  /q/{memId}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Social variants */}
        {hasSocial && (
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          }}>
            <button
              onClick={() => setShowSocial(!showSocial)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--brass)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showSocial ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Social variants
            </button>
            {showSocial && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(post.social_variants).map(([platform, text]) => (
                  <div key={platform}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--brass-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {platform}
                    </span>
                    <pre style={{
                      background: 'rgba(26, 24, 20, 0.7)',
                      border: '1px solid rgba(184, 134, 11, 0.15)',
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                      marginTop: '0.3rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      lineHeight: 1.7,
                      color: 'var(--stone-text-dim)',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {text}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--brass)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}>
              Related Posts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {post.relatedPosts.map(related => (
                <a key={related.slug} href={`/blog/${related.slug}`} style={{
                  textDecoration: 'none',
                  color: 'var(--stone-text)',
                  padding: '1rem',
                  background: 'rgba(26, 24, 20, 0.5)',
                  border: '1px solid rgba(184, 134, 11, 0.15)',
                  borderRadius: '6px',
                  display: 'block'
                }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{related.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--stone-text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(related.published_at)}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        {(post.prevPost || post.nextPost) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          }}>
            <div style={{ flex: 1 }}>
              {post.prevPost && (
                <a href={`/blog/${post.prevPost.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--brass-dim)', marginBottom: '0.25rem' }}>&larr; Previous</div>
                  <div style={{ color: 'var(--stone-text)', fontWeight: 600 }}>{post.prevPost.title}</div>
                </a>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {post.nextPost && (
                <a href={`/blog/${post.nextPost.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--brass-dim)', marginBottom: '0.25rem' }}>Next &rarr;</div>
                  <div style={{ color: 'var(--stone-text)', fontWeight: 600 }}>{post.nextPost.title}</div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(184, 134, 11, 0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--stone-text-dim)' }}>
            <a href="/blog" style={{ color: 'var(--brass)', textDecoration: 'none' }}>&larr; All posts</a>
            {' '}&middot;{' '}
            <a href="/api/blog/feed" style={{ color: 'var(--brass)', textDecoration: 'none' }}>RSS Feed</a>
            {' '}&middot;{' '}
            <a href="/docs" style={{ color: 'var(--brass)', textDecoration: 'none' }}>Docs</a>
          </p>
        </div>

      </div>
    </div>
  )
}
