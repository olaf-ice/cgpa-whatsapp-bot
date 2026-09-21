const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
  const email = 'simeoncranier@gmail.com';
  
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log('User not found in auth.users.');
    return;
  }
  
  console.log(`Found auth user: ${user.id}`);
  
  const { data: student, error: dbError } = await supabase.from('students').select('*').eq('user_id', user.id).single();
  if (dbError) {
    console.error('DB error:', dbError);
    return;
  }
  
  console.log('Student record is_admin:', student.is_admin);
  
  if (!student.is_admin) {
    console.log('User is NOT an admin. Setting is_admin = true...');
    const { error: updateError } = await supabase.from('students').update({ is_admin: true }).eq('id', student.id);
    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Successfully made user an admin!');
    }
  } else {
    console.log('User is already an admin.');
  }
}

checkUser();
