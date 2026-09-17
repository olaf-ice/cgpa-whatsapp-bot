import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function test() {
  const { data, error } = await supabase.from('students').select('id').eq('user_id', 'invalid').single()
  console.log("DATA:", data)
  console.log("ERROR:", error)
}
test()
