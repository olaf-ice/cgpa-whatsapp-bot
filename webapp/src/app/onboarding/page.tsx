import { createClient } from '@/utils/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: institutions, error } = await (supabase as any)
    .from('institutions')
    .select('id, name, type, grading_scale')
    .order('name');
    
  return <OnboardingClient institutions={institutions || []} />
}
