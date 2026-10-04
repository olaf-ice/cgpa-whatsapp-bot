import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EntryClient from './EntryClient'

export default async function EntryPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch student, institution, and all their logged semesters/grades
  const { data, error } = await (supabase as any)
    .from('students')
    .select(`
      *, 
      institution:institutions(name, grading_scale, grade_boundaries),
      semesters(id, level, term, grades(course_code, credit_units, grade))
    `)
    .eq('user_id', user.id)
    .single()

  const student = data as any;

  if (error || !student) {
    redirect('/onboarding')
  }

  let gradeBoundaries = student.institution?.grade_boundaries;
  if (student.institution?.name?.toLowerCase().includes('ibadan') && student.institution?.name?.toLowerCase().includes('university')) {
    gradeBoundaries = {
      A: { min_score: 70, points: 5 },
      B: { min_score: 60, points: 4 },
      C: { min_score: 50, points: 3 },
      D: { min_score: 45, points: 2 },
      E: { min_score: 40, points: 1 },
      F: { min_score: 0, points: 0 }
    };
  }

  // Map all existing saved semesters by `${level}-${term}` to ensure each semester's courses stay completely separate
  const savedSemesters: Record<string, Array<{ code: string, units: number, score: number | '' }>> = {};
  if (student.semesters) {
    student.semesters.forEach((sem: any) => {
      const key = `${sem.level}-${sem.term}`;
      if (sem.grades && sem.grades.length > 0) {
        savedSemesters[key] = sem.grades.map((g: any) => {
          const bound = gradeBoundaries ? gradeBoundaries[g.grade] : null;
          return {
            code: g.course_code,
            units: g.credit_units,
            score: bound ? bound.min_score : ''
          };
        });
      }
    });
  }

  let initialLevel: number = student.current_level || 100;
  let initialTerm: number = 1;
  let initialCourses: any = null;

  const sParams = searchParams ? await searchParams : null;
  if (sParams?.editLevel && sParams?.editTerm) {
    initialLevel = parseInt(sParams.editLevel as string);
    initialTerm = parseInt(sParams.editTerm as string);
    const key = `${initialLevel}-${initialTerm}`;
    if (savedSemesters[key]) {
      initialCourses = savedSemesters[key];
    }
  } else {
    // If 1st semester for this level is already logged, default to 2nd semester (which starts fresh)
    const firstSemKey = `${initialLevel}-1`;
    const secondSemKey = `${initialLevel}-2`;
    if (savedSemesters[firstSemKey] && !savedSemesters[secondSemKey]) {
      initialTerm = 2; // Fresh 2nd semester
    } else if (savedSemesters[secondSemKey]) {
      initialTerm = 2;
      initialCourses = savedSemesters[secondSemKey];
    } else if (savedSemesters[firstSemKey]) {
      initialCourses = savedSemesters[firstSemKey];
    }
  }

  return (
    <EntryClient 
      studentName={student.name}
      institutionName={student.institution?.name || ''}
      gradeBoundaries={gradeBoundaries}
      initialLevel={initialLevel}
      initialTerm={initialTerm}
      initialCourses={initialCourses || undefined}
      savedSemesters={savedSemesters}
    />
  )
}

