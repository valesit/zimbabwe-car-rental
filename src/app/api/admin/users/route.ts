import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { getAppOrigin } from '@/lib/app-origin';
import { allowAdminCreateUser } from '@/lib/admin-user-rate-limit';
import type { ProfileRole } from '@/types/database';

export const dynamic = 'force-dynamic';

type Body = {
  email?: string;
  mode?: 'invite' | 'password';
  password?: string;
  displayName?: string;
  /** App role stored on `public.profiles`; default `user`. */
  role?: ProfileRole;
};

async function applyProfileRole(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  role: ProfileRole
): Promise<{ error: string | null }> {
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId);
  if (error) {
    console.error('applyProfileRole:', error);
    return { error: error.message };
  }
  return { error: null };
}

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
    const role: ProfileRole = body.role === 'admin' ? 'admin' : 'user';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const origin = getAppOrigin();
    const redirectTo = `${origin}/login`;

    if (mode === 'invite') {
      const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: displayName ? { full_name: displayName, name: displayName } : undefined,
        redirectTo,
      });
      if (error) {
        console.error('inviteUserByEmail:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      const newId = invited?.user?.id;
      if (role === 'admin' && newId) {
        const { error: roleErr } = await applyProfileRole(admin, newId, 'admin');
        if (roleErr) {
          return NextResponse.json(
            {
              error:
                'Invitation was sent but admin role could not be saved. Set role manually in the user list.',
            },
            { status: 500 }
          );
        }
      }
      return NextResponse.json({
        ok: true,
        mode: 'invite',
        message:
          role === 'admin' && newId
            ? 'Invitation email sent. They will have admin access after they accept the invite.'
            : role === 'admin'
              ? 'Invitation email sent. After they appear in the user list, confirm they have the Admin role or use Make admin.'
              : 'Invitation email sent.',
      });
    }

    const password = body.password?.trim();
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password mode requires a password of at least 8 characters.' },
        { status: 400 }
      );
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: displayName ? { full_name: displayName, name: displayName } : undefined,
    });
    if (error) {
      console.error('createUser:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const newId = created?.user?.id;
    if (newId && role === 'admin') {
      const { error: roleErr } = await applyProfileRole(admin, newId, 'admin');
      if (roleErr) {
        return NextResponse.json(
          {
            error:
              'User was created but admin role could not be saved. Use Make admin in the user list.',
          },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({
      ok: true,
      mode: 'password',
      message:
        role === 'admin'
          ? 'Admin user created. They can sign in with the email and password you set.'
          : 'User created. They can sign in with the email and password you set.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create user.';
    console.error('POST /api/admin/users:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
