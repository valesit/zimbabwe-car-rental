'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Maps to `cars.is_active`: published = visible and bookable; unpublished = hidden from catalog. */
export function ListingPublishToggle({
  carId,
  isPublished,
  compact,
}: {
  carId: string;
  isPublished: boolean;
  /** Smaller styling for dense tables */
  compact?: boolean;
}) {
  const router = useRouter();

  async function handleClick() {
    if (isPublished) {
      if (
        !window.confirm(
          'Unpublish this listing? It will disappear from browse/search and renters cannot book it until you publish again.'
        )
      ) {
        return;
      }
    }
    const supabase = createClient();
    const { error } = await supabase.from('cars').update({ is_active: !isPublished }).eq('id', carId);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  const cls = compact
    ? 'text-sm font-semibold underline-offset-2 hover:underline'
    : 'inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition';

  if (!isPublished) {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        className={
          cls +
          (compact
            ? ' text-emerald-700 hover:text-emerald-900'
            : ' border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100')
        }
      >
        Publish
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={
        cls +
        (compact
          ? ' text-slate-600 hover:text-slate-900'
          : ' border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
      }
    >
      Unpublish
    </button>
  );
}
