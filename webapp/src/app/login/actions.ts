'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  // We are using OTP (Magic Link) for simplicity and better UX for students
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // In production, configure this correctly based on your deployment URL
      emailRedirectTo: 'http://localhost:3000/auth/callback',
    },
  })

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  // Normally we would redirect to a "check your email" page here
  // For now, redirecting with a query param to show a toast message
  redirect('/login?message=Check email for login link')
}
