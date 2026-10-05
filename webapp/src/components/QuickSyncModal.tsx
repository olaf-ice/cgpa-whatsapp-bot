'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { quickPortalSync, CarryoverItem } from '@/app/dashboard/quick-sync-actions'
import { useRouter } from 'next/navigation'

interface QuickSyncModalProps {
  isOpen: boolean
  onClose: () => void
  currentScale?: number
  defaultCGPA?: number
}

export default function QuickSyncModal({
  isOpen,
  onClose,
  currentScale = 5.0,
  defaultCGPA
}: QuickSyncModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [cgpa, setCgpa] = useState<string>(defaultCGPA && defaultCGPA > 0 ? defaultCGPA.toString() : '')
  const [totalUnits, setTotalUnits] = useState<string>('')
  const [hasCarryovers, setHasCarryovers] = useState<boolean>(false)
  const [carryovers, setCarryovers] = useState<CarryoverItem[]>([
    { code: '', units: 3 }
  ])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAddCarryover = () => {
    setCarryovers(prev => [...prev, { code: '', units: 3 }])
  }

  const handleRemoveCarryover = (index: number) => {
    setCarryovers(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateCarryover = (index: number, field: keyof CarryoverItem, value: any) => {
    setCarryovers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const numCgpa = parseFloat(cgpa)
    const numUnits = parseInt(totalUnits, 10)

    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > currentScale) {
      setErrorMsg(`Please enter a valid CGPA between 0.0 and ${currentScale.toFixed(1)}.`)
      return
    }

    if (isNaN(numUnits) || numUnits <= 0) {
      setErrorMsg('Please enter the total credit units you have registered so far.')
      return
    }

    startTransition(async () => {
      const filteredCarryovers = hasCarryovers 
        ? carryovers.filter(c => c.code.trim().length > 0)
        : []

      const res = await quickPortalSync({
        currentCGPA: numCgpa,
        totalUnits: numUnits,
        carryovers: filteredCarryovers
      })

      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Academic profile synced with your school portal!')
        setTimeout(() => {
          onClose()
          router.refresh()
        }, 1200)
      }
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 text-left"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Quick Sync from School Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skip typing past semesters. Sync in 15 seconds.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 mb-6 leading-relaxed">
            Enter your current results as shown on your university portal. This immediately unlocks your <strong>Target Planner</strong>, <strong>Graduation Projection</strong>, and <strong>Carryover Strategy</strong>.
          </p>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Current CGPA (Scale: {currentScale.toFixed(1)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={currentScale}
                  value={cgpa}
                  onChange={e => setCgpa(e.target.value)}
                  placeholder={`e.g. 3.72`}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Total Units Registered
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={totalUnits}
                  onChange={e => setTotalUnits(e.target.value)}
                  placeholder="e.g. 64"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Carryovers Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Do you have any failed courses / carryovers?
                </span>
                <button
                  type="button"
                  onClick={() => setHasCarryovers(!hasCarryovers)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hasCarryovers ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      hasCarryovers ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasCarryovers && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    List your failed courses from the portal so the Registration Advisor can plan your recovery:
                  </p>
                  
                  {carryovers.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Course (e.g. MAT 111)"
                        value={item.code}
                        onChange={e => handleUpdateCarryover(index, 'code', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Units"
                        value={item.units}
                        onChange={e => handleUpdateCarryover(index, 'units', parseInt(e.target.value) || 3)}
                        className="w-20 px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                      {carryovers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCarryover(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddCarryover}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Carryover
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Save & Sync
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
