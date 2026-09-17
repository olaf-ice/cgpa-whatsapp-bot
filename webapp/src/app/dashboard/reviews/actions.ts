'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(data: { courseCode: string, rating: number, adviceText: string, isAnonymous: boolean }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication failed.' }
  }

  // Get student institution ID
  const { data: student } = await (supabase as any)
    .from('students')
    .select('id, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return { error: 'Student record not found.' }
  }

  const { error } = await (supabase as any)
    .from('course_reviews')
    .insert({
      institution_id: student.institution_id,
      course_code: data.courseCode.toUpperCase().replace(/\s+/g, ''), // e.g. "MTH 101" -> "MTH101"
      rating: data.rating,
      advice_text: data.adviceText,
      author_id: data.isAnonymous ? null : student.id
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/reviews')
  return { success: true }
}
