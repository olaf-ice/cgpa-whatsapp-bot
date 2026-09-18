import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const supabase = await createClient()
  
  // Check if they are already logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // If not logged in, create an anonymous session
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Error signing in anonymously:', error)
      redirect('/login?error=Anonymous sign in failed')
    }
  }

  // Redirect to onboarding
  redirect('/onboarding')
}
