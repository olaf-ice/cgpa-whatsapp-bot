'use server'
 

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface CourseEntry {
  code: string;
  units: number;
  score: number;
}

export async function saveSemester(data: { level: number, term: number, courses: CourseEntry[] }) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication failed. Please log in again.' }
  }

  // 1. Get student and institution details
  const { data: student, error: studentError } = await (supabase as any)
    .from('students')
    .select('id, institution:institutions(id, grade_boundaries)')
    .eq('user_id', user.id)
    .single()

  if (studentError || !student) {
    return { error: 'Student profile not found.' }
  }

  const gradeBoundaries = student.institution.grade_boundaries;

  // 2. Insert or Fetch Semester
  let semesterId: string;
  let isExistingSemester = false;
  const { data: semester, error: semesterError } = await (supabase as any)
    .from('semesters')
    .insert({
      student_id: student.id,
      level: data.level,
      term: data.term
    })
    .select('id')
    .single()

  if (semesterError) {
    // Handle unique constraint (Semester already logged)
    if (semesterError.code === '23505') {
      const { data: existingSem, error: fetchError } = await (supabase as any)
        .from('semesters')
        .select('id')
        .eq('student_id', student.id)
        .eq('level', data.level)
        .eq('term', data.term)
        .single();
        
      if (fetchError || !existingSem) {
        return { error: 'Failed to access your existing semester.' }
      }
      semesterId = existingSem.id;
      isExistingSemester = true;
    } else {
      return { error: semesterError.message }
    }
  } else {
    semesterId = semester.id;
  }

  if (isExistingSemester) {
    await (supabase as any)
      .from('grades')
      .delete()
      .eq('semester_id', semesterId);
  }

  // Helper to find the correct grade based on a numeric score
  const resolveGrade = (score: number) => {
    let resolvedGrade = 'F';
    let resolvedPoints = 0;
    
    // Sort boundaries by min_score descending (e.g. 70, 60, 50)
    const sortedGrades = Object.entries(gradeBoundaries).sort((a: any, b: any) => b[1].min_score - a[1].min_score);
    
    for (const [gradeKey, data] of sortedGrades) {
      if (score >= (data as any).min_score) {
        resolvedGrade = gradeKey;
        resolvedPoints = (data as any).points;
        break;
      }
    }
    
    return { resolvedGrade, resolvedPoints };
  }

  // 3. Prepare Grades Data
  const gradesToInsert = data.courses.map((course) => {
    const { resolvedGrade, resolvedPoints } = resolveGrade(course.score);
    
    return {
      semester_id: semesterId,
      course_code: course.code.toUpperCase(),
      credit_units: course.units,
      grade: resolvedGrade,
      points: course.units * resolvedPoints // total points for this course
    }
  })

  // 4. Bulk Insert Grades
  const { error: gradesError } = await (supabase as any)
    .from('grades')
    .insert(gradesToInsert)

  if (gradesError) {
    return { error: gradesError.message }
  }

  // 5. Recalculate CGPA and cache it
  const { data: allSemesters } = await (supabase as any)
    .from('semesters')
    .select('grades(credit_units, points)')
    .eq('student_id', student.id);

  if (allSemesters) {
    let totalCreditUnits = 0;
    let totalGradePoints = 0;

    allSemesters.forEach((sem: any) => {
      sem.grades?.forEach((g: any) => {
        totalCreditUnits += g.credit_units;
        totalGradePoints += g.points;
      });
    });

    const newCGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits) : 0;

    await (supabase as any)
      .from('students')
      .update({ current_cgpa: newCGPA })
      .eq('id', student.id);
  }

  redirect('/dashboard')
}
