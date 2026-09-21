'use client'

import { Trophy, Medal, ChevronLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { useState, useEffect } from 'react'

interface Peer {
  id: string;
  name: string;
  cgpa: number;
  level: number;
}

interface LeaderboardClientProps {
  peers: Peer[];
  institutionName: string;
  courseOfStudy: string;
  scale: number;
}

export default function LeaderboardClient({ peers, institutionName, courseOfStudy, scale }: LeaderboardClientProps) {
  const { width, height } = useWindowSize()
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Variants for staggered list
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  const podiumVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 pb-24">
      {showConfetti && peers.length > 0 && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> Department Leaderboard
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              {courseOfStudy} • {institutionName}
            </p>
          </div>
        </div>

        {/* Podium (Top 3) */}
        {peers.length >= 3 && (
          <motion.div 
            initial="hidden" animate="show" variants={containerVariants}
            className="flex justify-center items-end gap-2 md:gap-6 mb-12 h-48 mt-8"
          >
            {/* Rank 2 */}
            <motion.div variants={podiumVariants} className="flex flex-col items-center w-1/3">
              <div className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm mb-2 truncate max-w-[100px] md:max-w-none text-center">
                {peers[1].name.split(' ')[0]}
              </div>
              <div className="w-full bg-gradient-to-t from-gray-300 to-gray-200 h-24 rounded-t-2xl flex flex-col items-center justify-start pt-2 shadow-inner border border-gray-300">
                <span className="text-3xl font-black text-gray-400">2</span>
                <span className="text-xs font-bold mt-1 text-gray-600">{peers[1].cgpa.toFixed(2)}</span>
              </div>
            </motion.div>

            {/* Rank 1 */}
            <motion.div variants={podiumVariants} className="flex flex-col items-center w-1/3 z-10">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <Medal className="w-10 h-10 text-yellow-500 mb-2 drop-shadow-md" />
              </motion.div>
              <div className="bg-white px-4 py-1.5 rounded-full text-sm font-black text-yellow-600 shadow-md mb-2 truncate max-w-[110px] md:max-w-none text-center border border-yellow-200">
                {peers[0].name.split(' ')[0]}
              </div>
              <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-300 h-32 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-lg border border-yellow-400">
                <span className="text-4xl font-black text-yellow-700">1</span>
                <span className="text-sm font-bold mt-1 text-yellow-800">{peers[0].cgpa.toFixed(2)}</span>
              </div>
            </motion.div>

            {/* Rank 3 */}
            <motion.div variants={podiumVariants} className="flex flex-col items-center w-1/3">
              <div className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm mb-2 truncate max-w-[100px] md:max-w-none text-center">
                {peers[2].name.split(' ')[0]}
              </div>
              <div className="w-full bg-gradient-to-t from-orange-300 to-orange-200 h-20 rounded-t-2xl flex flex-col items-center justify-start pt-2 shadow-inner border border-orange-300">
                <span className="text-3xl font-black text-orange-400">3</span>
                <span className="text-xs font-bold mt-1 text-orange-700">{peers[2].cgpa.toFixed(2)}</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Rank & Name</span>
            <span>CGPA</span>
          </div>
          
          <motion.div 
            initial="hidden" animate="show" variants={containerVariants}
            className="divide-y divide-gray-50"
          >
            {peers.map((peer, idx) => (
              <motion.div variants={itemVariants} key={peer.id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      {peer.name === 'Anonymous Student' && <Lock className="w-3 h-3 text-gray-400" />}
                      {peer.name}
                    </p>
                    <p className="text-xs font-medium text-gray-500">{peer.level} Level</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-blue-600">{peer.cgpa.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}

            {peers.length === 0 && (
              <div className="p-8 text-center text-gray-500 font-medium">
                No students in your department have logged their grades yet. You're the pioneer!
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  )
}
