'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CarryoverItem {
  code: string;
  units: number;
}

export interface QuickSyncData {
  currentCGPA: number;
  totalUnits: number;
  carryovers?: CarryoverItem[];
}

export async function quickPortalSync(data: QuickSyncData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required. Please log in.' }
  }

  // Fetch student and institution
  const { data: student, error: studentError } = await (supabase as any)
    .from('students')
    .select('id, current_level, institution:institutions(name, grading_scale, grade_boundaries)')
    .eq('user_id', user.id)
    .single()

  if (studentError || !student) {
    return { error: 'Student record not found.' }
  }

  const scale = Number(student.institution?.grading_scale) || 5.0
  const cgpa = Number(data.currentCGPA)
  const totalUnits = Number(data.totalUnits)

  if (isNaN(cgpa) || cgpa < 0 || cgpa > scale) {
    return { error: `Invalid CGPA. Must be between 0.0 and ${scale.toFixed(1)}.` }
  }

  if (isNaN(totalUnits) || totalUnits <= 0) {
    return { error: 'Total credit units must be greater than 0.' }
  }

  const cleanCarryovers: CarryoverItem[] = (data.carryovers || [])
    .filter(c => c && c.code && c.code.trim().length > 0)
    .map(c => ({
      code: c.code.trim().replace(/\s+/g, '').toUpperCase(),
      units: Math.max(1, Number(c.units) || 3)
    }))

  const carryoverUnits = cleanCarryovers.reduce((sum, c) => sum + c.units, 0)
  const totalQualityPoints = Number((cgpa * totalUnits).toFixed(2))

  // Find or create baseline semester (level: 0, term: 1)
  let semesterId: string

  const { data: existingSem } = await (supabase as any)
    .from('semesters')
    .select('id')
    .eq('student_id', student.id)
    .eq('level', 0)
    .eq('term', 1)
    .maybeSingle()

  if (existingSem) {
    semesterId = existingSem.id
    // Clear previous baseline grades
    await (supabase as any)
      .from('grades')
      .delete()
      .eq('semester_id', semesterId)
  } else {
    const { data: newSem, error: createSemError } = await (supabase as any)
      .from('semesters')
      .insert({
        student_id: student.id,
        level: 0,
        term: 1
      })
      .select('id')
      .single()

    if (createSemError || !newSem) {
      return { error: 'Failed to create baseline sync: ' + (createSemError?.message || 'Unknown error') }
    }
    semesterId = newSem.id
  }

  // Build grade rows
  // To avoid numeric overflow on NUMERIC(3,1) where max is 99.9, chunk passed units into chunks <= 15 units
  const passedUnits = Math.max(0, totalUnits - carryoverUnits)
  const gradesToInsert: any[] = []

  if (passedUnits > 0) {
    const CHUNK_SIZE = 15
    let remainingUnits = passedUnits
    let chunkIndex = 1

    while (remainingUnits > 0) {
      const currentChunkUnits = Math.min(CHUNK_SIZE, remainingUnits)
      // Quality points for this chunk proportion
      const chunkPoints = Number(((currentChunkUnits / passedUnits) * totalQualityPoints).toFixed(1))
      
      gradesToInsert.push({
        semester_id: semesterId,
        course_code: `PORTAL_SYNC_${chunkIndex}`,
        credit_units: currentChunkUnits,
        grade: 'A',
        points: Math.min(99.0, chunkPoints)
      })

      remainingUnits -= currentChunkUnits
      chunkIndex++
    }
  }

  // Insert carryovers as failed courses (grade 'F', points 0)
  for (const co of cleanCarryovers) {
    gradesToInsert.push({
      semester_id: semesterId,
      course_code: co.code,
      credit_units: co.units,
      grade: 'F',
      points: 0.0
    })
  }

  if (gradesToInsert.length > 0) {
    const { error: insertGradesError } = await (supabase as any)
      .from('grades')
      .insert(gradesToInsert)

    if (insertGradesError) {
      return { error: 'Failed to save baseline grades: ' + insertGradesError.message }
    }
  }

  // Update student cached CGPA
  await (supabase as any)
    .from('students')
    .update({ current_cgpa: cgpa })
    .eq('id', student.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/entry')
  revalidatePath('/dashboard/target')

  return { success: true }
}
