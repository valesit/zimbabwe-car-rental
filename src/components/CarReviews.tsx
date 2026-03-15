interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: { display_name: string | null } | { display_name: string | null }[] | null;
}

export function CarReviews({ reviews }: { reviews: ReviewRow[] }) {
  if (!reviews.length) {
    return <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>;
  }
  return (
    <ul className="mt-2 space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">
              {(Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer)?.display_name ?? 'Guest'}
            </span>
            <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <span className="text-sm text-gray-400">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
