import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SearchForm } from '@/components/SearchForm';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Rent a car in Zimbabwe
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Find and book cars from local owners. Browse by location, dates, and type.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-3xl">
        <SearchForm cities={cities ?? undefined} />
      </div>
      <div className="mt-12 flex justify-center">
        <Link
          href="/listings"
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Browse all listings
        </Link>
      </div>
    </div>
  );
}
