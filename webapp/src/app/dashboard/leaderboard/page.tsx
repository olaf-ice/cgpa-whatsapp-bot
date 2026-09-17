import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 1. Fetch current student's context
  const { data: currentStudent, error: studentError } = await (supabase as any)
    .from('students')
    .select('institution_id, course_of_study, institution:institutions(name, grading_scale)')
    .eq('user_id', user.id)
    .single()

  if (studentError || !currentStudent) {
    redirect('/onboarding')
  }

  // 2. Fetch leaderboard (Top 50 students in same institution and course)
  const { data: peers } = await (supabase as any)
    .from('students')
    .select('id, name, opt_in_leaderboard, current_cgpa, entry_level, current_level')
    .eq('institution_id', currentStudent.institution_id)
    .eq('course_of_study', currentStudent.course_of_study)
    .order('current_cgpa', { ascending: false })
    .limit(50)

  // 3. Format the data for the client
  const formattedPeers = (peers || []).map((p: any) => ({
    id: p.id,
    name: p.opt_in_leaderboard ? p.name : 'Anonymous Student',
    cgpa: p.current_cgpa || 0,
    level: p.current_level,
    isCurrentUser: false // We don't expose user_id here for privacy, but we can match by something else if needed
  }));

  return (
    <LeaderboardClient 
      peers={formattedPeers}
      institutionName={currentStudent.institution.name}
      courseOfStudy={currentStudent.course_of_study}
      scale={currentStudent.institution.grading_scale}
    />
  )
}
