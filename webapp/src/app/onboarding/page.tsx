import { createClient } from '@/utils/supabase/server'
import OnboardingClient from './OnboardingClient'
import { redirect } from 'next/navigation'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login')
  }
   
  const { data: rawInstitutions, error: _error } = await (supabase as any)
    .from('institutions')
    .select('id, name, type, grading_scale')
    .order('name');

  const institutions = (rawInstitutions || []).map((inst: any) => {
    if (inst.name?.toLowerCase().includes('ibadan') && inst.name?.toLowerCase().includes('university')) {
      return { ...inst, grading_scale: 5.0 }
    }
    return inst
  });
    
  const queryParam = await searchParams;
  const referredBy = queryParam.ref || null;
  
  let existingProfile = null;
  
  const { data } = await (supabase as any)
    .from('students')
    .select('name, matric_number, course_of_study, institution_id, entry_level, current_level, target_graduation_units, is_admin')
    .eq('user_id', user.id)
    .maybeSingle();
  if (data) {
    existingProfile = data;
  }

  return (
    <OnboardingClient 
      institutions={institutions || []} 
      referredBy={referredBy} 
      existingProfile={existingProfile} 
      userEmail={user.email || ''} 
    />
  )
}

