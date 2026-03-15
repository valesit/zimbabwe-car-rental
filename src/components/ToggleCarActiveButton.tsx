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
      className="text-sm font-medium text-amber-600 hover:text-amber-700"
    >
      {isActive ? 'Remove listing' : 'Restore'}
    </button>
  );
}
