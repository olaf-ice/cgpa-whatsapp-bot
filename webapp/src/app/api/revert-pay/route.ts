import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await (supabase as any)
    .from('students')
    .update({ has_paid: false })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/dashboard');
  
  // Redirect back to dashboard
  return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
