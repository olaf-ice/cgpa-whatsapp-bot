import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EntryClient from './EntryClient'

export default async function EntryPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
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

  let initialCourses: any = null;
  let initialLevel: number | null = null;
  let initialTerm: number | null = null;

  if (searchParams) {
    const sParams = await searchParams;
    if (sParams?.editLevel && sParams?.editTerm) {
      initialLevel = parseInt(sParams.editLevel as string);
      initialTerm = parseInt(sParams.editTerm as string);

      const { data: semData } = await (supabase as any)
        .from('semesters')
        .select('id, grades(course_code, credit_units, grade)')
        .eq('student_id', student.id)
        .eq('level', initialLevel)
        .eq('term', initialTerm)
        .single();

      if (semData && semData.grades) {
        initialCourses = semData.grades.map((g: any) => {
          const bound = student.institution.grade_boundaries[g.grade];
          return {
            code: g.course_code,
            units: g.credit_units,
            score: bound ? bound.min_score : 0
          }
        });
      }
    }
  }

  return (
    <EntryClient 
      studentName={student.name}
      institutionName={student.institution.name}
      gradeBoundaries={student.institution.grade_boundaries}
      initialLevel={initialLevel || undefined}
      initialTerm={initialTerm || undefined}
      initialCourses={initialCourses || undefined}
    />
  )
}
