import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EntryClient from './EntryClient'

export default async function EntryPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch student and their institution's grade boundaries
  const { data, error } = await (supabase as any)
    .from('students')
    .select('*, institution:institutions(name, grading_scale, grade_boundaries)')
    .eq('user_id', user.id)
    .single()

  const student = data as any;

  if (error || !student) {
    redirect('/onboarding')
  }

  return (
    <EntryClient 
      studentName={student.name}
      institutionName={student.institution.name}
      gradeBoundaries={student.institution.grade_boundaries}
    />
  )
}
