'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const headersList = await headers()
  const origin = headersList.get('origin') || 'https://cgpa-whatsapp-bot.onrender.com'

  // We are using OTP (Magic Link) for simplicity and better UX for students
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  // Normally we would redirect to a "check your email" page here
  // For now, redirecting with a query param to show a toast message
  redirect('/login?message=Check email for login link')
}
