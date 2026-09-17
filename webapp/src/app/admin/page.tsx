import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check if user is an admin
  const { data: student, error } = await (supabase as any)
    .from('students')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (error || !student?.is_admin) {
    redirect('/dashboard') // Kick out non-admins
  }

  // Fetch all students
  const { data: allStudents } = await (supabase as any)
    .from('students')
    .select(`
      id,
      user_id,
      name,
      phone_number,
      has_paid,
      created_at,
      institution:institutions(name)
    `)
    .order('created_at', { ascending: false })

  return <AdminClient students={allStudents || []} />
}
