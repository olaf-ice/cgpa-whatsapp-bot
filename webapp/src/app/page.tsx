import Link from "next/link";
import { Brain, Target, TrendingUp, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 translate-x-1/3 -translate-y-1/3 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-20 -translate-x-1/3 translate-y-1/3" />

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/30">
            C
          </div>
          <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-indigo-900 tracking-tight">
            FirstClass.ng
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          The Ultimate Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Success Engine</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 font-medium mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Track your CGPA, forecast your degree class, and discover exactly what you need to score next semester to dominate your department.
        </p>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1"
          >
            Get Started Now
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl font-bold text-lg shadow-sm transition-all hover:-translate-y-1"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights (Glassmorphic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-8 text-left shadow-xl shadow-gray-200/50">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Precise Calculation</h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              Log your grades and watch your CGPA update instantly. Tailored to your University or Polytechnic's exact grading scale.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-8 text-left shadow-xl shadow-gray-200/50">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Target Planner</h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              Want a 4.5? We'll tell you the exact grades you need to hit in your next semester to reach your dream CGPA.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-8 text-left shadow-xl shadow-gray-200/50">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Insights & Ranking</h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              See where you rank against your course mates and get intelligent insights on how to optimize your study effort.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
