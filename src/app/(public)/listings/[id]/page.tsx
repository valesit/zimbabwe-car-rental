import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookingForm } from '@/components/BookingForm';
import { CarReviews } from '@/components/CarReviews';
import { getCarTypeLabel } from '@/types/database';
import { formatDailyRateUsd } from '@/lib/money';
import { carListingImageUrl } from '@/lib/carImages';
import { buildBlockedSet, computeNextOpenDay, horizonEndIso } from '@/lib/availability';

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
    `,
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
  const ids = (bookingIds ?? []).map((booking) => booking.id);
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

  const imageUrls: string[] = Array.isArray(car.image_urls)
    ? (car.image_urls as string[]).filter((url): url is string => typeof url === 'string' && url.length > 0)
    : [];
  const heroImage = carListingImageUrl({
    image_urls: imageUrls,
    car_type: car.car_type,
  });
  const extraImages: string[] = imageUrls.filter((url) => url !== heroImage).slice(0, 2);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8f5]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
          >
            <span aria-hidden>←</span> Back to fleet
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">Managed fleet</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800 ring-1 ring-emerald-100">Harare</span>
          </div>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-slate-100 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] lg:aspect-auto lg:min-h-[520px]">
            <Image
              src={heroImage}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/30 to-transparent" aria-hidden="true" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {extraImages.length > 0 ? (
              extraImages.map((src: string, index: number) => (
                <div key={src} className="relative min-h-[230px] overflow-hidden rounded-3xl bg-slate-100 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)]">
                  <Image
                    src={src}
                    alt={`${car.make} ${car.model} view ${index + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))
            ) : (
              <div className="flex min-h-[230px] flex-col justify-end rounded-3xl bg-emerald-950 p-7 text-white sm:col-span-2 lg:col-span-1 lg:min-h-[520px]">
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-emerald-200">Ready when you are</p>
                <h2 className="font-display mt-3 text-3xl font-medium leading-tight">Choose your dates and reserve with confidence.</h2>
                <p className="mt-3 text-sm leading-6 text-emerald-50/75">Clear pricing, managed availability and local support throughout your rental.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-9 grid gap-8 lg:grid-cols-[1fr_420px] xl:gap-12">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{getCarTypeLabel(car.car_type)}</p>
                <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  {car.make} {car.model} <span className="text-slate-400">{car.year}</span>
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                    <LocationIcon className="h-4 w-4 text-emerald-700" />
                    {car.location_city}{car.location_detail ? ` · ${car.location_detail}` : ''}
                  </span>
                  {nextAvailableDate ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800 ring-1 ring-emerald-100">
                      Available from {formatFriendlyDate(nextAvailableDate)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <TrustItem title="Managed fleet" text="Listed and maintained by our rental team." />
              <TrustItem title="Flexible dates" text="See availability before you confirm." />
              <TrustItem title="Local support" text="Help is available throughout your rental." />
            </div>

            <div className="mt-10 border-t border-slate-200/80 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">About this car</p>
              <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Vehicle details</h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600">
                {car.description || `A reliable ${getCarTypeLabel(car.car_type).toLowerCase()} for getting around ${car.location_city} comfortably.`}
              </p>
            </div>

            <div className="mt-10 border-t border-slate-200/80 pt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Past renters</p>
                  <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Reviews</h2>
                </div>
              </div>
              <CarReviews reviews={reviews ?? []} />
            </div>
          </div>

          <aside>
            <div className="sticky top-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] sm:p-7">
              <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Daily rate</p>
                  <p className="font-display mt-1 text-4xl font-medium tracking-[-0.035em] text-emerald-950">
                    {formatDailyRateUsd(Number(car.daily_rate_usd))}
                    <span className="ml-1 text-sm font-medium text-slate-400">/ day</span>
                  </p>
                </div>
              </div>
              {Number(car.refundable_deposit_usd ?? 0) > 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Refundable deposit: <span className="font-semibold text-slate-900">{formatDailyRateUsd(Number(car.refundable_deposit_usd))}</span>
                </div>
              ) : null}
              <BookingForm
                carId={car.id}
                dailyRate={Number(car.daily_rate_usd)}
                refundableDepositUsd={Number(car.refundable_deposit_usd ?? 0)}
                availability={availability ?? []}
                nextAvailableDate={nextAvailableDate}
                horizonEnd={horizonEnd}
                isLoggedIn={Boolean(user)}
              />
              <p className="mt-5 text-center text-xs leading-5 text-slate-400">Your booking is managed by Rental Car Connect. Support is available if plans change.</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1.5 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Zm-7 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
  );
}

function formatFriendlyDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
