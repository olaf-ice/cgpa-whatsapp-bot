export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string
          name: string
          type: string
          grading_scale: number
          grade_boundaries: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          grading_scale: number
          grade_boundaries: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          grading_scale?: number
          grade_boundaries?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          name: string
          institution_id: string
          course_of_study: string
          entry_level: number
          current_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          institution_id: string
          course_of_study: string
          entry_level?: number
          current_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          institution_id?: string
          course_of_study?: string
          entry_level?: number
          current_level?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      courses: {
        Row: {
          id: string
          institution_id: string
          course_code: string
          title: string
          credit_units: number
          level: number
          term: number
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          course_code: string
          title: string
          credit_units: number
          level: number
          term: number
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          course_code?: string
          title?: string
          credit_units?: number
          level?: number
          term?: number
          created_at?: string
        }
        Relationships: any[]
      }
      semesters: {
        Row: {
          id: string
          student_id: string
          level: number
          term: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          level: number
          term: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          level?: number
          term?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      grades: {
        Row: {
          id: string
          semester_id: string
          course_id: string | null
          course_code: string
          credit_units: number
          grade: string | null
          points: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          semester_id: string
          course_id?: string | null
          course_code: string
          credit_units: number
          grade?: string | null
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          semester_id?: string
          course_id?: string | null
          course_code?: string
          credit_units?: number
          grade?: string | null
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
    }
  }
}
