import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import RegistrationPlannerClient from './RegistrationPlannerClient'

export default async function RegistrationPlannerPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch student, institution, and semesters with grades
  const { data: student, error } = await (supabase as any)
    .from('students')
    .select(`
      *,
      institution:institutions(name, grading_scale, grade_boundaries),
      semesters(
        level, term,
        grades(course_code, grade, credit_units, points)
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (error || !student) {
    redirect('/onboarding')
  }

  // Calculate carryovers and current units
  const normalizeCode = (code: string) => (code || '').replace(/\s+/g, '').toUpperCase()
  const failedCourses = new Map<string, { code: string; level: number; term: number; units: number }>()
  const passedCourses = new Set<string>()

  let totalCreditUnits = 0
  let totalGradePoints = 0

  if (student.semesters) {
    student.semesters.forEach((sem: any) => {
      if (sem.grades) {
        sem.grades.forEach((g: any) => {
          totalCreditUnits += g.credit_units
          totalGradePoints += g.points

          const norm = normalizeCode(g.course_code)
          if (norm) {
            if (g.points === 0 || g.grade === 'F') {
              failedCourses.set(norm, {
                code: g.course_code.toUpperCase(),
                level: sem.level,
                term: sem.term,
                units: g.credit_units
              })
            } else if (g.points > 0) {
              passedCourses.add(norm)
            }
          }
        })
      }
    })
  }

  const outstandingCarryovers: { code: string; level: number; term: number; units: number }[] = []
  failedCourses.forEach((details, norm) => {
    if (!passedCourses.has(norm)) {
      outstandingCarryovers.push(details)
    }
  })

  const currentCGPA = totalCreditUnits > 0 
    ? (totalGradePoints / totalCreditUnits) 
    : (student.current_cgpa ? Number(student.current_cgpa) : 0.0)

  return (
    <RegistrationPlannerClient
      studentName={student.name}
      courseOfStudy={student.course_of_study || 'Computer Science'}
      currentLevel={student.current_level || 100}
      scale={
        (student.institution?.name?.toLowerCase().includes('ibadan') && student.institution?.name?.toLowerCase().includes('university'))
          ? 5.0
          : (student.institution?.grading_scale || 5.0)
      }
      currentCGPA={Number(currentCGPA.toFixed(2))}
      totalCreditUnits={totalCreditUnits}
      totalGradePoints={totalGradePoints}
      outstandingCarryovers={outstandingCarryovers}
    />
  )
}
