'use server'
 

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function saveProfile(data: { name: string, matric_number: string, institution_id: string, course: string, level: number, target_graduation_units?: number | null, referredBy?: string | null }) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Authentication failed. Please log in again.' }
  }

  // The client now passes the exact institution UUID
  if (!data.institution_id) {
    return { error: 'Invalid institution selected.' }
  }

  const { error: rpcError } = await (supabase as any).rpc('save_profile', {
    p_name: data.name,
    p_matric: data.matric_number,
    p_institution: data.institution_id,
    p_course: data.course,
    p_level: data.level
  });

  if (rpcError) {
    return { error: 'Error saving profile: ' + rpcError.message };
  }

  if (data.target_graduation_units) {
    await (supabase as any).from('students').update({ target_graduation_units: data.target_graduation_units }).eq('user_id', user.id);
  }

  redirect('/dashboard')
}
