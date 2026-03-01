'use client'

import { useState, useRef } from 'react'

export default function HeroComic() {
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)')
  const [isEnlarged, setIsEnlarged] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEnlarged) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -5 
    const rotateY = ((x - centerX) / centerX) * 5
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
  }

  const handleMouseLeave = () => {
    if (isEnlarged) return;
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)')
  }

  const toggleEnlarge = () => {
    if (isEnlarged) {
      setIsEnlarged(false)
      setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)')
    } else {
      setIsEnlarged(true)
      setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.5, 1.5, 1.5)')
    }
  }

  const copyImage = async () => {
    try {
      const response = await fetch('/hero-comic.png')
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      setCopiedImage(true)
      setTimeout(() => setCopiedImage(false), 2500)
    } catch (err) {
      console.error('Failed to copy image: ', err)
      alert("Failed to copy image. Your browser might not support this feature.")
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: isEnlarged ? 50 : 1 }}>
      
      {/* Dim overlay when enlarged */}
      {isEnlarged && (
        <div 
          onClick={toggleEnlarge}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: -1,
            cursor: 'zoom-out'
          }}
        />
      )}

      {/* Comic Image Container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={toggleEnlarge}
        style={{
          width: '100%',
          maxWidth: '500px',
          cursor: isEnlarged ? 'zoom-out' : 'zoom-in',
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: transform,
          borderRadius: '12px',
          boxShadow: isEnlarged 
            ? '0 25px 50px -12px rgba(0, 0, 0, 1), 0 0 40px rgba(212, 160, 23, 0.2)' 
            : '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(184, 134, 11, 0.3)',
          background: '#1a1725',
          overflow: 'hidden'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/hero-comic.png" 
          alt="Memory Palace Agent Onboarding Comic" 
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Copy Action Button */}
      <button 
        className={copiedImage ? "stone-btn-primary stone-btn copied" : "stone-btn"}
        onClick={copyImage}
        style={{ 
          fontSize: '0.85rem', 
          padding: '0.6rem 1.5rem',
          transition: 'all 0.2s',
          ...(copiedImage ? {
             background: 'rgba(74, 157, 110, 0.15)',
             borderColor: 'var(--accent-green)',
             color: 'var(--accent-green)'
          } : {})
        }}
      >
        {copiedImage ? '✓ Image Copied' : 'Copy Image for Agent'}
      </button>
    </div>
  )
}
