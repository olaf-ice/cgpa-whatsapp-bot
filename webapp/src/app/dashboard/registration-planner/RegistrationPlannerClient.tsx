'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UI_DLC_GUIDELINES,
  findDepartmentGuidelines,
  evaluateRegistration
} from '@/engine/uiGuidelines'

interface CarryoverItem {
  code: string
  level: number
  term: number
  units: number
}

interface RegistrationPlannerClientProps {
  studentName: string
  courseOfStudy: string
  currentLevel: number
  scale: number
  currentCGPA: number
  totalCreditUnits: number
  totalGradePoints: number
  outstandingCarryovers: CarryoverItem[]
}

export default function RegistrationPlannerClient({
  studentName,
  courseOfStudy,
  currentLevel,
  scale,
  currentCGPA,
  totalCreditUnits,
  totalGradePoints,
  outstandingCarryovers
}: RegistrationPlannerClientProps) {
  // 1. Selector state
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    const matched = findDepartmentGuidelines(courseOfStudy)
    return matched ? matched.department : 'Computer Science'
  })

  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel || 200)
  const [selectedStream, setSelectedStream] = useState<'OLEVEL' | 'DE' | 'RETURNING' | 'FAST_TRACK'>('RETURNING')
  const [selectedTerm, setSelectedTerm] = useState<1 | 2>(1)

  // 2. Active department guideline
  const currentDeptGuide = useMemo(() => {
    return findDepartmentGuidelines(selectedDept)
  }, [selectedDept])

  // Get available streams for this department and level
  const availableStreams = useMemo(() => {
    if (!currentDeptGuide) return []
    return currentDeptGuide.streams.filter(s => s.level === selectedLevel)
  }, [currentDeptGuide, selectedLevel])

  // Available semesters for the active stream
  const activeStream = useMemo(() => {
    return (
      availableStreams.find(s => s.stream === selectedStream) ||
      availableStreams[0] ||
      currentDeptGuide?.streams[0]
    )
  }, [availableStreams, selectedStream, currentDeptGuide])

  const activeSemesterGuide = useMemo(() => {
    return activeStream?.semesters.find(s => s.term === selectedTerm) || activeStream?.semesters[0]
  }, [activeStream, selectedTerm])

  // 3. User's planned courses for the semester
  const [plannedCourses, setPlannedCourses] = useState<Array<{ code: string; units: number }>>([
    { code: '', units: 3 }
  ])

  // Carryovers user decides to register this semester
  const [selectedCarryoverCodes, setSelectedCarryoverCodes] = useState<Set<string>>(() => {
    // Default select carryovers matching this semester's term
    const set = new Set<string>()
    outstandingCarryovers.forEach(co => {
      if (co.term === selectedTerm || co.term === 0) {
        set.add(co.code.replace(/\s+/g, '').toUpperCase())
      }
    })
    return set
  })

  // Carryover expected grades for CGPA simulation
  const [carryoverGrades, setCarryoverGrades] = useState<Record<string, number>>({})

  const handleToggleCarryover = (code: string) => {
    const norm = code.replace(/\s+/g, '').toUpperCase()
    setSelectedCarryoverCodes(prev => {
      const next = new Set(prev)
      if (next.has(norm)) {
        next.delete(norm)
      } else {
        next.add(norm)
      }
      return next
    })
  }

  // Pre-fill compulsory courses
  const handleAutoFillCompulsory = () => {
    if (!activeSemesterGuide?.compulsoryCourses) return
    const newCourses = activeSemesterGuide.compulsoryCourses.map(code => ({
      code,
      units: code.startsWith('GES') ? 2 : 3 // standard UI default unit assumption
    }))
    setPlannedCourses(newCourses)
  }

  const handleAddCourse = () => {
    setPlannedCourses(prev => [...prev, { code: '', units: 3 }])
  }

  const handleRemoveCourse = (index: number) => {
    setPlannedCourses(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateCourse = (index: number, field: 'code' | 'units', val: any) => {
    setPlannedCourses(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: val }
      return updated
    })
  }

  // Active carryovers being registered
  const activeCarryoversList = useMemo(() => {
    return outstandingCarryovers
      .filter(co => selectedCarryoverCodes.has(co.code.replace(/\s+/g, '').toUpperCase()))
      .map(co => ({ code: co.code, units: co.units }))
  }, [outstandingCarryovers, selectedCarryoverCodes])

  // Valid non-empty planned courses
  const cleanPlannedCourses = useMemo(() => {
    return plannedCourses.filter(c => c.code && c.code.trim().length > 0)
  }, [plannedCourses])

  // Run evaluation against UI guidelines
  const evaluation = useMemo(() => {
    return evaluateRegistration({
      department: selectedDept,
      level: selectedLevel,
      stream: selectedStream,
      term: selectedTerm,
      registeredCourses: cleanPlannedCourses,
      carryovers: activeCarryoversList
    })
  }, [selectedDept, selectedLevel, selectedStream, selectedTerm, cleanPlannedCourses, activeCarryoversList])

  // Carryover recovery simulation: calculate projected CGPA if retakes are passed
  const projectedCGPA = useMemo(() => {
    let additionalUnits = cleanPlannedCourses.reduce((sum, c) => sum + (Number(c.units) || 0), 0)
    let additionalPoints = additionalUnits * (scale === 5.0 ? 3.5 : 2.5) // assume 2:1 performance on new courses

    // For selected carryovers: replace the previous 0 points with the simulated grade points
    let carryoverAddedPoints = 0
    activeCarryoversList.forEach(co => {
      const norm = co.code.replace(/\s+/g, '').toUpperCase()
      const gradePoint = carryoverGrades[norm] ?? (scale === 5.0 ? 5.0 : 4.0) // default assume 'A'
      carryoverAddedPoints += co.units * gradePoint
    })

    const newTotalUnits = totalCreditUnits + additionalUnits
    const newTotalPoints = totalGradePoints + additionalPoints + carryoverAddedPoints

    if (newTotalUnits <= 0) return currentCGPA
    return Number((newTotalPoints / newTotalUnits).toFixed(2))
  }, [cleanPlannedCourses, activeCarryoversList, carryoverGrades, totalCreditUnits, totalGradePoints, currentCGPA, scale])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-10 text-left">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Course Registration & Carryover Advisor
              </h1>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                DLC UI 23/24
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Validate your course load against University of Ibadan Distance Learning Centre official caps.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-sm shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current CGPA</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currentCGPA.toFixed(2)}</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carryovers</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400">{outstandingCarryovers.length}</p>
            </div>
          </div>
        </div>

        {/* Controls Bar: Department, Level, Stream, Semester */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {UI_DLC_GUIDELINES.map(d => (
                  <option key={d.department} value={d.department}>
                    {d.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Level
              </label>
              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[100, 200, 300, 400, 500].map(lvl => (
                  <option key={lvl} value={lvl}>{lvl} Level</option>
                ))}
              </select>
            </div>

            {/* Stream */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Entry Stream
              </label>
              <select
                value={selectedStream}
                onChange={e => setSelectedStream(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="RETURNING">Returning Students (O&apos;Level)</option>
                <option value="OLEVEL">100L Direct (O&apos;Level)</option>
                <option value="DE">Direct Entry (DE)</option>
                <option value="FAST_TRACK">Fast Track (FST)</option>
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Semester
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTerm(1)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    selectedTerm === 1
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  1st Sem
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTerm(2)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    selectedTerm === 2
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  2nd Sem
                </button>
              </div>
            </div>

          </div>

          {/* Department Faculty Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <strong>{currentDeptGuide?.faculty}</strong> • Stream: <em>{evaluation.streamLabel}</em>
            </span>
            <span>
              Total Units Permitted: <strong>{evaluation.minUnits} min – {evaluation.maxUnits} max</strong>
            </span>
          </div>
        </div>

        {/* Live Load Status & Validation Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Semester Registration Status
              </p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {evaluation.totalUnits} Units Selected
              </h2>
            </div>

            {/* Status Pill */}
            <div>
              {evaluation.isOverLimit ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  Exceeds Max Limit ({evaluation.totalUnits}/{evaluation.maxUnits} Units)
                </div>
              ) : evaluation.isUnderLimit ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  Below Minimum Required ({evaluation.totalUnits}/{evaluation.minUnits} Units)
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Within Official DLC Range ({evaluation.minUnits} – {evaluation.maxUnits} Units)
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                evaluation.isOverLimit
                  ? 'bg-red-500'
                  : evaluation.isUnderLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (evaluation.totalUnits / evaluation.maxUnits) * 100)}%`
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Minimum: <strong>{evaluation.minUnits} units</strong></span>
            <span>Current: <strong>{evaluation.totalUnits} units</strong> ({evaluation.courseUnits} new + {evaluation.carryoverUnits} carryovers)</span>
            <span>Maximum: <strong>{evaluation.maxUnits} units</strong></span>
          </div>

          {/* Warnings & Advisories */}
          <div className="space-y-3 mt-6">
            {evaluation.isOverLimit && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Credit Load Exceeded!</strong> You are {evaluation.unitExcess} units over the maximum allowed by UI DLC ({evaluation.maxUnits} units). The course registration portal will reject this submission. Please drop non-compulsory electives.
                </div>
              </div>
            )}

            {evaluation.isUnderLimit && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Below Minimum Unit Limit!</strong> You need at least {evaluation.minUnits - evaluation.totalUnits} more units to meet the semester minimum threshold of {evaluation.minUnits} units.
                </div>
              </div>
            )}

            {evaluation.prerequisiteViolations.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-sm space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Prerequisite Violation Detected
                </div>
                {evaluation.prerequisiteViolations.map((v, i) => (
                  <p key={i} className="text-xs">
                    • <strong>{v.course}</strong> cannot be registered because its prerequisite course <strong>{v.requires}</strong> is currently unpassed in your carryover list.
                  </p>
                ))}
              </div>
            )}

            {evaluation.missingCompulsory.length > 0 && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-200 text-sm">
                <div className="font-bold mb-1 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Recommended Compulsory Courses Not Yet Added
                </div>
                <p className="text-xs leading-relaxed">
                  The guidelines specify these compulsory courses for {evaluation.streamLabel} {selectedTerm === 1 ? '1st' : '2nd'} Semester:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {evaluation.missingCompulsory.map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 font-bold text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carryovers Inclusion & Target Simulation Section */}
        {outstandingCarryovers.length > 0 && (
          <div className="bg-red-50/50 dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-red-200/60 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Carryover Recovery Strategy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select which carryovers you are registering this semester and simulate your retake grades:
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-slate-700 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Projected CGPA</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {projectedCGPA.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {outstandingCarryovers.map((co) => {
                const norm = co.code.replace(/\s+/g, '').toUpperCase()
                const isSelected = selectedCarryoverCodes.has(norm)

                return (
                  <div
                    key={co.code}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-indigo-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCarryover(co.code)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{co.code}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{co.units} Units • {co.level}L Sem {co.term}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Target Grade:</span>
                        <select
                          value={carryoverGrades[norm] ?? (scale === 5.0 ? 5 : 4)}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            setCarryoverGrades(prev => ({ ...prev, [norm]: val }))
                          }}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                        >
                          <option value={5}>A (5.0 pts)</option>
                          <option value={4}>B (4.0 pts)</option>
                          <option value={3}>C (3.0 pts)</option>
                          <option value={2}>D (2.0 pts)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Planned Courses List & Builder */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Planned Semester Courses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add the courses you plan to register on the UI portal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoFillCompulsory}
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fill Compulsory Courses
            </button>
          </div>

          {/* Courses Input Rows */}
          <div className="space-y-3">
            {plannedCourses.map((c, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Course Code (e.g. CSC 213)"
                  value={c.code}
                  onChange={e => handleUpdateCourse(index, 'code', e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Units"
                    value={c.units}
                    onChange={e => handleUpdateCourse(index, 'units', parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-400">Units</span>
                </div>
                {plannedCourses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(index)}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddCourse}
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Another Course
            </button>
          </div>

          {/* Department Notes */}
          {evaluation.electiveNotes && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Official Elective Guideline:</strong> {evaluation.electiveNotes}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            ← Return to Dashboard
          </Link>
          <Link
            href="/dashboard/target"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Proceed to Target Planner
          </Link>
        </div>

      </div>
    </div>
  )
}
