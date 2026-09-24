'use client'

import { useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import Link from 'next/link'
import { ArrowLeft, Target, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface TargetClientProps {
  currentCGPA: number;
  totalCreditUnits: number;
  totalGradePoints: number;
  scale: number;
  email: string;
}

export default function TargetClient({ currentCGPA, totalCreditUnits, totalGradePoints, scale, email }: TargetClientProps) {

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email, 
    amount: 2000 * 100, 
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
      custom_fields: [
        {
          display_name: "App Name",
          variable_name: "app_name",
          value: "mygpa"
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    console.log('Payment successful. Reference:', reference);
    alert('Payment of ₦2000 received for MyGPA!');
  };

  const onClose = () => {
    console.log('Payment popup closed');
  };

  const [targetCGPA, setTargetCGPA] = useState<number | ''>('')
  const [plannedUnits, setPlannedUnits] = useState<number | ''>('')

  const calculateRequiredGPA = () => {
    if (!targetCGPA || !plannedUnits) return null;

    const t = Number(targetCGPA)
    const p = Number(plannedUnits)

    if (p <= 0) return null;

    // Formula: Target = (CurrentPoints + RequiredPoints) / (CurrentUnits + PlannedUnits)
    // RequiredPoints = Target * (CurrentUnits + PlannedUnits) - CurrentPoints
    const requiredPoints = t * (totalCreditUnits + p) - totalGradePoints;
    const requiredGPA = requiredPoints / p;

    return requiredGPA;
  }

  const requiredGPA = calculateRequiredGPA();
  
  let statusMessage = null;
  let StatusIcon = null;
  let statusColor = '';

  if (requiredGPA !== null) {
    if (requiredGPA > scale) {
      statusMessage = `Mathematically impossible. You would need a ${requiredGPA.toFixed(2)} GPA, but your maximum scale is ${scale.toFixed(1)}.`
      StatusIcon = AlertTriangle
      statusColor = 'text-red-500 bg-red-50 border-red-200'
    } else if (requiredGPA < 0) {
      statusMessage = `You've already secured this! Even if you score 0.0 next semester, you will stay above ${Number(targetCGPA).toFixed(2)}.`
      StatusIcon = CheckCircle2
      statusColor = 'text-emerald-500 bg-emerald-50 border-emerald-200'
    } else {
      statusMessage = `You need a semester GPA of exactly ${requiredGPA.toFixed(2)} to hit your target of ${Number(targetCGPA).toFixed(2)}.`
      StatusIcon = Target
      statusColor = 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100/40 via-gray-50 to-blue-100/40 py-10 px-6 md:px-12">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-4 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Target Planner</h1>
            <p className="text-gray-500 mt-1">Calculate the exact grades you need next semester.</p>
          </div>
          <div className="w-14 h-14 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white">
            <Calculator className="w-7 h-7 text-purple-600" />
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm">
            <p className="text-sm font-semibold text-gray-500 uppercase">Current CGPA</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">{currentCGPA.toFixed(2)}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm">
            <p className="text-sm font-semibold text-gray-500 uppercase">Total Units Taken</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">{totalCreditUnits}</p>
          </div>
        </div>

        {/* Calculator Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-purple-900/5 border border-white/50 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-3xl opacity-20" />
          
          <div className="relative z-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">Target CGPA (e.g. 4.5)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Target className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={scale}
                    value={targetCGPA}
                    onChange={(e) => setTargetCGPA(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white/50 border border-gray-200 text-gray-900 font-bold text-lg rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="Enter dream CGPA"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">Planned Units (e.g. 15)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calculator className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={plannedUnits}
                    onChange={(e) => setPlannedUnits(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white/50 border border-gray-200 text-gray-900 font-bold text-lg rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="Units next semester"
                  />
                </div>
              </div>

            </div>

            {/* Results Section */}
            {requiredGPA !== null && StatusIcon && (
              <div className={`mt-8 p-6 rounded-2xl border ${statusColor} animate-in fade-in slide-in-from-top-4 duration-500 flex items-start gap-4 shadow-sm`}>
                <StatusIcon className="w-8 h-8 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-1">Result</h3>
                  <p className="font-medium text-lg opacity-90 leading-relaxed">
                    {statusMessage}
                  </p>
                </div>
              </div>
            )}

            {requiredGPA === null && (
              <div className="mt-8 p-6 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-center text-gray-500 font-medium">
                Enter your target and planned units to see results.
              </div>
            )}
            
          </div>
        </div>


        {/* Premium Upgrade Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => { initializePayment({ onSuccess: onSuccess as any, onClose }) }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            Upgrade to Premium Tracker (₦2,000)
          </button>
        </div>

      </div>
    </div>
  )
}
