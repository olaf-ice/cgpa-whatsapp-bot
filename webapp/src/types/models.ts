import { Database } from './database.types'

export type Institution = Database['public']['Tables']['institutions']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Semester = Database['public']['Tables']['semesters']['Row']
export type Grade = Database['public']['Tables']['grades']['Row']

export interface GradeBoundary {
  min_score: number
  points: number
}

// Example representation of the JSONB field in Institutions
export type GradeBoundariesMap = Record<string, GradeBoundary>
