require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAdmins() {
  const { data, error } = await supabase.from('students').select('name, is_admin').eq('is_admin', true);
  if (error) {
    console.error('DB error:', error);
    return;
  }
  console.log('Admins:', data);
}

checkAdmins();
