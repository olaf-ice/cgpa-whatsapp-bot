import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TranscriptClient from './TranscriptClient'

export default async function TranscriptPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch student, institution, and all semesters with grades
  const { data, error } = await (supabase as any)
    .from('students')
    .select(`
      *, 
      institution:institutions(name, grading_scale),
      semesters(
        level, 
        term, 
        grades(course_code, credit_units, grade, points)
      )
    `)
    .eq('user_id', user.id)
    .single()

  const student = data as any;

  if (error || !student) {
    redirect('/onboarding')
  }

  // Sort semesters logically
  const sortedSemesters = student.semesters?.sort((a: any, b: any) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.term - b.term;
  }) || [];

  if (student.institution?.name?.toLowerCase().includes('ibadan') && student.institution?.name?.toLowerCase().includes('university')) {
    student.institution.grading_scale = 5.0;
  }

  return (
    <TranscriptClient 
      student={student}
      semesters={sortedSemesters}
    />
  )
}
