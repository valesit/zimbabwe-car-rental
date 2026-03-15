import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { SearchForm } from '@/components/SearchForm';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600',
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-slate-50 px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230d9488\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="font-brand text-4xl font-medium tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
            Rent a car in <span className="text-teal-600">Zimbabwe</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 sm:text-xl max-w-2xl mx-auto">
            Find and book cars from local owners. Choose by location, dates, and vehicle type.
          </p>
          <div className="mx-auto mt-10 max-w-3xl">
            <SearchForm cities={cities ?? undefined} />
          </div>
        </div>
        {/* Hero image strip */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="flex gap-4 justify-center flex-wrap px-2">
            {HERO_IMAGES.map((src, i) => (
              <div key={i} className="relative h-40 w-64 overflow-hidden rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Why use us - with images */}
      <section className="border-t border-gray-200/80 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-brand text-center text-2xl font-medium text-slate-800 sm:text-3xl">
            Why book with us
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 shadow-sm transition hover:border-teal-100 hover:shadow-md">
              <div className="relative h-36 w-full">
                <Image
                  src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600"
                  alt="Pickup truck"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="mt-3 font-semibold text-slate-800">Flexible dates</h3>
                <p className="mt-2 text-sm text-gray-600">Search by your trip dates and see only cars available when you need them.</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 shadow-sm transition hover:border-teal-100 hover:shadow-md">
              <div className="relative h-36 w-full">
                <Image
                  src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600"
                  alt="Car in city"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="mt-3 font-semibold text-slate-800">Across Zimbabwe</h3>
                <p className="mt-2 text-sm text-gray-600">Harare, Bulawayo, Mutare and more. Filter by city to find cars near you.</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 shadow-sm transition hover:border-teal-100 hover:shadow-md">
              <div className="relative h-36 w-full">
                <Image
                  src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600"
                  alt="Keys and car"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="mt-3 font-semibold text-slate-800">Verified owners</h3>
                <p className="mt-2 text-sm text-gray-600">Book from trusted local owners and read reviews from past renters.</p>
              </div>
            </div>
          </div>
          <div className="mt-14 flex justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Browse all listings
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
