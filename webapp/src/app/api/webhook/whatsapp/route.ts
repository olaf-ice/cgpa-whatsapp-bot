import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'cgpa_bot_verify_123'
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ... GET handler remains the same ...

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

/**
 * Send a WhatsApp text message using the Meta API
 */
async function sendWhatsAppMessage(to: string, text: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn('WhatsApp credentials missing. Would have sent:', text)
    return;
  }
  
  await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    })
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const message = change.value.messages[0]
            const senderPhone = message.from // e.g., '2348012345678'
            const text = message.text?.body?.toLowerCase().trim() || ''

            console.log(`Received message from ${senderPhone}: ${text}`)

            // 1. Lookup student by phone number
            const { data: student, error } = await supabase
              .from('students')
              .select(`
                *,
                institution:institutions(name, grading_scale),
                semesters(grades(credit_units, points))
              `)
              .eq('phone_number', senderPhone)
              .single()

            if (error || !student) {
              await sendWhatsAppMessage(
                senderPhone, 
                "Hi! It looks like this number isn't connected to a CGPA Bot account yet. Please log into your web dashboard and link your WhatsApp number in the Settings."
              )
              continue;
            }

            // 2. Parse Intent
            if (text === 'cgpa' || text === 'result') {
              let totalUnits = 0;
              let totalPoints = 0;
              
              if (student.semesters) {
                student.semesters.forEach((sem: any) => {
                  if (sem.grades) {
                    sem.grades.forEach((g: any) => {
                      totalUnits += g.credit_units;
                      totalPoints += g.points;
                    });
                  }
                });
              }

              const cgpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : '0.00';
              const messageBody = `Hello ${student.name.split(' ')[0]} 👋\n\nYour current CGPA at ${student.institution.name} is *${cgpa}* / ${student.institution.grading_scale}.\n\nTotal Units: ${totalUnits}\nTotal Points: ${totalPoints}\n\nKeep up the great work! 🚀`
              
              await sendWhatsAppMessage(senderPhone, messageBody);
            } 
            else {
              await sendWhatsAppMessage(
                senderPhone,
                "🤖 *CGPA Bot Menu*\n\nReply with one of the following commands:\n\n*CGPA* - View your current cumulative GPA\n*TARGET* - (Coming Soon)"
              )
            }
          }
        }
      }
      return NextResponse.json({ status: 'success' }, { status: 200 })
    }
    return NextResponse.json({ error: 'Not a WhatsApp Event' }, { status: 404 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
