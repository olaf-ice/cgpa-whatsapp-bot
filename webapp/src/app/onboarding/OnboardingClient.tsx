'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { saveProfile } from './actions'

type Institution = {
  id: string;
  name: string;
  type: string;
  grading_scale: number;
}

export default function OnboardingClient({ institutions, referredBy }: { institutions: Institution[], referredBy: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [step, setStep] = useState(1)
  const [institution, setInstitution] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [level, setLevel] = useState<string>('100')
  const [courseOfStudy, setCourseOfStudy] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [matricNumber, setMatricNumber] = useState<string>('')
  
  const selectedInstData = institutions.find(i => i.id === institution)

  // Filter institutions based on search
  const filteredInstitutions = useMemo(() => {
    if (!searchQuery) return institutions;
    return institutions.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [institutions, searchQuery]);

  // Dynamic theme classes based on selected institution
  const getThemeClasses = () => {
    if (!selectedInstData) return 'from-gray-500 to-gray-600'
    if (selectedInstData.type === 'Federal University' && selectedInstData.name.includes('Ibadan')) return 'from-blue-700 to-yellow-500' // UI Blue & Gold
    if (selectedInstData.name.includes('Lagos')) return 'from-red-800 to-red-600' // UNILAG Maroon
    if (selectedInstData.type === 'Polytechnic') return 'from-emerald-700 to-emerald-500' // Generic Poly Theme
    return 'from-blue-600 to-blue-800' // Default University theme
  }

  const handleSaveProfile = () => {
    startTransition(async () => {
      const response = await saveProfile({
        name,
        matric_number: matricNumber,
        institution_id: institution,
        course: courseOfStudy,
        level: parseInt(level),
        referredBy
      })
      
      if (response?.error) {
        alert(response.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-xl p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's get to know you.</h2>
              <p className="text-gray-500">What are your basic details?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matriculation Number</label>
                <input
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                  placeholder="e.g. 123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course of Study</label>
                <input
                  type="text"
                  value={courseOfStudy}
                  onChange={(e) => setCourseOfStudy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!name || !courseOfStudy || !matricNumber}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50 transition-all hover:bg-gray-800"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Institution</h2>
              <p className="text-gray-500">This configures your exact grading scale.</p>
            </div>

            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white mb-4"
                placeholder="Search institutions..."
              />
            </div>
            
            <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
              {filteredInstitutions.length > 0 ? (
                filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setInstitution(inst.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col ${
                      institution === inst.id 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{inst.name}</span>
                    <span className="text-sm text-gray-500 flex justify-between mt-1">
                      <span>{inst.type}</span>
                      <span className="font-medium text-blue-600">{Number(inst.grading_scale).toFixed(1)} Scale</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No institutions found.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-200 rounded-xl font-medium">Back</button>
              <button 
                onClick={() => setStep(3)}
                disabled={!institution}
                className={`flex-1 py-3 bg-gradient-to-r ${getThemeClasses()} text-white rounded-xl font-medium disabled:opacity-50 transition-all`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What level are you starting from?</h2>
              <p className="text-gray-500">Direct Entry students usually start at 200L.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {['100', '200', '300', '400', '500', '600', '700'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    level === lvl 
                      ? `border-transparent bg-gradient-to-br ${getThemeClasses()} text-white font-bold shadow-md` 
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  {lvl} Level
                </button>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl mt-6 border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Profile Summary</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><span className="font-medium text-gray-900">{name}</span></li>
                <li>{courseOfStudy}</li>
                <li>{selectedInstData?.name}</li>
                <li>Starting at {level} Level</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="px-6 py-3 border border-gray-200 rounded-xl font-medium">Back</button>
              <button 
                onClick={handleSaveProfile}
                disabled={isPending}
                className={`flex-1 py-3 bg-gradient-to-r ${getThemeClasses()} text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
              >
                {isPending ? 'Saving...' : 'Save & Go to Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
