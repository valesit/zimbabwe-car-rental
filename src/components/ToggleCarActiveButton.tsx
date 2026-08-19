'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ToggleCarActiveButton({ carId, isActive }: { carId: string; isActive: boolean }) {
  const router = useRouter();

  async function handleClick() {
    const supabase = createClient();
    await supabase.from('cars').update({ is_active: !isActive }).eq('id', carId);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        isActive
          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
      }`}
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
