import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeaveReviewForm } from '@/components/LeaveReviewForm';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, start_date, end_date, status, total_amount_zwl, car_id, renter_id,
      cars (id, make, model, year, location_city, owner_id)
    `)
    .eq('id', id)
    .single();

  if (error || !booking || booking.renter_id !== user.id) notFound();

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .single();

  const carRaw = booking.cars;
  const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as { id: string; make: string; model: string; year: number; location_city: string; owner_id: string };
  const canReview = booking.status === 'completed' && !existingReview;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
        &larr; Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Booking details</h1>
      <div className="mt-6 rounded-lg border border-gray-200 p-6">
        <p className="font-medium">
          {car.make} {car.model} ({car.year})
        </p>
        <p className="text-sm text-gray-500">{car.location_city}</p>
        <p className="mt-2 text-gray-700">
          {booking.start_date} – {booking.end_date}
        </p>
        <p className="text-gray-700">Status: {booking.status}</p>
        <p className="mt-2 font-medium">ZWL {Number(booking.total_amount_zwl).toLocaleString()}</p>
        <Link href={`/listings/${car.id}`} className="mt-4 inline-block text-sm text-gray-900 underline">
          View listing
        </Link>
      </div>
      {canReview && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Leave a review</h2>
          <LeaveReviewForm
            bookingId={id}
            revieweeId={car.owner_id}
          />
        </div>
      )}
    </div>
  );
}
