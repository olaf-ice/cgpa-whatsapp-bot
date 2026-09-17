'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Loader2, BookOpen } from 'lucide-react'
import { saveSemester, CourseEntry } from './actions'

interface EntryClientProps {
  studentName: string
  institutionName: string
  gradeBoundaries: any
}

type ClientCourseEntry = Omit<CourseEntry, 'score'> & { score: number | '' };

export default function EntryClient({ studentName, institutionName, gradeBoundaries }: EntryClientProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [level, setLevel] = useState<number>(100)
  const [term, setTerm] = useState<number>(1)
  
  const [courses, setCourses] = useState<ClientCourseEntry[]>([
    { code: '', units: 3, score: '' }
  ])

  const handleAddCourse = () => {
    setCourses([...courses, { code: '', units: 3, score: '' }])
  }

  const handleRemoveCourse = (index: number) => {
    if (courses.length === 1) return; // Keep at least one
    setCourses(courses.filter((_, i) => i !== index))
  }

  const handleCourseChange = (index: number, field: keyof ClientCourseEntry, value: string | number) => {
    const newCourses = [...courses]
    newCourses[index] = { ...newCourses[index], [field]: value }
    setCourses(newCourses)
  }

  // Helper to find the correct grade based on a numeric score
  const resolveGrade = (score: number | '') => {
    if (score === '') return '-';
    let resolvedGrade = 'F';
    // Sort boundaries by min_score descending
    const sortedGrades = Object.entries(gradeBoundaries).sort((a: any, b: any) => b[1].min_score - a[1].min_score);
    
    for (const [gradeKey, data] of sortedGrades) {
      if (score >= (data as any).min_score) {
        resolvedGrade = gradeKey;
        break;
      }
    }
    return resolvedGrade;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    
    // Validate
    if (courses.some(c => !c.code.trim() || c.score === '')) {
      setErrorMsg("All courses must have a course code and an exam score.")
      return;
    }

    // Convert score to a guaranteed number before sending to server
    const payloadCourses = courses.map(c => ({
      code: c.code,
      units: c.units,
      score: Number(c.score)
    }))

    startTransition(async () => {
      const result = await saveSemester({ level, term, courses: payloadCourses })
      if (result?.error) {
        setErrorMsg(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-gray-50 to-purple-100/40 py-10 px-6 md:px-12">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-4 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Log Semester</h1>
            <p className="text-gray-500 mt-1">{institutionName}</p>
          </div>
          <div className="w-14 h-14 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white">
            <BookOpen className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-blue-900/5 border border-white/50 relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Semester Metadata */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Level</label>
                <select 
                  value={level} 
                  onChange={e => setLevel(Number(e.target.value))}
                  className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  {[100, 200, 300, 400, 500, 600, 700].map(l => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Semester</label>
                <select 
                  value={term} 
                  onChange={e => setTerm(Number(e.target.value))}
                  className="w-full bg-white/50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value={1}>1st Semester</option>
                  <option value={2}>2nd Semester</option>
                </select>
              </div>
            </div>

            <hr className="border-gray-200/60" />

            {/* Courses List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-gray-900">Courses & Grades</h3>
                <span className="text-sm font-medium text-gray-500">{courses.length} Course{courses.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="space-y-3">
                {courses.map((course, index) => (
                  <div key={index} className="flex gap-3 items-center bg-gray-50/50 p-2 pr-4 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                    
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ml-2">
                      {index + 1}
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="e.g. MTH101"
                          value={course.code}
                          onChange={e => handleCourseChange(index, 'code', e.target.value)}
                          className="w-full bg-transparent text-gray-900 font-semibold px-2 py-2 outline-none placeholder:font-normal placeholder:text-gray-400 uppercase"
                          required
                        />
                      </div>
                      
                      <div className="col-span-4 flex items-center gap-2 border-l border-gray-200 pl-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Units</span>
                        <select
                          value={course.units}
                          onChange={e => handleCourseChange(index, 'units', Number(e.target.value))}
                          className="w-full bg-transparent text-gray-900 font-semibold py-2 outline-none cursor-pointer"
                        >
                          {[1,2,3,4,5,6].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3 flex flex-col items-center justify-center border-l border-gray-200 pl-2">
                         <span className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Score</span>
                         <div className="flex items-center gap-2">
                           <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            value={course.score}
                            onChange={e => handleCourseChange(index, 'score', e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-16 bg-transparent text-gray-900 font-bold text-center outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors placeholder:font-normal placeholder:text-gray-300"
                            required
                          />
                          {course.score !== '' && (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm">
                              {resolveGrade(course.score)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveCourse(index)}
                      disabled={courses.length === 1}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={handleAddCourse}
                className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Plus className="w-5 h-5" />
                Add Another Course
              </button>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    Save Semester Grades
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
