'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = stored || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    try {
      localStorage.setItem('theme', nextTheme)
    } catch {}
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`w-11 h-11 rounded-2xl bg-gray-100/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 ${className}`} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm cursor-pointer overflow-hidden backdrop-blur-md border ${
        isDark
          ? 'bg-slate-900/85 border-slate-700/80 text-blue-200 shadow-indigo-500/10'
          : 'bg-white/85 border-amber-200/80 text-amber-500 shadow-amber-500/10'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Background ambient glow */}
      <motion.div
        animate={{
          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
      />

      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          rotate: isDark ? 40 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <mask id="theme-toggle-moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            animate={{
              cx: isDark ? 16 : 30,
              cy: isDark ? 5 : 0,
              r: isDark ? 7 : 0,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            fill="black"
          />
        </mask>

        {/* Center circle (Sun body or Moon crescent through mask) */}
        <motion.circle
          cx="12"
          cy="12"
          r={isDark ? 8 : 5}
          fill="currentColor"
          stroke="currentColor"
          mask="url(#theme-toggle-moon-mask)"
          animate={{
            r: isDark ? 8 : 5,
            fill: isDark ? '#93c5fd' : '#f59e0b',
            stroke: isDark ? '#93c5fd' : '#f59e0b',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        />

        {/* Sun rays (8 radiating lines, visible only in light mode) */}
        <motion.g
          stroke="currentColor"
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ originX: '12px', originY: '12px' }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </motion.g>

        {/* Tiny stars (visible only in dark mode) */}
        <motion.g
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: isDark ? 0.08 : 0 }}
        >
          <circle cx="19" cy="4" r="1" fill="#e0e7ff" />
          <circle cx="5" cy="18" r="0.8" fill="#e0e7ff" />
        </motion.g>
      </motion.svg>
    </motion.button>
  )
}
