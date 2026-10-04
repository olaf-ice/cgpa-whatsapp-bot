'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Lock, Mail, GraduationCap, CheckCircle2 } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error') || searchParams.get('message')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setInfoMessage('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        setIsLoading(false)
        return
      }

      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        })

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('failed to fetch')) {
            setError('Unable to connect to authentication server. The backend database project may be paused in Supabase.')
          } else if (signUpError.message?.toLowerCase().includes('already registered')) {
            setError('An account with this email already exists. Please switch to Sign In.')
          } else {
            setError(signUpError.message)
          }
          setIsLoading(false)
          return
        }

        // Check if session was returned directly or if email confirmation is required
        if (signUpData.session) {
          router.push('/onboarding')
        } else {
          setInfoMessage('Account created! A confirmation link has been sent to your email. Please verify your email to log in.')
          setIsLoading(false)
        }
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes('failed to fetch') || err?.name === 'TypeError') {
          setError('Unable to connect to authentication server. The backend database project may be paused in Supabase.')
        } else {
          setError(err?.message || 'Failed to create account. Please try again.')
        }
        setIsLoading(false)
      }
      return
    }

    // Sign In Mode
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) {
        if (signInError.message?.toLowerCase().includes('failed to fetch')) {
          setError('Unable to connect to authentication server. The backend database project may be paused in Supabase.')
        } else if (signInError.message?.includes('Invalid login credentials')) {
          setError('Incorrect email or password. Please verify your details or use Forgot Password.')
        } else if (signInError.message?.toLowerCase().includes('email not confirmed')) {
          setError('Your email has not been confirmed yet. Please check your inbox for the confirmation link.')
        } else {
          setError(signInError.message)
        }
        setIsLoading(false)
        return
      }

      const user = signInData.user
      if (!user) {
        setError('Failed to authenticate user. Please try again.')
        setIsLoading(false)
        return
      }

      // Check onboarding status
      try {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (student) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      } catch {
        router.push('/onboarding')
      }
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('failed to fetch') || err?.name === 'TypeError') {
        setError('Unable to connect to authentication server. The backend database project may be paused in Supabase.')
      } else {
        setError(err?.message || 'Authentication failed. Please try again.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 relative overflow-hidden py-12 transition-colors duration-300">
      {/* Top Right Theme Toggle */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 dark:bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-100 dark:border-slate-800 z-10 mx-4 transition-colors duration-300">
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            {mode === 'signin'
              ? 'Securely track your CGPA across semesters.'
              : 'Join MyGPA and take control of your academic journey.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-2xl mb-6 border border-gray-200/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError('')
              setInfoMessage('')
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError('')
              setInfoMessage('')
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error and Info Banners */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm flex gap-2 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Email / Username Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 pl-10"
                placeholder="you@school.edu.ng"
              />
              <Mail className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Password Input with Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-slate-200"
              >
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => router.push('/reset-password')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 pl-10 pr-11"
                placeholder="••••••••"
              />
              <Lock className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input (Sign Up Mode Only) */}
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 pl-10 pr-11"
                  placeholder="Re-enter your password"
                />
                <Lock className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || password.length < 6 || (mode === 'signup' && !confirmPassword)}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-2 cursor-pointer"
          >
            {isLoading
              ? mode === 'signin'
                ? 'Signing In...'
                : 'Creating Account...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* Footer Mode Switch */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
          {mode === 'signin' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError('')
                  setInfoMessage('')
                }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setInfoMessage('')
                }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
