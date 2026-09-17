'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: student } = await (supabase as any)
    .from('students')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
    
  return student?.is_admin === true
}

export async function togglePaymentStatus(studentId: string, currentStatus: boolean) {
  if (!(await isAdmin())) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('students')
    .update({ has_paid: !currentStatus })
    .eq('id', studentId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteStudent(studentId: string) {
  if (!(await isAdmin())) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('students')
    .delete()
    .eq('id', studentId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
