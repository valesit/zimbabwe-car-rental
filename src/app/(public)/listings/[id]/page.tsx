import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookingForm } from '@/components/BookingForm';
import { CarReviews } from '@/components/CarReviews';

export const revalidate = 60;

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: car, error } = await supabase
    .from('cars')
    .select(`
      id, make, model, year, car_type, location_city, location_detail,
      daily_rate_zwl, image_urls, description, is_active, owner_id,
      profiles:owner_id (display_name, is_verified, is_premium)
    `)
    .eq('id', id)
    .single();

  if (error || !car || !car.is_active) notFound();

  const { data: availability } = await supabase
    .from('car_availability')
    .select('available_date, is_available')
    .eq('car_id', id)
    .gte('available_date', new Date().toISOString().slice(0, 10))
    .order('available_date', { ascending: true })
    .limit(90);

  const { data: bookingIds } = await supabase
    .from('bookings')
    .select('id')
    .eq('car_id', id)
    .eq('status', 'completed');
  const ids = (bookingIds ?? []).map((b) => b.id);
  const { data: reviews } = ids.length > 0
    ? await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          reviewer:reviewer_id (display_name)
        `)
        .in('booking_id', ids)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] };

  const owner = Array.isArray(car.profiles) ? car.profiles[0] : car.profiles;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">
        &larr; Back to listings
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-[4/3] relative overflow-hidden rounded-lg bg-gray-100">
            {(car.image_urls as string[])?.[0] ? (
              <Image
                src={(car.image_urls as string[])[0]}
                alt={`${car.make} ${car.model}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {car.make} {car.model} ({car.year})
          </h1>
          <p className="mt-2 capitalize text-gray-600">{car.car_type}</p>
          <p className="text-gray-600">{car.location_city}{car.location_detail ? ` · ${car.location_detail}` : ''}</p>
          {car.description && (
            <p className="mt-4 text-gray-700">{car.description}</p>
          )}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            <CarReviews reviews={reviews ?? []} />
          </div>
        </div>
        <div>
          <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              ZWL {Number(car.daily_rate_zwl).toLocaleString()}
              <span className="text-base font-normal text-gray-500"> / day</span>
            </p>
            {owner && (
              <p className="mt-2 text-sm text-gray-600">
                Owner: {(owner as { display_name: string | null }).display_name ?? 'User'}
              </p>
            )}
            <BookingForm
              carId={car.id}
              dailyRate={Number(car.daily_rate_zwl)}
              availability={availability ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
