'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ProfileRole } from '@/types/database';

export function UserRowActions({
  userId,
  role,
  currentAdminId,
  isVerified,
  isPremium,
}: {
  userId: string;
  role: ProfileRole;
  currentAdminId: string;
  isVerified: boolean;
  isPremium: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const isSelf = userId === currentAdminId;
  const canRemoveAdmin = role === 'admin' && !isSelf;

  async function toggleVerified() {
    setError(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_verified: !isVerified })
      .eq('id', userId);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function togglePremium() {
    setError(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_premium: !isPremium })
      .eq('id', userId);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function setRole(next: ProfileRole) {
    setError(null);
    if (next === 'user' && role === 'admin' && isSelf) {
      setError('You cannot remove your own admin role here.');
      return;
    }
    if (
      next === 'user' &&
      role === 'admin' &&
      !window.confirm('Remove admin access for this user?')
    ) {
      return;
    }
    const { error: err } = await supabase.from('profiles').update({ role: next }).eq('id', userId);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void toggleVerified()}
          className="text-sm font-medium text-gray-600 hover:underline"
        >
          {isVerified ? 'Unverify' : 'Verify'}
        </button>
        <button
          type="button"
          onClick={() => void togglePremium()}
          className="text-sm font-medium text-amber-600 hover:underline"
        >
          {isPremium ? 'Remove Premium' : 'Premium'}
        </button>
        {role === 'user' ? (
          <button
            type="button"
            onClick={() => void setRole('admin')}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Make admin
          </button>
        ) : canRemoveAdmin ? (
          <button
            type="button"
            onClick={() => void setRole('user')}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Remove admin
          </button>
        ) : (
          <span className="text-xs text-slate-400" title="Cannot remove your own admin role">
            Admin (you)
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
