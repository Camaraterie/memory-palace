'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function PalaceExplorer({ palace, initialMemories }) {
    const [view, setView] = useState('gallery') // gallery, timeline, state
    const [selectedMemory, setSelectedMemory] = useState(null)
    const [palaceData, setPalaceData] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchPalaceData = async () => {
            setLoading(true)
            try {
                // We use the palace.id as the auth token for the API
                const res = await fetch(`/api/palace?auth=${palace.id}`)
                const data = await res.json()
                if (data.success) {
                    setPalaceData(data)
                }
            } catch (err) {
                console.error('Failed to fetch palace data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchPalaceData()
    }, [palace.id])

    // Merge initial server-side memories with live API data if available
    const memories = palaceData?.chain || initialMemories?.map(m => ({
        short_id: m.short_id,
        agent: m.agent,
        summary: m.session_name,
        created_at: m.created_at,
        image_url: m.image_url,
        room: m.status // status field in DB often holds the room
    }))

    return (
        <div className="min-h-screen bg-[#07060b] text-[#e8e4d9]">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Header */}
                <header className="mb-12 border-b border-[#1a1725] pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <Link href="/dashboard" className="text-[#9a9484] hover:text-[#c9a84c] text-xs font-mono mb-4 inline-flex items-center gap-2 transition-colors uppercase tracking-[0.2em]">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Palaces
                            </Link>
                            <h1 className="text-4xl md:text-5xl font-serif font-light text-[#e8e4d9] mb-2 tracking-tight">
                                {palace.name || 'Unnamed Palace'}
                            </h1>
                            <div className="flex flex-wrap gap-4 items-center mt-3">
                                <span className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest bg-[#16131f] px-2 py-1 rounded border border-[#1a1725]">
                                    ID: {palace.id}
                                </span>
                                {palaceData?.repo && (
                                    <a href={palaceData.repo} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#4a7fd9] hover:underline uppercase tracking-widest flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                        Source Repository
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex bg-[#0f0d16] p-1 rounded-lg border border-[#1a1725] self-end md:self-center">
                            {['gallery', 'timeline', 'state'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-4 py-2 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${
                                        view === v 
                                            ? 'bg-[#c9a84c] text-[#07060b] font-bold shadow-lg shadow-[#c9a84c]/10' 
                                            : 'text-[#5a5650] hover:text-[#9a9484]'
                                    }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="min-h-[50vh]">
                    {view === 'gallery' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {memories?.map((memory) => (
                                <div 
                                    key={memory.short_id} 
                                    onClick={() => setSelectedMemory(memory)}
                                    className="group cursor-pointer bg-[#0f0d16] border border-[#1a1725] rounded-xl overflow-hidden transition-all hover:border-[#c9a84c]/30 hover:shadow-2xl hover:shadow-[#c9a84c]/5"
                                >
                                    <div className="aspect-square relative bg-[#07060b] overflow-hidden">
                                        {memory.image_url ? (
                                            <Image
                                                src={memory.image_url}
                                                alt={memory.summary || 'Memory'}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-[#5a5650] font-mono text-[10px] uppercase tracking-tighter">
                                                No Visual Encoded
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-[#07060b]/80 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-[#c9a84c] border border-[#c9a84c]/20">
                                            {memory.short_id}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest mb-2 flex justify-between">
                                            <span>{memory.agent}</span>
                                            <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-serif text-lg text-[#e8e4d9] line-clamp-2 leading-snug group-hover:text-[#c9a84c] transition-colors">
                                            {memory.summary || 'Untitled Session'}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'timeline' && (
                        <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {memories?.map((memory, idx) => (
                                <div 
                                    key={memory.short_id}
                                    onClick={() => setSelectedMemory(memory)}
                                    className="relative flex gap-6 p-4 rounded-xl border border-[#1a1725] bg-[#0f0d16] cursor-pointer hover:border-[#c9a84c]/30 transition-all group"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full mt-2 z-10 transition-colors ${idx === 0 ? 'bg-[#c9a84c] shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'bg-[#1a1725] group-hover:bg-[#c9a84c]/50'}`}></div>
                                        {idx !== memories.length - 1 && (
                                            <div className="w-[1px] flex-grow bg-[#1a1725] my-2"></div>
                                        )}
                                    </div>
                                    <div className="flex-grow pb-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-serif text-xl text-[#e8e4d9] group-hover:text-[#c9a84c] transition-colors">
                                                {memory.summary}
                                            </h4>
                                            <span className="text-[10px] font-mono text-[#5a5650]">{new Date(memory.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <span className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-widest px-2 py-0.5 rounded bg-[#c9a84c]/5 border border-[#c9a84c]/10">
                                                {memory.agent}
                                            </span>
                                            {memory.room && (
                                                <span className="text-[10px] font-mono text-[#4a7fd9] uppercase tracking-widest">
                                                    in {memory.room}
                                                </span>
                                            )}
                                            {memory.outcome && (
                                                <span className={`text-[10px] font-mono uppercase tracking-widest ${
                                                    memory.outcome === 'succeeded' ? 'text-[#4a9d6e]' : 'text-[#d94a4a]'
                                                }`}>
                                                    • {memory.outcome}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-[#1a1725] shrink-0 grayscale group-hover:grayscale-0 transition-all">
                                        {memory.image_url ? (
                                            <Image src={memory.image_url} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="bg-[#07060b] w-full h-full"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'state' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="lg:col-span-2 space-y-12">
                                <section>
                                    <h2 className="text-xs font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                                        Open Next Steps
                                        <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/30 to-transparent"></div>
                                    </h2>
                                    <div className="space-y-3">
                                        {palaceData?.open_next_steps?.length > 0 ? (
                                            palaceData.open_next_steps.map((step, i) => (
                                                <div key={i} className="p-4 bg-[#0f0d16] border border-[#1a1725] rounded-lg font-serif text-[#9a9484] flex gap-4">
                                                    <span className="text-[#c9a84c] font-mono">{(i+1).toString().padStart(2, '0')}</span>
                                                    {step}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center bg-[#0f0d16]/30 border border-[#1a1725] border-dashed rounded-xl text-[#5a5650] font-mono text-xs uppercase tracking-widest">
                                                No pending directives.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-xs font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                                        Rooms Topology
                                        <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/30 to-transparent"></div>
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.entries(palaceData?.rooms || {}).length > 0 ? (
                                            Object.entries(palaceData.rooms).map(([name, data]) => (
                                                <div key={name} className="p-5 bg-[#0f0d16] border border-[#1a1725] rounded-xl group hover:border-[#c9a84c]/30 transition-all">
                                                    <h4 className="font-mono text-[10px] text-[#c9a84c] uppercase tracking-widest mb-2">{name}</h4>
                                                    <p className="text-sm text-[#9a9484] leading-relaxed italic">{data.description || 'No domain description encoded.'}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 p-12 text-center bg-[#0f0d16]/30 border border-[#1a1725] border-dashed rounded-xl text-[#5a5650] font-mono text-xs uppercase tracking-widest">
                                                Spacial domains not yet defined.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-12">
                                <section>
                                    <h2 className="text-xs font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                                        Active Agents
                                        <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/30 to-transparent"></div>
                                    </h2>
                                    <div className="bg-[#0f0d16] border border-[#1a1725] rounded-xl overflow-hidden divide-y divide-[#1a1725]">
                                        {(palaceData?.agents || []).map((agent, i) => (
                                            <div key={i} className="p-4 flex items-center gap-4 group">
                                                <div className="w-2 h-2 rounded-full bg-[#4a9d6e] shadow-[0_0_8px_rgba(74,157,110,0.4)] group-hover:scale-125 transition-transform"></div>
                                                <div>
                                                    <div className="font-mono text-xs text-[#e8e4d9] uppercase tracking-wider">{agent.name}</div>
                                                    <div className="text-[10px] text-[#5a5650] font-mono uppercase tracking-tighter mt-0.5">{agent.permissions} • joined {new Date(agent.joined).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="p-6 bg-[#c9a84c]/5 border border-[#c9a84c]/10 rounded-2xl">
                                    <div className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-widest mb-4">Palace Stats</div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-2xl font-serif text-[#e8e4d9]">{memories?.length || 0}</div>
                                            <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-tighter">Total Memories</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-serif text-[#e8e4d9]">{Object.keys(palaceData?.rooms || {}).length}</div>
                                            <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-tighter">Rooms Defined</div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Memory Detail Modal */}
            {selectedMemory && (
                <MemoryDetail 
                    shortId={selectedMemory.short_id} 
                    onClose={() => setSelectedMemory(null)} 
                />
            )}
        </div>
    )
}

function MemoryDetail({ shortId, onClose }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/q/${shortId}`)
                const json = await res.json()
                setData(json)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [shortId])

    const payload = data?.payload || {}

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#07060b]/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0f0d16] border border-[#1a1725] w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
                {/* Close Button Mobile (Absolute) */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 md:hidden text-[#5a5650] hover:text-[#e8e4d9]"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex justify-between items-center p-6 md:px-10 border-b border-[#1a1725] bg-[#16131f]/50 backdrop-blur-sm">
                    <div>
                        <div className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-1">
                            MEMORY CAPSULE • {shortId}
                        </div>
                        <h2 className="text-xl md:text-3xl font-serif font-light text-[#e8e4d9]">
                            {loading ? 'Initializing Reciprocal Buffer...' : (payload.session_name || 'Untitled Session')}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="hidden md:flex p-2 text-[#5a5650] hover:text-[#e8e4d9] transition-colors border border-transparent hover:border-[#1a1725] rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 md:p-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="w-12 h-12 border-2 border-[#c9a84c]/10 border-t-[#c9a84c] rounded-full animate-spin"></div>
                            <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest">Scanning Ciphertext...</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            {/* Meta Sidebar */}
                            <div className="md:col-span-4 space-y-8">
                                <div className="aspect-square relative rounded-2xl overflow-hidden border border-[#1a1725] bg-[#07060b] shadow-xl shadow-black/40">
                                    {payload.image_url ? (
                                        <Image src={payload.image_url} alt="" fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-[#5a5650] font-mono text-[10px] uppercase tracking-[0.2em] text-center p-8">
                                            No Visual Projection Encoded
                                        </div>
                                    )}
                                </div>

                                <div className="divide-y divide-[#1a1725] border-t border-b border-[#1a1725]">
                                    <div className="py-4">
                                        <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest mb-1">Agent Character</div>
                                        <div className="text-sm font-serif text-[#e8e4d9] flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#c9a84c]"></div>
                                            {data.agent}
                                        </div>
                                    </div>
                                    <div className="py-4">
                                        <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest mb-1">Observation Date</div>
                                        <div className="text-sm font-serif text-[#e8e4d9]">{new Date(data.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="py-4">
                                        <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest mb-1">Session Outcome</div>
                                        <div className={`text-xs font-mono uppercase tracking-widest flex items-center gap-2 ${
                                            payload.outcome === 'succeeded' ? 'text-[#4a9d6e]' : 'text-[#d94a4a]'
                                        }`}>
                                            <span className="text-lg">●</span>
                                            {payload.outcome || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="md:col-span-8 space-y-12 pb-12">
                                <section>
                                    <h3 className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        Narrative Context
                                        <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/20 to-transparent"></div>
                                    </h3>
                                    <p className="text-[#9a9484] leading-relaxed font-serif text-lg italic">
                                        {payload.conversation_context || 'Historical context unavailable.'}
                                    </p>
                                </section>

                                {payload.built?.length > 0 && (
                                    <section>
                                        <h3 className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            Artifacts Constructed
                                            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/20 to-transparent"></div>
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {payload.built.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 text-[#e8e4d9] bg-[#16131f]/50 p-3 rounded-lg border border-[#1a1725] group hover:border-[#c9a84c]/20 transition-all">
                                                    <span className="text-[#c9a84c] font-mono text-xs">◈</span>
                                                    <span className="text-sm font-mono tracking-tight">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.decisions?.length > 0 && (
                                    <section>
                                        <h3 className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            Architectural Decisions
                                            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/20 to-transparent"></div>
                                        </h3>
                                        <div className="space-y-4">
                                            {payload.decisions.map((decision, i) => (
                                                <div key={i} className="relative p-5 bg-[#07060b] border border-[#1a1725] rounded-xl text-sm text-[#9a9484] leading-relaxed">
                                                    <span className="absolute -top-3 -left-1 text-3xl text-[#1a1725] font-serif leading-none">"</span>
                                                    {decision}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.next_steps?.length > 0 && (
                                    <section>
                                        <h3 className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            Future Directives
                                            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/20 to-transparent"></div>
                                        </h3>
                                        <div className="space-y-3">
                                            {payload.next_steps.map((step, i) => (
                                                <div key={i} className="flex gap-4 text-sm text-[#e8e4d9] p-4 bg-[#c9a84c]/5 rounded-xl border border-[#c9a84c]/10">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-[10px] font-mono text-[#c9a84c]">
                                                        {i + 1}
                                                    </div>
                                                    <span className="leading-tight">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.files?.length > 0 && (
                                    <section>
                                        <h3 className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            Modified Symbols
                                            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#c9a84c]/20 to-transparent"></div>
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {payload.files.map((file, i) => (
                                                <code key={i} className="px-2 py-1 bg-[#16131f] border border-[#1a1725] rounded text-[10px] font-mono text-[#4a7fd9] hover:text-[#e8e4d9] transition-colors cursor-default">
                                                    {file}
                                                </code>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {payload.blockers?.length > 0 && (
                                    <section className="p-6 bg-[#d94a4a]/5 border border-[#d94a4a]/20 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 text-[#d94a4a]/20 group-hover:text-[#d94a4a]/40 transition-colors">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                        <h3 className="text-[10px] font-mono text-[#d94a4a] uppercase tracking-[0.3em] mb-4">Critical Impasse</h3>
                                        <ul className="space-y-2">
                                            {payload.blockers.map((blocker, i) => (
                                                <li key={i} className="text-sm text-[#d94a4a] flex gap-3 leading-snug">
                                                    <span className="font-bold">!</span> {blocker}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-6 border-t border-[#1a1725] bg-[#16131f]/50 backdrop-blur-sm flex justify-between items-center">
                    <div className="text-[10px] font-mono text-[#5a5650] uppercase tracking-widest hidden md:block">
                        Secure Handoff Protocol Active
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <a 
                            href={`/q/${shortId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none text-center px-6 py-2 border border-[#1a1725] rounded-full text-[10px] font-mono text-[#9a9484] hover:text-[#c9a84c] hover:border-[#c9a84c]/30 transition-all uppercase tracking-widest"
                        >
                            JSON Ledger
                        </a>
                        <button 
                            onClick={onClose}
                            className="flex-1 md:flex-none text-center px-8 py-2 bg-[#c9a84c] text-[#07060b] rounded-full text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#e8c65a] transition-all shadow-lg shadow-[#c9a84c]/20"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
