'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function saveProfile(data: { name: string, institution: string, course: string, level: number }) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Authentication failed. Please log in again.' }
  }

  const instMap: Record<string, string> = {
    'ui': 'University of Ibadan (UI)',
    'unilag': 'University of Lagos (UNILAG)',
    'yabatech': 'Yaba College of Technology (YABATECH)'
  };
  
  const realName = instMap[data.institution] || 'University of Ibadan (UI)';

  const { data: instData, error: instError } = await (supabase as any)
    .from('institutions')
    .select('id')
    .eq('name', realName)
    .single();

  if (instError || !instData) {
    return { error: 'Could not resolve institution in database.' }
  }

  const { data: existingStudent } = await (supabase as any)
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingStudent) {
    const { error } = await (supabase as any).from('students').update({
      name: data.name,
      institution_id: instData.id,
      course_of_study: data.course,
      entry_level: data.level,
      current_level: data.level
    }).eq('user_id', user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await (supabase as any).from('students').insert({
      user_id: user.id,
      name: data.name,
      institution_id: instData.id,
      course_of_study: data.course,
      entry_level: data.level,
      current_level: data.level
    });
    if (error) return { error: error.message };
  }

  redirect('/dashboard')
}
