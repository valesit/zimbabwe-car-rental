import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { getAppOrigin } from '@/lib/app-origin';
import { allowAdminCreateUser } from '@/lib/admin-user-rate-limit';

export const dynamic = 'force-dynamic';

type Body = {
  email?: string;
  mode?: 'invite' | 'password';
  password?: string;
  displayName?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (!allowAdminCreateUser(user.id)) {
      return NextResponse.json(
        { error: 'Too many user-creation attempts. Try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Body;
    const email = body.email?.trim().toLowerCase();
    const mode = body.mode === 'password' ? 'password' : 'invite';
    const displayName = body.displayName?.trim() || undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const origin = getAppOrigin();
    const redirectTo = `${origin}/login`;

    if (mode === 'invite') {
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: displayName ? { full_name: displayName, name: displayName } : undefined,
        redirectTo,
      });
      if (error) {
        console.error('inviteUserByEmail:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, mode: 'invite', message: 'Invitation email sent.' });
    }

    const password = body.password?.trim();
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password mode requires a password of at least 8 characters.' },
        { status: 400 }
      );
    }

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: displayName ? { full_name: displayName, name: displayName } : undefined,
    });
    if (error) {
      console.error('createUser:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      mode: 'password',
      message: 'User created. They can sign in with the email and password you set.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create user.';
    console.error('POST /api/admin/users:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
