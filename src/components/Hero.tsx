'use client'

import HeroComic from './HeroComic'

function NeuralOverlay() {
  const nodes = [
    { cx: 120, cy: 80, delay: 0 },
    { cx: 280, cy: 140, delay: 0.5 },
    { cx: 420, cy: 60, delay: 1 },
    { cx: 180, cy: 240, delay: 1.5 },
    { cx: 350, cy: 200, delay: 0.8 },
    { cx: 500, cy: 120, delay: 1.2 },
    { cx: 60, cy: 180, delay: 0.3 },
    { cx: 440, cy: 280, delay: 1.8 },
    { cx: 240, cy: 320, delay: 0.6 },
    { cx: 560, cy: 220, delay: 1.4 },
    { cx: 100, cy: 340, delay: 0.9 },
    { cx: 380, cy: 360, delay: 1.1 },
  ]

  const edges = [
    [0, 1], [1, 2], [1, 4], [0, 6], [3, 6],
    [4, 5], [3, 8], [7, 4], [8, 10], [5, 9],
    [7, 11], [8, 11], [2, 5], [0, 3],
  ]

  return (
    <div className="neural-overlay">
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].cx} y1={nodes[a].cy}
            x2={nodes[b].cx} y2={nodes[b].cy}
            stroke="var(--brass-dim)"
            strokeWidth="0.5"
            opacity="0.4"
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.cx} cy={n.cy}
            r="2.5"
            fill="var(--brass)"
            opacity="0.3"
          >
            <animate
              attributeName="opacity"
              values="0.15;0.5;0.15"
              dur="3s"
              begin={`${n.delay}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;3.5;2"
              dur="3s"
              begin={`${n.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}

export default function Hero({ copySkill, downloadSkill, copied }) {
  return (
    <section className="hero" style={{ 
      position: 'relative', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      overflow: 'hidden'
    }}>
      <NeuralOverlay />
      
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        maxWidth: '1200px', 
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4rem',
        flexWrap: 'wrap'
      }}>
        
        {/* Left: Content */}
        <div style={{ flex: '1 1 500px', textAlign: 'left' }}>
          <div className="hero-badge" style={{ borderColor: 'var(--brass-dim)', color: 'var(--brass)', background: 'rgba(184,134,11,0.05)' }}>
            <span style={{ background: 'var(--brass)' }}></span>
            Powered by CueR.ai
          </div>

          <h1 className="hero-title" style={{ 
            color: 'var(--stone-text)', 
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            textAlign: 'left',
            margin: '0 0 1.5rem 0'
          }}>
            Elevate Your <em style={{ color: 'var(--gold)' }}>Agent's Mind</em>
          </h1>

          <p className="hero-subtitle" style={{ 
            color: 'var(--stone-text-dim)',
            textAlign: 'left',
            margin: '0 0 2.5rem 0',
            maxWidth: '540px'
          }}>
            Give any AI agent a skill file. It remembers sessions as illustrated images
            with embedded QR codes. One file — universal, lossless, cross-agent memory.
          </p>

          <div className="brass-terminal" style={{ marginBottom: '2.5rem', display: 'flex' }}>
            <span className="prompt">$</span>
            <span>npm i -g mempalace</span>
          </div>

          <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="stone-btn-primary stone-btn" onClick={copySkill}>
              {copied ? 'Copied to clipboard' : 'Copy Skill File'}
            </button>
            <button className="stone-btn" onClick={downloadSkill}>
              Download Skill
            </button>
          </div>
        </div>

        {/* Right: Comic Image Panel */}
        <div style={{ 
          flex: '1 1 400px', 
          display: 'flex', 
          justifyContent: 'center',
          animation: 'float 6s ease-in-out infinite'
        }}>
          <HeroComic />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </section>
  )
}
