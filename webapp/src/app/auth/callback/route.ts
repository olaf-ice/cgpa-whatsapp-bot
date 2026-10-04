import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')
  const errorDescription = searchParams.get('error_description') || searchParams.get('error')

  // Resolve external public URL if behind reverse proxy (Render, Vercel, Docker)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http')
  const baseUrl = host ? `${proto}://${host}` : origin

  // If Supabase returned an explicit error (e.g. expired link)
  if (errorDescription) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (code || (token_hash && type)) {
    const cookieStore = await cookies()
    const targetUrl = next ? `${baseUrl}${next}` : `${baseUrl}/dashboard`
    const redirectResponse = NextResponse.redirect(targetUrl)

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              redirectResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    let authSuccess = false

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) authSuccess = true
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash })
      if (!error) authSuccess = true
    }

    if (authSuccess) {
      if (next) {
        return redirectResponse
      }

      // Check if they are already in the students table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (student) {
          return redirectResponse // /dashboard
        } else {
          return NextResponse.redirect(`${baseUrl}/onboarding`, {
            headers: redirectResponse.headers,
          })
        }
      }

      return redirectResponse
    }
  }

  // Return the user to login with helpful error message
  return NextResponse.redirect(
    `${baseUrl}/login?error=${encodeURIComponent('The password reset link is invalid or has expired. Please request a new one.')}`
  )
}
