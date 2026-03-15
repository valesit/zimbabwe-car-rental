'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LeaveReviewForm({
  bookingId,
  revieweeId,
}: {
  bookingId: string;
  revieweeId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <span className="text-sm font-medium text-gray-700">Rating</span>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRating(r)}
              className={`rounded p-1 text-lg ${rating >= r ? 'text-amber-500' : 'text-gray-300'}`}
              aria-label={`${r} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Comment (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}
