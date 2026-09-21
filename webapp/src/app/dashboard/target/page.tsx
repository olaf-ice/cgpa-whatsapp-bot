import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TargetClient from './TargetClient'

export default async function TargetPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch student, institution, and all their semesters/grades
  const { data: student, error } = await (supabase as any)
    .from('students')
    .select(`
      *,
      institution:institutions(name, grading_scale, grade_boundaries),
      semesters(
        grades(credit_units, points)
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (error || !student) {
    redirect('/onboarding')
  }

  const email = user.email?.toLowerCase().trim() || '';
  const isSimeon = email === 'simeoncranier@gmail.com' || email === 'timileyinsimeon@gmail.com';
  if (!student.has_paid && !student.is_admin && !isSimeon) {
    redirect('/dashboard') // Route back to dashboard to hit the paywall
  }

  // Calculate Cumulative TCU (Total Credit Units) and TGP (Total Grade Points)
  let totalCreditUnits = 0;
  let totalGradePoints = 0;

  if (student.semesters) {
    student.semesters.forEach((sem: any) => {
      if (sem.grades) {
        sem.grades.forEach((g: any) => {
          totalCreditUnits += g.credit_units;
          totalGradePoints += g.points;
        })
      }
    })
  }

  const currentCGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits) : 0;

  return (
    <TargetClient 
      currentCGPA={currentCGPA}
      totalCreditUnits={totalCreditUnits}
      totalGradePoints={totalGradePoints}
      scale={student.institution.grading_scale}
    />
  )
}
