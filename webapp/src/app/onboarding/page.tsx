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
  
  const { data: { user } } = await supabase.auth.getUser();
  let existingProfile = null;
  
  if (user) {
    const { data } = await (supabase as any)
      .from('students')
      .select('name, matric_number, course_of_study, institution_id, entry_level, current_level')
      .eq('user_id', user.id)
      .single();
    if (data) {
      existingProfile = data;
    }
  }

  return <OnboardingClient institutions={institutions || []} referredBy={referredBy} existingProfile={existingProfile} />
}
