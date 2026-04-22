import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookingForm } from '@/components/BookingForm';
import { CarReviews } from '@/components/CarReviews';
import { getCarTypeLabel } from '@/types/database';
import { formatDailyRateUsd } from '@/lib/money';
import { carListingImageUrl } from '@/lib/carImages';
import {
  buildBlockedSet,
  computeNextOpenDay,
  horizonEndIso,
} from '@/lib/availability';

export const revalidate = 60;

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: car, error } = await supabase
    .from('cars')
    .select(
      `
      id, make, model, year, car_type, location_city, location_detail,
      daily_rate_usd, refundable_deposit_usd, image_urls, description, is_active
    `
    )
    .eq('id', id)
    .single();

  if (error || !car || !car.is_active) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const horizonEnd = horizonEndIso(today);
  const { data: availability } = await supabase
    .from('car_availability')
    .select('available_date, is_available')
    .eq('car_id', id)
    .gte('available_date', today)
    .lte('available_date', horizonEnd)
    .order('available_date', { ascending: true });

  const blocked = buildBlockedSet(availability ?? []);
  const nextAvailableDate = computeNextOpenDay(today, horizonEnd, blocked);

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

  const heroImage = carListingImageUrl({
    image_urls: car.image_urls as string[],
    car_type: car.car_type,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/listings"
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
      >
        <span aria-hidden>←</span> Back to listings
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-[4/3] relative overflow-hidden rounded-2xl bg-gray-100 shadow-md ring-2 ring-emerald-100/80">
            <Image
              src={heroImage}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          </div>
          <h1 className="mt-6 font-brand text-3xl font-medium tracking-tight text-slate-800 sm:text-4xl">
            {car.make} {car.model}{' '}
            <span className="text-emerald-600">({car.year})</span>
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900 ring-1 ring-emerald-100">
              <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {getCarTypeLabel(car.car_type)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {car.location_city}
              {car.location_detail ? ` · ${car.location_detail}` : ''}
            </span>
          </div>
          {car.description && (
            <p className="mt-5 text-base leading-relaxed text-gray-700">{car.description}</p>
          )}

          <div className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="font-brand text-xl font-medium text-emerald-800 sm:text-2xl">Reviews</h2>
            <CarReviews reviews={reviews ?? []} />
          </div>
        </div>
        <div>
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-900/5 ring-1 ring-emerald-50">
            <p className="text-3xl font-bold tracking-tight text-emerald-700">
              {formatDailyRateUsd(Number(car.daily_rate_usd))}
              <span className="text-lg font-semibold text-emerald-600/80"> / day</span>
            </p>
            <p className="mt-2 text-xs text-gray-500">Taxes and extras may apply at pickup.</p>
            {Number(car.refundable_deposit_usd ?? 0) > 0 && (
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-medium text-slate-800">Refundable deposit:</span>{' '}
                {formatDailyRateUsd(Number(car.refundable_deposit_usd))}{' '}
                (charged at checkout; refundable per rental terms)
              </p>
            )}
            <BookingForm
              carId={car.id}
              dailyRate={Number(car.daily_rate_usd)}
              refundableDepositUsd={Number(car.refundable_deposit_usd ?? 0)}
              availability={availability ?? []}
              nextAvailableDate={nextAvailableDate}
              horizonEnd={horizonEnd}
              isLoggedIn={Boolean(user)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
