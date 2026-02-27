import { createClient } from '../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import PalaceExplorer from './PalaceExplorer'

export default async function PalacePage({ params }) {
    const { palace_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify ownership
    const { data: palace } = await supabase
        .from('palaces')
        .select('*')
        .eq('id', palace_id)
        .eq('owner_id', user.id)
        .single()

    if (!palace) {
        redirect('/dashboard')
    }

    // Fetch initial memories for SSR
    const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('palace_id', palace_id)
        .order('created_at', { ascending: false })

    return <PalaceExplorer palace={palace} initialMemories={memories} />
}
