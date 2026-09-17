'use client'

import { useTransition } from 'react'
import { ShieldAlert, Trash2, Check, X, Shield } from 'lucide-react'
import { togglePaymentStatus, deleteStudent } from './actions'
import Link from 'next/link'

interface AdminClientProps {
  students: any[]
}

export default function AdminClient({ students }: AdminClientProps) {
  const [isPending, startTransition] = useTransition()

  const handleTogglePayment = (id: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'REVOKE' : 'GRANT'} access for this student?`)) {
      startTransition(() => {
        togglePaymentStatus(id, currentStatus)
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('CRITICAL WARNING: Are you sure you want to completely delete this student and all their grades? This cannot be undone.')) {
      startTransition(() => {
        deleteStudent(id)
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Control Panel</h1>
              <p className="text-sm text-gray-500 font-medium">{students.length} Total Students Registered</p>
            </div>
          </div>
          <Link href="/dashboard" className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
            Exit to Dashboard
          </Link>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-bold text-gray-600 uppercase text-xs tracking-wider">Name</th>
                  <th className="p-4 font-bold text-gray-600 uppercase text-xs tracking-wider">Institution</th>
                  <th className="p-4 font-bold text-gray-600 uppercase text-xs tracking-wider">Phone</th>
                  <th className="p-4 font-bold text-gray-600 uppercase text-xs tracking-wider">Access Status</th>
                  <th className="p-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{new Date(student.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">
                      {student.institution?.name}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {student.phone_number || <span className="text-gray-400 italic">Not linked</span>}
                    </td>
                    <td className="p-4">
                      {student.has_paid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                          <Check className="w-3 h-3" /> Paid / Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                          <X className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleTogglePayment(student.id, student.has_paid)}
                        disabled={isPending}
                        title={student.has_paid ? "Revoke Access" : "Grant Access"}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        disabled={isPending}
                        title="Delete Student"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                      No students found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
