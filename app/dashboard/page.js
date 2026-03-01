import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createPalace } from './actions'
import { signout } from '../login/actions'

export default async function Dashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch palaces with a count of memories and the latest memory image
    const { data: palaces } = await supabase
        .from('palaces')
        .select(`
            id,
            name,
            created_at,
            memories (
                image_url
            )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    // Process palaces to get count and latest image
    const processedPalaces = palaces?.map(p => {
        const memoryCount = p.memories?.length || 0
        const latestImage = p.memories && p.memories.length > 0
            ? p.memories[0].image_url
            : null
        return {
            ...p,
            memoryCount,
            latestImage
        }
    })

    return (
        <div className="stone-surface" style={{ minHeight: '100vh' }}>
            <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', gap: '1.5rem' }}>
                    <div>
                        <div style={{
                            fontSize: '0.625rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--brass)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em',
                            marginBottom: '0.75rem',
                        }}>
                            RECONSTRUCTED DOMAINS
                        </div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            fontWeight: 300,
                            letterSpacing: '-0.01em',
                            color: 'var(--stone-text)',
                        }}>Your Memory Palaces</h1>
                    </div>
                    <form action={signout}>
                        <button style={{
                            fontSize: '0.625rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--stone-text-dim)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--brass-dim)',
                            paddingBottom: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}>
                            Terminate Session
                        </button>
                    </form>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2rem',
                }}>
                    {processedPalaces?.map((palace) => (
                        <Link
                            key={palace.id}
                            href={`/dashboard/${palace.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="stone-card" style={{
                                padding: 0,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}>
                                <div style={{
                                    aspectRatio: '16/9',
                                    position: 'relative',
                                    background: 'var(--stone-dark)',
                                    overflow: 'hidden',
                                    borderBottom: '1px solid rgba(184, 134, 11, 0.1)',
                                }}>
                                    {palace.latestImage ? (
                                        <Image
                                            src={palace.latestImage}
                                            alt=""
                                            fill
                                            style={{ objectFit: 'cover', opacity: 0.7, transition: 'all 0.7s' }}
                                        />
                                    ) : (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--brass-dim)',
                                        }}>
                                            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '1rem',
                                        background: 'linear-gradient(to top, var(--stone-dark), transparent)',
                                    }}>
                                        <div style={{
                                            fontSize: '0.625rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: 'var(--brass)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                        }}>
                                            {palace.memoryCount} {palace.memoryCount === 1 ? 'Memory' : 'Memories'} Encoded
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '1.5rem',
                                        color: 'var(--stone-text)',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {palace.name || 'Unnamed Palace'}
                                    </h2>
                                    <p style={{
                                        fontSize: '0.625rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--stone-text-dim)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.15em',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginBottom: '1rem',
                                    }}>
                                        ID: {palace.id}
                                    </p>
                                    <div style={{
                                        fontSize: '0.625rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--brass)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.2em',
                                    }}>
                                        Enter Domain &rarr;
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Create New Palace Card */}
                    <form action={createPalace}>
                        <div className="stone-card" style={{
                            padding: '2.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                            border: '1.5px dashed var(--brass-dim)',
                            background: 'rgba(58, 54, 50, 0.3)',
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                border: '1px solid var(--brass-dim)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem',
                            }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--brass)' }}>+</span>
                            </div>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Architect New Domain..."
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--brass-dim)',
                                    textAlign: 'center',
                                    marginBottom: '1.5rem',
                                    outline: 'none',
                                    width: '100%',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.1rem',
                                    color: 'var(--stone-text)',
                                    paddingBottom: '0.5rem',
                                }}
                            />
                            <button className="stone-btn" style={{ fontSize: '0.75rem', padding: '0.5rem 1.5rem' }}>
                                Create Palace
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
