'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CAR_TYPES } from '@/types/database';

const ZIMBABWE_CITIES = [
  'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo',
  'Chinhoyi', 'Marondera', 'Norton', 'Victoria Falls', 'Kariba', 'Beitbridge',
];

export function SearchForm({ cities }: { cities?: { name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(searchParams.get('start') ?? '');
  const [endDate, setEndDate] = useState(searchParams.get('end') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [carType, setCarType] = useState(searchParams.get('type') ?? '');

  const cityOptions = cities?.length ? cities : ZIMBABWE_CITIES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (city) params.set('city', city);
    if (carType) params.set('type', carType);
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Start date</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">End date</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">City</span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">Any</option>
          {cityOptions.map((c) => (
            <option key={typeof c === 'string' ? c : c.name} value={typeof c === 'string' ? c : c.name}>
              {typeof c === 'string' ? c : c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Car type</span>
        <select
          value={carType}
          onChange={(e) => setCarType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
        >
          <option value="">Any</option>
          {CAR_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Search
      </button>
    </form>
  );
}
