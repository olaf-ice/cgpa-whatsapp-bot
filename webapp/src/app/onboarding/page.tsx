import { createClient } from '@/utils/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const supabase = await createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: institutions, error } = await (supabase as any)
    .from('institutions')
    .select('id, name, type, grading_scale')
    .order('name');
    
  const queryParam = await searchParams;
  const referredBy = queryParam.ref || null;

  return <OnboardingClient institutions={institutions || []} referredBy={referredBy} />
}
