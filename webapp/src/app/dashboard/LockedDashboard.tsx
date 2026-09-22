'use client'

import { Lock, Brain, TrendingUp } from 'lucide-react'
import { usePaystackPayment } from 'react-paystack'

interface LockedDashboardProps {
  email: string;
  name: string;
}

export default function LockedDashboard({ email, name }: LockedDashboardProps) {

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: 2000 * 100, // 2000 NGN in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
      custom_fields: [
        {
          display_name: "App Name",
          variable_name: "app_name",
          value: "cgpa_bot"
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    console.log('Payment successful. Reference:', reference);
    alert('Payment of ₦2000 received for CGPA Bot! Admin is verifying.');
  };

  const onClose = () => {
    console.log('Payment popup closed');
  };

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

        {/* Payment Options */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-left">
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span>Bank Name</span>
                <span className="font-bold text-gray-900">Guaranty Trust Bank</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span>Account Name</span>
                <span className="font-bold text-gray-900">Oladipupo Timileyin Simeon</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span>Account Number</span>
                <span className="font-bold text-gray-900 text-lg tracking-wider">0253138467</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span>Amount</span>
                <span className="font-black text-blue-600 text-lg">₦2,000</span>
              </div>
            </div>
            <button 
              onClick={() => {
                initializePayment({ onSuccess, onClose });
              }}
              className="block w-full py-3 bg-[#0ba4db] hover:bg-[#0a8cb8] text-white text-center rounded-xl font-bold transition-all shadow-md shadow-blue-500/20"
            >
              Pay with Paystack
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Payments are securely processed by Paystack.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
