import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if they are already in the students table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (student) {
          // Already onboarded
          return NextResponse.redirect(`${origin}/dashboard`)
        } else {
          // Needs onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?message=Could not verify your identity`)
}
