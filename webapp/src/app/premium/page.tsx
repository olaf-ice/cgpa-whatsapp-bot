'use client'



export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 flex flex-col items-center justify-center">
      
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Take Control of Your Grades</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Upgrade to Premium and unlock powerful features designed to help you hit that First Class target without the stress.
        </p>
      </div>

      <div className="flex justify-center max-w-4xl w-full mx-auto">
        
        {/* Premium Plan */}
        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl relative flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full max-w-md">
          <div className="absolute top-0 right-8 transform -translate-y-1/2">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
              Recommended
            </span>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">Premium Tracker</h3>
            <div className="text-4xl font-bold text-white mb-1">
              ₦1,500 <span className="text-lg text-gray-400 font-normal">/ semester</span>
            </div>
            <p className="text-sm text-gray-400">The ultimate student companion.</p>
          </div>
          
          <ul className="space-y-4 flex-1 mb-8">
            <li className="flex items-center gap-3 text-gray-300">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Automatic CGPA Tracking
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Semester Trend Charts
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Reverse Target Calculator
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              WhatsApp Query Bot & Reminders
            </li>
          </ul>

          <button 
            className="w-full py-3 px-4 text-center rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 hover:scale-[1.02] transition-transform shadow-lg shadow-yellow-500/20"
            onClick={() => alert('Paystack Checkout would open here!')}
          >
            Upgrade Now
          </button>
        </div>

      </div>
    </div>
  )
}
