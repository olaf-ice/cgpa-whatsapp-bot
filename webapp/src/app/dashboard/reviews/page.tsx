import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ReviewsClient from './ReviewsClient'

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch current student context
  const { data: student } = await (supabase as any)
    .from('students')
    .select('id, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    redirect('/onboarding')
  }

  // Resolve search query
  const queryParam = await searchParams;
  const searchQuery = queryParam.q ? queryParam.q.toUpperCase().replace(/\s+/g, '') : null;

  let reviews = [];

  if (searchQuery) {
    // Fetch reviews for specific course
    const { data } = await (supabase as any)
      .from('course_reviews')
      .select('id, course_code, rating, advice_text, created_at, author:students(name)')
      .eq('institution_id', student.institution_id)
      .eq('course_code', searchQuery)
      .order('created_at', { ascending: false })
      .limit(50)
      
    reviews = data || [];
  } else {
    // Fetch latest overall reviews in the institution
    const { data } = await (supabase as any)
      .from('course_reviews')
      .select('id, course_code, rating, advice_text, created_at, author:students(name)')
      .eq('institution_id', student.institution_id)
      .order('created_at', { ascending: false })
      .limit(20)
      
    reviews = data || [];
  }

  return <ReviewsClient initialReviews={reviews} searchQuery={searchQuery} />
}
