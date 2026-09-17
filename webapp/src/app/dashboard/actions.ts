'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePhoneNumber(phoneNumber: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication failed. Please log in again.' }
  }

  // Format phone number to E.164 without '+' for WhatsApp
  // e.g., 2348012345678
  let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '234' + formattedNumber.slice(1);
  } else if (!formattedNumber.startsWith('234')) {
    // Very basic assumption for MVP, assuming Nigerian numbers
    formattedNumber = '234' + formattedNumber;
  }

  const { error } = await (supabase as any)
    .from('students')
    .update({ phone_number: formattedNumber })
    .eq('user_id', user.id)

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return { error: 'This WhatsApp number is already connected to another account.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleEmailReminders(enabled: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' };

  const { error } = await (supabase as any)
    .from('students')
    .update({ email_reminders_enabled: enabled })
    .eq('user_id', user.id)

  if (error) return { error: error.message };

  revalidatePath('/dashboard')
  return { success: true }
}
