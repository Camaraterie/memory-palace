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
        <div className="min-h-screen bg-[#07060b] text-[#e8e4d9]">
            <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                    <div>
                        <div className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-3">
                            RECONSTRUCTED DOMAINS
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight">Your Memory Palaces</h1>
                    </div>
                    <form action={signout}>
                        <button className="text-[10px] font-mono text-[#5a5650] hover:text-[#c9a84c] uppercase tracking-widest transition-colors border-b border-[#1a1725] hover:border-[#c9a84c] pb-1">
                            Terminate Session
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {processedPalaces?.map((palace) => (
                        <Link
                            key={palace.id}
                            href={`/dashboard/${palace.id}`}
                            className="group block bg-[#0f0d16] border border-[#1a1725] rounded-2xl overflow-hidden hover:border-[#c9a84c]/30 transition-all hover:shadow-2xl hover:shadow-[#c9a84c]/5"
                        >
                            <div className="aspect-[16/9] relative bg-[#07060b] overflow-hidden border-b border-[#1a1725]">
                                {palace.latestImage ? (
                                    <Image
                                        src={palace.latestImage}
                                        alt=""
                                        fill
                                        className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[#1a1725]">
                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#07060b] to-transparent">
                                    <div className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-widest">
                                        {palace.memoryCount} {palace.memoryCount === 1 ? 'Memory' : 'Memories'} Encoded
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <h2 className="text-2xl font-serif text-[#e8e4d9] mb-2 group-hover:text-[#c9a84c] transition-colors">
                                    {palace.name || 'Unnamed Palace'}
                                </h2>
                                <p className="text-[#5a5650] text-[10px] font-mono uppercase tracking-widest truncate mb-4">
                                    ID: {palace.id}
                                </p>
                                <div className="flex items-center text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                    Enter Domain →
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Create New Palace Card */}
                    <form action={createPalace} className="bg-[#0f0d16]/30 border border-[#1a1725] border-dashed rounded-2xl p-8 flex flex-col justify-center items-center h-full min-h-[300px] hover:bg-[#0f0d16]/50 hover:border-[#c9a84c]/30 transition-all group">
                        <div className="w-12 h-12 rounded-full border border-[#1a1725] flex items-center justify-center mb-6 group-hover:border-[#c9a84c]/30 transition-all">
                            <span className="text-2xl font-light text-[#5a5650] group-hover:text-[#c9a84c]">+</span>
                        </div>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="Architect New Domain..."
                            className="bg-transparent border-b border-[#1a1725] text-center mb-6 focus:outline-none focus:border-[#c9a84c] w-full font-serif text-lg text-[#e8e4d9] placeholder-[#5a5650]"
                        />
                        <button className="px-6 py-2 bg-[#16131f] border border-[#1a1725] hover:border-[#c9a84c]/30 rounded-full text-[10px] font-mono text-[#9a9484] hover:text-[#c9a84c] uppercase tracking-widest transition-all">
                            Create Palace
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
