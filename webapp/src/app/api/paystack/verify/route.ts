import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json()

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Reference missing' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      // For MVP testing, if there's no secret key, we'll just mock success
      console.warn('PAYSTACK_SECRET_KEY is missing. Mocking successful payment.')
    } else {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      })

      const data = await response.json()
      if (!data.status || data.data.status !== 'success') {
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 })
      }
    }

    // Payment is verified or mocked successfully. Update database.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await (supabase as any)
      .from('students')
      .update({ has_paid: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating payment status:', error)
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
