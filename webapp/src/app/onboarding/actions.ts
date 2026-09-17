'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function saveProfile(data: { name: string, matric_number: string, institution_id: string, course: string, level: number, referredBy?: string | null }) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Authentication failed. Please log in again.' }
  }

  // The client now passes the exact institution UUID
  if (!data.institution_id) {
    return { error: 'Invalid institution selected.' }
  }

  const { data: existingStudent, error: selectError } = await (supabase as any)
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (selectError) {
    return { error: 'Error checking profile: ' + selectError.message };
  }

  const baseName = data.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase() || 'user';
  const randomStr = Math.random().toString(36).substring(2, 6);
  const generatedRefCode = `${baseName}-${randomStr}`;

  if (existingStudent) {
    const { error } = await (supabase as any).from('students').update({
      name: data.name,
      matric_number: data.matric_number,
      institution_id: data.institution_id,
      course_of_study: data.course,
      entry_level: data.level,
      current_level: data.level
    }).eq('user_id', user.id);
    if (error) return { error: error.message };
  } else {
    // Only resolve referred_by on first insert
    let referredByUUID = null;
    if (data.referredBy) {
      const { data: refUser } = await (supabase as any)
        .from('students')
        .select('id')
        .eq('referral_code', data.referredBy)
        .single();
      if (refUser) {
        referredByUUID = refUser.id;
      }
    }

    const { error: insertError } = await (supabase as any).from('students').insert({
      user_id: user.id,
      name: data.name,
      matric_number: data.matric_number,
      institution_id: data.institution_id,
      course_of_study: data.course,
      entry_level: data.level,
      current_level: data.level,
      referral_code: generatedRefCode,
      referred_by: referredByUUID
    });
    
    // Fallback: If it STILL says duplicate key, it means a race condition or caching hid the record. Force an update.
    if (insertError) {
      if (insertError.code === '23505') { 
        const { error: fallbackError } = await (supabase as any).from('students').update({
          name: data.name,
          matric_number: data.matric_number,
          institution_id: data.institution_id,
          course_of_study: data.course,
          entry_level: data.level,
          current_level: data.level
        }).eq('user_id', user.id);
        if (fallbackError) return { error: fallbackError.message };
      } else {
        return { error: insertError.message };
      }
    }
  }

  redirect('/dashboard')
}
