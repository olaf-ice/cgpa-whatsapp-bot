import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function test() {
  const { data, error } = await supabase.from('students').upsert({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test',
    course_of_study: 'Test',
    entry_level: 100,
    current_level: 100
  }, { onConflict: 'user_id' })
  console.log(error)
}
test()
