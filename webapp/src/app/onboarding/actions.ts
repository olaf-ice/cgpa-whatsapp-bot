'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

function isExemptUser(email?: string | null, name?: string | null, isAdmin?: boolean | null): boolean {
  if (isAdmin === true) return true;
  
  const cleanEmail = (email || '').toLowerCase().trim();
  if (cleanEmail === 'timileyinsimeon@gmail.com' || cleanEmail === 'simeoncranier@gmail.com') {
    return true;
  }
  
  const cleanName = (name || '').toLowerCase().replace(/[^a-z]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanName.includes('oladipupo') && cleanName.includes('timileyin')) {
    return true;
  }
  
  return false;
}

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

  const trimmedName = (data.name || '').trim();
  const trimmedMatric = (data.matric_number || '').trim();
  const trimmedCourse = (data.course || '').trim();

  // Fetch existing student profile
  const { data: existingStudent } = await (supabase as any)
    .from('students')
    .select('id, name, matric_number, course_of_study, is_admin')
    .eq('user_id', user.id)
    .maybeSingle();

  const isExempt = isExemptUser(
    user.email, 
    existingStudent?.name || trimmedName, 
    existingStudent?.is_admin
  );

  let finalName = trimmedName;
  let finalMatric = trimmedMatric;
  let finalCourse = trimmedCourse;

  if (existingStudent) {
    // If user is already registered and not exempt, prevent altering full name, matric number, or course of study
    if (!isExempt) {
      const hasExistingName = existingStudent.name && existingStudent.name !== 'Student';
      const hasExistingMatric = existingStudent.matric_number && existingStudent.matric_number.trim() !== '';
      const hasExistingCourse = existingStudent.course_of_study && existingStudent.course_of_study.trim() !== '';

      if (hasExistingName && trimmedName !== existingStudent.name) {
        return { error: 'You cannot change your Full Name after registration. Please contact an administrator.' };
      }
      if (hasExistingMatric && trimmedMatric.toUpperCase() !== existingStudent.matric_number.toUpperCase()) {
        return { error: 'You cannot change your Matric Number after registration. Please contact an administrator.' };
      }
      if (hasExistingCourse && trimmedCourse.toLowerCase() !== existingStudent.course_of_study.toLowerCase()) {
        return { error: 'You cannot change your Course of Study after registration. Please contact an administrator.' };
      }

      // Enforce immutable registered fields
      if (hasExistingName) finalName = existingStudent.name;
      if (hasExistingMatric) finalMatric = existingStudent.matric_number;
      if (hasExistingCourse) finalCourse = existingStudent.course_of_study;
    }
  } else {
    // Initial registration validation
    if (!trimmedName || trimmedName.toLowerCase() === 'student') {
      return { error: 'Please enter your real Full Name to complete registration.' };
    }
    if (!trimmedMatric) {
      return { error: 'Please enter your Matric Number to complete registration.' };
    }
    if (!trimmedCourse) {
      return { error: 'Please enter your Course of Study to complete registration.' };
    }

    // Check if matric number is already used by another student
    const { data: existingMatric } = await (supabase as any)
      .from('students')
      .select('id')
      .eq('matric_number', trimmedMatric)
      .neq('user_id', user.id)
      .maybeSingle();

    if (existingMatric) {
      return { error: 'This Matric Number is already registered to another account. Each student must have a unique profile.' };
    }
  }

  const { error: rpcError } = await (supabase as any).rpc('save_profile', {
    p_name: finalName,
    p_matric: finalMatric,
    p_institution: data.institution_id,
    p_course: finalCourse,
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

