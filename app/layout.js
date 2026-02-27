import './globals.css'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  title: 'Memory Palace — Visual Memory for AI Agents',
  description: 'A cross-agent visual memory system that stores work sessions as richly detailed images. Give the skill to any agent and it remembers everything.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-between items-center bg-[#07060b]/50 backdrop-blur-md border-b border-[#1a1725]">
          <Link href="/" className="font-serif text-xl tracking-tight text-[#e8e4d9] hover:text-[#c9a84c] transition-colors">
            Memory Palace
          </Link>
          <div className="flex gap-8 items-center">
            <Link href="/dashboard" className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9a9484] hover:text-[#e8e4d9] transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="px-4 py-1.5 bg-[#c9a84c] text-[#07060b] rounded-full text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#e8c65a] transition-all">
              Login
            </Link>
          </div>
        </nav>
        <div className="pt-16">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
