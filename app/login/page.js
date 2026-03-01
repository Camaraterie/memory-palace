import { login, signup } from './actions'

export default async function LoginPage({ searchParams }) {
    const params = await searchParams
    return (
        <div className="stone-surface" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
        }}>
            <div className="brass-frame-strong" style={{
                width: '100%',
                maxWidth: '24rem',
                padding: '2.5rem',
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 400,
                    textAlign: 'center',
                    marginBottom: '2rem',
                    color: 'var(--stone-text)',
                }}>Memory Palace</h1>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--brass)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '0.4rem',
                            }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                background: 'rgba(26, 24, 20, 0.8)',
                                border: '1px solid var(--brass-dim)',
                                borderRadius: '6px',
                                color: 'var(--stone-text)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.9rem',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--brass)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '0.4rem',
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                background: 'rgba(26, 24, 20, 0.8)',
                                border: '1px solid var(--brass-dim)',
                                borderRadius: '6px',
                                color: 'var(--stone-text)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.9rem',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            formAction={login}
                            className="stone-btn-primary stone-btn"
                            style={{ width: '100%' }}
                        >
                            Log in
                        </button>
                        <button
                            formAction={signup}
                            className="stone-btn"
                            style={{ width: '100%' }}
                        >
                            Sign up
                        </button>
                    </div>

                    {params?.message && (
                        <p style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(217, 74, 74, 0.1)',
                            border: '1px solid rgba(217, 74, 74, 0.2)',
                            borderRadius: '6px',
                            color: 'var(--accent-red)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                        }}>
                            {params.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}
