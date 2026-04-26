'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CAR_TYPES, CAR_TYPE_LABELS } from '@/types/database';

const DEFAULT_CITIES = [{ name: 'Harare' }];

export function SearchForm({ cities }: { cities?: { name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(searchParams.get('start') ?? '');
  const [endDate, setEndDate] = useState(searchParams.get('end') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [carType, setCarType] = useState(searchParams.get('type') ?? '');

  const cityOptions = cities?.length ? cities : DEFAULT_CITIES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (city) params.set('city', city);
    if (carType) params.set('type', carType);
    router.push(`/listings?${params.toString()}`);
  }

  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:px-4';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-lg ring-1 ring-gray-900/5 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-12 lg:items-end"
    >
      <label className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-2">
        <span className="text-sm font-semibold text-gray-700">Start date</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-2">
        <span className="text-sm font-semibold text-gray-700">End date</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-2">
        <span className="text-sm font-semibold text-gray-700">City</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass}>
          <option value="">Any</option>
          {cityOptions.map((c) => (
            <option key={typeof c === 'string' ? c : c.name} value={typeof c === 'string' ? c : c.name}>
              {typeof c === 'string' ? c : c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-2">
        <span className="text-sm font-semibold text-gray-700">Car type</span>
        <select value={carType} onChange={(e) => setCarType(e.target.value)} className={fieldClass}>
          <option value="">Any</option>
          {CAR_TYPES.map((t) => (
            <option key={t} value={t}>
              {CAR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-stretch sm:col-span-2 lg:col-span-4 lg:items-end">
        <button
          type="submit"
          className="w-full rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 lg:w-auto lg:min-w-[8.5rem] lg:py-2.5"
        >
          Search
        </button>
      </div>
    </form>
  );
}
