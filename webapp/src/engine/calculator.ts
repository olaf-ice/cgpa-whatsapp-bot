import { GradeBoundariesMap } from '@/types/models'

export interface CourseEntry {
  courseCode: string
  creditUnits: number
  grade: string // e.g., 'A', 'B+'
}

export interface SemesterRecord {
  id?: string
  courses: CourseEntry[]
}

/**
 * Extracts the grade point from the institution's GradeBoundariesMap.
 * Uses pure logic with zero dependencies on React or DB state.
 */
export function getGradePoint(grade: string, boundaries: GradeBoundariesMap): number {
  if (!grade) return 0
  
  const normalizedGrade = grade.trim().toUpperCase()
  const boundary = boundaries[normalizedGrade]
  
  return boundary ? boundary.points : 0
}

/**
 * Calculates the Total Credit Units, Total Quality Points, and GPA for a single semester.
 */
export function calculateSemesterGPA(courses: CourseEntry[], boundaries: GradeBoundariesMap) {
  let totalCreditUnits = 0
  let totalQualityPoints = 0

  for (const course of courses) {
    // Only calculate for courses that have a valid grade
    if (course.grade) {
      const point = getGradePoint(course.grade, boundaries)
      totalCreditUnits += course.creditUnits
      totalQualityPoints += (point * course.creditUnits)
    }
  }

  const gpa = totalCreditUnits > 0 ? (totalQualityPoints / totalCreditUnits) : 0

  return {
    totalCreditUnits,
    totalQualityPoints,
    gpa: Number(gpa.toFixed(2))
  }
}

/**
 * Aggregates all semesters to calculate the cumulative CGPA.
 */
export function calculateCGPA(semesters: SemesterRecord[], boundaries: GradeBoundariesMap) {
  let totalCreditUnits = 0
  let totalQualityPoints = 0

  for (const semester of semesters) {
    const semResult = calculateSemesterGPA(semester.courses, boundaries)
    totalCreditUnits += semResult.totalCreditUnits
    totalQualityPoints += semResult.totalQualityPoints
  }

  const cgpa = totalCreditUnits > 0 ? (totalQualityPoints / totalCreditUnits) : 0

  return {
    totalCreditUnits,
    totalQualityPoints,
    cgpa: Number(cgpa.toFixed(2))
  }
}
