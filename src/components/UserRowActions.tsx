'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
export function UserRowActions({
  userId,
  isVerified,
  isPremium,
}: {
  userId: string;
  isVerified: boolean;
  isPremium: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function toggleVerified() {
    await supabase.from('profiles').update({ is_verified: !isVerified }).eq('id', userId);
    router.refresh();
  }

  async function togglePremium() {
    await supabase.from('profiles').update({ is_premium: !isPremium }).eq('id', userId);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={toggleVerified}
        className="text-sm font-medium text-gray-600 hover:underline"
      >
        {isVerified ? 'Unverify' : 'Verify'}
      </button>
      <button
        type="button"
        onClick={togglePremium}
        className="text-sm font-medium text-amber-600 hover:underline"
      >
        {isPremium ? 'Remove Premium' : 'Premium'}
      </button>
    </div>
  );
}
