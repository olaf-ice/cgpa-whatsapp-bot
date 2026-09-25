'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Home, Target, PlusCircle, Settings, Crown, LogOut, TrendingUp, Brain, Mail, ShieldAlert, Users } from 'lucide-react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import CountUp from 'react-countup'
import { toggleEmailReminders } from './actions'

const getThemeColors = (institution: string) => {
  const instLower = institution.toLowerCase();
  
  if (instLower.includes('ibadan')) {
    return {
      bgGradient: 'from-blue-100/40 via-gray-50 to-yellow-100/40',
      primaryBlob: 'from-blue-400 to-blue-600',
      secondaryBlob: 'from-yellow-400 to-yellow-500',
      bragCardBg: 'from-blue-900 to-blue-800',
      iconBox: 'from-blue-600 to-blue-800',
      iconBoxShadow: 'shadow-blue-500/20',
      textGradient: 'from-blue-900 to-blue-700',
      chartStroke: '#1d4ed8',
      chartStop1: '#1d4ed8',
      chartStop2: '#eab308',
      action1Bg: 'bg-blue-600',
      action1Shadow: 'shadow-blue-500/30',
      action1Blob: 'bg-blue-100',
      action2Bg: 'bg-yellow-500',
      action2Shadow: 'shadow-yellow-500/30',
      action2Blob: 'bg-yellow-100',
      badgeBg: 'bg-yellow-50',
      badgeText: 'text-yellow-700',
    };
  }
  
  if (instLower.includes('lagos')) {
    return {
      bgGradient: 'from-red-100/40 via-gray-50 to-rose-100/40',
      primaryBlob: 'from-red-400 to-red-600',
      secondaryBlob: 'from-rose-400 to-rose-500',
      bragCardBg: 'from-red-900 to-red-800',
      iconBox: 'from-red-600 to-red-800',
      iconBoxShadow: 'shadow-red-500/20',
      textGradient: 'from-red-900 to-red-700',
      chartStroke: '#b91c1c',
      chartStop1: '#b91c1c',
      chartStop2: '#fda4af',
      action1Bg: 'bg-red-600',
      action1Shadow: 'shadow-red-500/30',
      action1Blob: 'bg-red-100',
      action2Bg: 'bg-rose-600',
      action2Shadow: 'shadow-rose-500/30',
      action2Blob: 'bg-rose-100',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
    };
  }

  // Default Theme
  return {
      bgGradient: 'from-blue-100/40 via-gray-50 to-purple-100/40',
      primaryBlob: 'from-blue-400 to-indigo-500',
      secondaryBlob: 'from-purple-400 to-pink-500',
      bragCardBg: 'from-blue-900 to-indigo-900',
      iconBox: 'from-blue-600 to-indigo-600',
      iconBoxShadow: 'shadow-blue-500/20',
      textGradient: 'from-blue-900 to-indigo-900',
      chartStroke: '#4f46e5',
      chartStop1: '#4f46e5',
      chartStop2: '#4f46e5', 
      action1Bg: 'bg-blue-600',
      action1Shadow: 'shadow-blue-500/30',
      action1Blob: 'bg-blue-100',
      action2Bg: 'bg-purple-600',
      action2Shadow: 'shadow-purple-500/30',
      action2Blob: 'bg-purple-100',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-600',
  };
}

interface DashboardClientProps {
  studentData: {
    name: string;
    matricNumber?: string;
    institution: string;
    courseOfStudy?: string;
    scale: number;
    currentCGPA: number;
    trendData: { semester: string, gpa: number }[];
    phoneNumber?: string | null;
    percentileRank?: number;
    numericRank?: number;
    totalPeers?: number;
    coachInsight?: string;
    emailRemindersEnabled?: boolean;
    isAdmin: boolean;
    referralCode?: string;
    referralsCount?: number;
    isAnonymous?: boolean;
    outstandingCarryovers?: { code: string, level: number, term: number, units: number }[];
    totalUnitsRegistered?: number;
    totalUnitsPassed?: number;
    targetGraduationUnits?: number;
  }
}

export default function DashboardClient({ studentData }: DashboardClientProps) {

  const [, startTransition] = useTransition()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  
  const [emailEnabled, setEmailEnabled] = useState(studentData.emailRemindersEnabled ?? true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showCarryoverModal, setShowCarryoverModal] = useState(false)

  useEffect(() => {
    const hasCarryovers = studentData.outstandingCarryovers && studentData.outstandingCarryovers.length > 0;
    if (hasCarryovers) {
      const hasSeen = sessionStorage.getItem('hasSeenCarryoverModal');
      if (!hasSeen) {
        setTimeout(() => {
          setShowCarryoverModal(true);
          sessionStorage.setItem('hasSeenCarryoverModal', 'true');
        }, 0);
      }
    }
  }, [studentData.outstandingCarryovers]);

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const handleToggleEmail = () => {
    const newVal = !emailEnabled;
    setEmailEnabled(newVal);
    startTransition(() => {
      toggleEmailReminders(newVal);
    });
  }

  // handleSavePhone was here

  const getDegreeClass = (cgpa: number) => {
    if (studentData.scale === 7.0) {
      if (cgpa >= 6.0) return 'First Class'
      if (cgpa >= 4.6) return 'Second Class Upper'
      if (cgpa >= 2.6) return 'Second Class Lower'
      if (cgpa >= 1.5) return 'Third Class'
      return 'Pass'
    } else if (studentData.scale === 5.0) {
      if (cgpa >= 4.5) return 'First Class'
      if (cgpa >= 3.5) return 'Second Class Upper'
      if (cgpa >= 2.4) return 'Second Class Lower'
      if (cgpa >= 1.5) return 'Third Class'
      return 'Pass'
    } else {
      if (cgpa >= 3.5) return 'Distinction'
      if (cgpa >= 3.0) return 'Upper Credit'
      if (cgpa >= 2.5) return 'Lower Credit'
      if (cgpa >= 2.0) return 'Pass'
      return 'Fail'
    }
  }

  const handleShare = async () => {
    setIsCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('brag-card');
      if (element) {
        // Unhide temporarily to capture
        element.style.display = 'block';
        const canvas = await html2canvas(element, { scale: 3, backgroundColor: null });
        element.style.display = 'none';

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `MyGPA_${studentData.name.replace(/\s+/g, '_')}.png`;
        link.click();
      }
    } catch (e) {
      console.error('Error generating card:', e);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }

  // degreeClass unused
  
  // Probation logic
  const isProbationRisk = studentData.scale === 5.0 ? studentData.currentCGPA < 1.5 : studentData.currentCGPA < 2.0;

  // Projection logic
  const boostGPA = studentData.scale === 5.0 ? 4.5 : 6.0; // Assume they perform extremely well next semester
  const projectedBoost = ((studentData.currentCGPA * 60) + (boostGPA * 20)) / 80; // Rough 80-unit future projection
  const currentDegree = getDegreeClass(studentData.currentCGPA);
  const projectedDegree = getDegreeClass(projectedBoost);
  
  const theme = getThemeColors(studentData.institution);

  // Target Calculator logic
  let targetCalculatorUI = null;
  if (studentData.targetGraduationUnits && studentData.totalUnitsRegistered !== undefined && studentData.currentCGPA !== undefined) {
    const unitsRemaining = studentData.targetGraduationUnits - (studentData.totalUnitsPassed || 0);
    if (unitsRemaining > 0) {
      const currentPoints = studentData.currentCGPA * studentData.totalUnitsRegistered;
      const expectedTotalRegistered = studentData.totalUnitsRegistered + unitsRemaining;
      
      const calculateRequiredGPA = (targetCGPA: number) => {
        const requiredTotalPoints = targetCGPA * expectedTotalRegistered;
        const pointsNeeded = requiredTotalPoints - currentPoints;
        const requiredGPA = pointsNeeded / unitsRemaining;
        return requiredGPA;
      }

      const reqFirstClass = calculateRequiredGPA(studentData.scale === 5.0 ? 4.5 : 3.5);
      const reqSecondUpper = calculateRequiredGPA(studentData.scale === 5.0 ? 3.5 : 3.0);

      targetCalculatorUI = (
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Graduation Target Calculator</h3>
          </div>
          <p className="text-gray-600 mb-6 text-sm">
            You have <strong className="text-gray-900">{unitsRemaining} units left</strong> to pass. Here is the average GPA you need in those remaining units to hit your target class of degree:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border ${reqFirstClass <= studentData.scale && reqFirstClass > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{studentData.scale === 5.0 ? 'First Class' : 'Distinction'}</p>
              {reqFirstClass > studentData.scale ? (
                <p className="text-sm font-bold text-gray-400 mt-2">Mathematically impossible 😔</p>
              ) : reqFirstClass <= 0 ? (
                <p className="text-sm font-bold text-emerald-600 mt-2">You've already secured this! 🎉</p>
              ) : (
                <p className="text-3xl font-black text-emerald-600">{reqFirstClass.toFixed(2)} <span className="text-sm font-semibold text-emerald-700">GPA required</span></p>
              )}
            </div>
            <div className={`p-4 rounded-2xl border ${reqSecondUpper <= studentData.scale && reqSecondUpper > 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{studentData.scale === 5.0 ? 'Second Class Upper' : 'Upper Credit'}</p>
              {reqSecondUpper > studentData.scale ? (
                <p className="text-sm font-bold text-gray-400 mt-2">Mathematically impossible 😔</p>
              ) : reqSecondUpper <= 0 ? (
                <p className="text-sm font-bold text-blue-600 mt-2">You've already secured this! 🎉</p>
              ) : (
                <p className="text-3xl font-black text-blue-600">{reqSecondUpper.toFixed(2)} <span className="text-sm font-semibold text-blue-700">GPA required</span></p>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`flex h-screen bg-gray-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.bgGradient} overflow-hidden relative`}>
      
      {/* Hidden Brag Card for html2canvas */}
      <div id="brag-card" className={`hidden absolute left-[-9999px] top-[-9999px] w-[500px] h-[600px] bg-gradient-to-br ${theme.bragCardBg} p-10 rounded-[3rem] text-white overflow-hidden shadow-2xl`}>
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-30 mix-blend-screen" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-30 mix-blend-screen" />
         <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-blue-200 font-black tracking-widest uppercase text-sm mb-1">{studentData.institution}</p>
              <h2 className="text-4xl font-black leading-tight mb-6">{studentData.name}</h2>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Departmental Rank</p>
                <p className="text-4xl font-black text-white">#{studentData.numericRank} <span className="text-xl text-blue-200 font-semibold">/ {studentData.totalPeers}</span></p>
                <p className="text-blue-200 mt-2 font-medium mb-4">{studentData.courseOfStudy} {studentData.matricNumber && `• ${studentData.matricNumber}`}</p>
                
                <Link href="/dashboard/leaderboard" className="inline-block bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-bold px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  View Full Leaderboard →
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/20 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-900 font-black text-xl">C</div>
                <span className="font-black text-xl">MyGPA.com.ng</span>
              </div>
              <p className="text-blue-200 font-bold">Top {studentData.percentileRank}%</p>
            </div>
         </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white/60 backdrop-blur-xl border-r border-gray-200/60 p-6 h-full shadow-sm z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className={`w-10 h-10 bg-gradient-to-br ${theme.iconBox} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${theme.iconBoxShadow}`}>
            C
          </div>
          <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.textGradient}`}>
            MyGPA.com.ng
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {studentData.isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold transition-all mb-4 border border-red-100">
              <ShieldAlert className="w-5 h-5" />
              Admin Panel
            </Link>
          )}
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-700 rounded-xl font-semibold transition-all">
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/dashboard/entry" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-medium transition-all group">
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Log Semester
          </Link>
          <Link href="/dashboard/target" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-medium transition-all group">
            <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Target Planner
          </Link>
          <Link href="/onboarding" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-medium transition-all group">
            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Edit Profile
          </Link>

        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200/60">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-6 md:p-10 relative z-10 pb-24 md:pb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          
          {/* Anonymous Account Banner */}
          {studentData.isAnonymous && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-600/20 flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                 <h3 className="font-black text-xl flex items-center gap-2">
                    🔒 Save Your Progress
                 </h3>
                 <p className="font-medium mt-1 opacity-90">Your CGPA data is currently unsaved. Create an account to access it on any device.</p>
               </div>
               <Link href="/login" className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl shrink-0 hover:bg-blue-50 transition-colors">
                 Save Account
               </Link>
            </div>
          )}

          {/* Probation Warning */}
          {isProbationRisk && (
            <div className="bg-red-600 text-white p-6 rounded-3xl shadow-xl shadow-red-600/20 flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce">
               <div>
                 <h3 className="font-black text-xl flex items-center gap-2">
                    ⚠️ DANGER: ACADEMIC PROBATION RISK
                 </h3>
                 <p className="font-medium mt-1 opacity-90">Your CGPA is dangerously low. Use the Target Planner immediately to see what you need to score next semester to survive.</p>
               </div>
               <Link href="/dashboard/target" className="bg-white text-red-600 font-bold px-6 py-3 rounded-xl shrink-0 hover:bg-red-50 transition-colors">
                 Save My Grades
               </Link>
            </div>
          )}

          {/* Outstanding Carryovers Warning */}
          {studentData.outstandingCarryovers && studentData.outstandingCarryovers.length > 0 && (
             <div className="bg-red-50 border border-red-100 rounded-3xl p-6 md:p-8 shadow-sm">
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                   <ShieldAlert className="w-8 h-8" />
                 </div>
                 <div className="w-full">
                   <h3 className="text-xl font-bold text-red-900 mb-2">
                     🚨 Outstanding Carryovers
                   </h3>
                   <p className="text-red-800 font-medium mb-4">
                     You have {studentData.outstandingCarryovers.length} course(s) you must retake and pass to graduate. Here is when you can register for them:
                   </p>
                   <div className="flex flex-col gap-3 max-w-sm">
                     {studentData.outstandingCarryovers.filter(c => c.term === 1).length > 0 && (
                       <div className="bg-white/60 p-4 rounded-xl border border-red-200">
                         <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">First Semester</p>
                         <p className="text-lg font-bold text-red-900">{studentData.outstandingCarryovers.filter(c => c.term === 1).map(c => c.code).join(', ')}</p>
                       </div>
                     )}
                     {studentData.outstandingCarryovers.filter(c => c.term === 2).length > 0 && (
                       <div className="bg-white/60 p-4 rounded-xl border border-red-200">
                         <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Second Semester</p>
                         <p className="text-lg font-bold text-red-900">{studentData.outstandingCarryovers.filter(c => c.term === 2).map(c => c.code).join(', ')}</p>
                       </div>
                     )}
                   </div>
                </div>
             </div>
          </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Hello, {studentData.name.split(' ')[0]} 👋
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  {studentData.institution} • {studentData.scale.toFixed(1)} Scale
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {studentData.matricNumber && (
                    <p className="text-blue-600 font-bold tracking-wider uppercase text-sm border-r border-gray-300 pr-3">
                      {studentData.matricNumber}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gray-600">
                    Registered: <span className="text-gray-900">{studentData.totalUnitsRegistered ?? 0}</span> Units
                  </p>
                  <p className="text-sm font-semibold text-emerald-600">
                    Passed: <span className="text-emerald-700">{studentData.totalUnitsPassed ?? 0}</span> Units
                  </p>
                </div>
                {studentData.targetGraduationUnits ? (
                  <div className="mt-4 max-w-sm">
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      <span>Progress to Graduation</span>
                      <span className="text-indigo-600">{studentData.totalUnitsPassed ?? 0} / {studentData.targetGraduationUnits} Units ({Math.round(((studentData.totalUnitsPassed ?? 0) / studentData.targetGraduationUnits) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${studentData.outstandingCarryovers && studentData.outstandingCarryovers.length > 0 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} style={{ width: `${Math.min(100, ((studentData.totalUnitsPassed ?? 0) / studentData.targetGraduationUnits) * 100)}%` }}></div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/transcript" className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all">
                  View Records
                </Link>
              </div>
            </div>
          </div>

          {targetCalculatorUI}

          {/* Glassmorphic CGPA Card */}
          <motion.div 
            onMouseMove={handleMouseMove}
            className="group relative overflow-hidden rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-blue-900/10 border border-white/50 bg-white/40 backdrop-blur-2xl"
          >
            <motion.div
              className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
              style={{
                background: useMotionTemplate`
                  radial-gradient(
                    650px circle at ${mouseX}px ${mouseY}px,
                    rgba(255,255,255,0.8),
                    transparent 80%
                  )
                `,
              }}
            />
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${theme.primaryBlob} rounded-full blur-3xl opacity-30 animate-pulse`} />
            <div className={`absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr ${theme.secondaryBlob} rounded-full blur-3xl opacity-20`} />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-gray-600 font-semibold uppercase tracking-widest text-sm mb-2">Current CGPA</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 tracking-tight">
                    <CountUp end={studentData.currentCGPA} decimals={2} duration={2} separator="," />
                  </span>
                  <span className="text-2xl font-semibold text-gray-400">
                    / {studentData.scale.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-white/70 shadow-sm border border-white/60 rounded-3xl backdrop-blur-md flex flex-col items-center gap-1 min-w-[200px]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center w-full border-b border-gray-100 pb-2 mb-1">{studentData.courseOfStudy || 'Department'} Rank</span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="font-black text-blue-700 text-3xl">#{studentData.numericRank}</span>
                  <span className="font-semibold text-gray-400 text-lg mb-1">/ {studentData.totalPeers}</span>
                </div>
                <span className={`text-[10px] font-bold ${theme.badgeText} mt-1 ${theme.badgeBg} px-2 py-0.5 rounded-md`}>Top {studentData.percentileRank}%</span>
              </div>
            </div>
            
            {/* Mobile Share Button */}
            <button 
                onClick={handleShare}
                disabled={isCapturing}
                className="md:hidden mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                <Crown className="w-5 h-5" />
                {isCapturing ? 'Generating Card...' : 'Share My Rank'}
              </button>
          </motion.div>

          {/* Destiny Projection */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 md:p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                 <Target className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">Class of 20XX Projection</h3>
             </div>
             <p className="text-gray-700 font-medium leading-relaxed">
               At your current pace, you are on track to graduate with a <strong className="text-amber-700">{currentDegree}</strong>. 
               {currentDegree !== projectedDegree ? (
                 <span> However, if you lock in and score highly next semester, you could cross into <strong className="text-emerald-600">{projectedDegree}</strong> territory.</span>
               ) : (
                 <span> Keep pushing hard to secure this class of degree.</span>
               )}
             </p>
          </div>

          {/* AI Coach Insights */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Brain className="w-40 h-40 text-indigo-600" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Insights</h3>
                <p className="text-gray-700 font-medium leading-relaxed max-w-2xl">
                  {studentData.coachInsight}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}>
              <Link href="/dashboard/entry" className="block group relative h-full bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${theme.action1Blob} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${theme.action1Bg} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg ${theme.action1Shadow}`}>
                    <PlusCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Log New Semester</h3>
                  <p className="text-gray-500 text-sm">Add your latest courses and grades to instantly update your CGPA.</p>
                </div>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}>
              <Link href="/dashboard/target" className="block group relative h-full bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${theme.action2Blob} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${theme.action2Bg} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg ${theme.action2Shadow}`}>
                    <Target className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Target Planner</h3>
                  <p className="text-gray-500 text-sm">Calculate exactly what grades you need next semester to hit your dream CGPA.</p>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Trend Chart (Glassmorphic) */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Performance Trend</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentData.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.chartStop1} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.chartStop2} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="semester" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, studentData.scale]} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700, color: theme.chartStroke }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gpa" 
                    stroke={theme.chartStroke} 
                    fillOpacity={1}
                    fill="url(#colorGpa)"
                    strokeWidth={4}
                    activeDot={{ r: 8, fill: theme.chartStroke, stroke: '#fff', strokeWidth: 2, className: 'drop-shadow-md' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WhatsApp Connection Card - Temporarily Hidden
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <MessageCircle className="w-32 h-32 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
                Connect WhatsApp Bot
              </h3>
              <p className="text-gray-600 mb-6 text-sm max-w-md">
                Get your CGPA, required targets, and log results directly from WhatsApp! Enter your phone number below to link your account.
              </p>
              
              <div className="flex flex-col gap-2 max-w-sm">
                <div className="flex gap-2">
                  <input 
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <button 
                    onClick={handleSavePhone}
                    disabled={isPending || phone === studentData.phoneNumber}
                    className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? 'Saving...' : 'Connect'}
                  </button>
                </div>
                {phoneError && <p className="text-red-500 text-sm font-medium">{phoneError}</p>}
                {phoneSuccess && (
                  <p className="text-emerald-600 text-sm font-bold flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4" /> Successfully connected! Try texting "CGPA" to the bot.
                  </p>
                )}
                {!phoneSuccess && !phoneError && studentData.phoneNumber && (
                  <p className="text-emerald-700 text-sm font-bold flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4" /> Connected as {studentData.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
          */}

          {/* Referral Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Remind a Friend
                </h3>
                <p className="text-gray-600 mb-4 text-sm max-w-md">
                  Students often lose track of courses they need to pass, which can lead to an unexpected extra year. Share this link to help your friends stay on track and graduate on time!
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-white border border-indigo-200 text-indigo-700 font-mono font-bold px-4 py-2 rounded-xl text-sm select-all">
                    {studentData.referralCode ? `https://mygpa.com.ng/onboarding?ref=${studentData.referralCode}` : 'Not available'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 md:px-8 text-center border border-indigo-100 shadow-sm min-w-[150px]">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Friends Reminded</p>
                <p className="text-4xl font-black text-indigo-600">{studentData.referralsCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Email Accountability Preferences */}
          <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Weekly Accountability Emails</h3>
                <p className="text-sm text-gray-500">Get a study plan and motivation email every Sunday to prep for the week.</p>
              </div>
              <button 
                onClick={handleToggleEmail}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${emailEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

        </motion.div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-200/60 z-30 pb-safe">
        <div className="flex justify-around items-center p-3">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-600">
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link href="/dashboard/entry" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Log</span>
          </Link>
          <Link href="/dashboard/target" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
            <Target className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Target</span>
          </Link>
          <Link href="/onboarding" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
          <button onClick={handleSignOut} className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Sign Out</span>
          </button>
          {studentData.isAdmin && (
            <Link href="/admin" className="flex flex-col items-center gap-1 text-red-500 hover:text-red-600 transition-colors">
              <ShieldAlert className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Carryover Reminder Modal */}
      {showCarryoverModal && studentData.outstandingCarryovers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-center mb-2">Registration Reminder</h3>
            <p className="text-gray-600 text-center mb-6">
              Welcome back! Don't forget that you have <span className="font-bold text-red-600">{studentData.outstandingCarryovers.length} carryover course(s)</span> you MUST register for this semester to stay on track.
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {studentData.outstandingCarryovers.filter(c => c.term === 1).length > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">First Semester</p>
                  <p className="text-lg font-bold text-red-900">{studentData.outstandingCarryovers.filter(c => c.term === 1).map(c => c.code).join(', ')}</p>
                </div>
              )}
              {studentData.outstandingCarryovers.filter(c => c.term === 2).length > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Second Semester</p>
                  <p className="text-lg font-bold text-red-900">{studentData.outstandingCarryovers.filter(c => c.term === 2).map(c => c.code).join(', ')}</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowCarryoverModal(false)}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              I got it, thanks!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
