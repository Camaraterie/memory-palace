import { createClient } from '../../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import PersonaManager from './PersonaManager'

export default async function PersonaPage({ params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user owns this palace
  const { data: palace } = await supabase
    .from('palaces')
    .select('id, name, owner_id')
    .eq('id', params.palace_id)
    .single()

  if (!palace || palace.owner_id !== user.id) {
    redirect('/dashboard')
  }

  // Fetch personas
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('palace_id', params.palace_id)
    .eq('active', true)
    .order('created_at', { ascending: true })

  return (
    <PersonaManager
      palace={palace}
      initialPersonas={personas || []}
    />
  )
}
