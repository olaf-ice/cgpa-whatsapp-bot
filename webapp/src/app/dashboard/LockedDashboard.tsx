'use client'

import { useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { Lock, Brain, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LockedDashboardProps {
  email: string;
  name: string;
}

export default function LockedDashboard({ email, name }: LockedDashboardProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: 2000 * 100, // ₦2,000 in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
  };

  const onSuccess = async (reference: any) => {
    setIsVerifying(true)
    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.reference })
      })
      
      const data = await res.json()
      if (data.success) {
        router.refresh() // Reload the page to unlock the dashboard
      } else {
        alert("Payment verification failed. Please contact support.")
        setIsVerifying(false)
      }
    } catch (e) {
      alert("An error occurred during verification.")
      setIsVerifying(false)
    }
  }

  const onClose = () => {
    console.log('Payment closed')
  }

  const initializePayment = usePaystackPayment(config);

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Blurred background mock of the dashboard */}
      <div className="absolute inset-0 pointer-events-none filter blur-md opacity-40">
        <div className="max-w-4xl mx-auto mt-20 p-8">
           <div className="h-32 bg-blue-100 rounded-3xl mb-8"></div>
           <div className="h-64 bg-indigo-100 rounded-3xl mb-8"></div>
           <div className="flex gap-4">
             <div className="h-40 w-1/2 bg-gray-200 rounded-3xl"></div>
             <div className="h-40 w-1/2 bg-gray-200 rounded-3xl"></div>
           </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <div className="relative z-10 bg-white/80 backdrop-blur-2xl border border-white rounded-[2rem] p-8 md:p-12 shadow-2xl max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Unlock Your Insights</h2>
        <p className="text-gray-600 mb-8 font-medium leading-relaxed">
          {name.split(' ')[0]}, your results, peer rankings, and Academic insights are ready. 
          Unlock full access to your personalized Dashboard for the semester.
        </p>

        <div className="space-y-4 mb-8 text-left max-w-sm mx-auto">
          <div className="flex items-center gap-3 text-gray-700 font-medium">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> View precise CGPA calculation
          </div>
          <div className="flex items-center gap-3 text-gray-700 font-medium">
            <Brain className="w-5 h-5 text-indigo-500" /> Get smart performance insights
          </div>
          <div className="flex items-center gap-3 text-gray-700 font-medium">
            <Lock className="w-5 h-5 text-blue-500" /> See where you rank among peers
          </div>
        </div>

        <button
          onClick={() => {
            initializePayment({ onSuccess, onClose } as any)
          }}
          disabled={isVerifying}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-wait"
        >
          {isVerifying ? 'Verifying Payment...' : 'Unlock Now - ₦2,000 / Semester'}
        </button>
      </div>
    </div>
  )
}
