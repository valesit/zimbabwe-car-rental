'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CAR_TYPES } from '@/types/database';

const ZIMBABWE_CITIES = [
  'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo',
  'Chinhoyi', 'Marondera', 'Norton', 'Victoria Falls', 'Kariba', 'Beitbridge',
];

interface ListingsFiltersProps {
  start?: string;
  end?: string;
  city?: string;
  type?: string;
}

export function ListingsFilters({ start = '', end = '', city = '', type = '' }: ListingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [cityVal, setCityVal] = useState(city);
  const [carType, setCarType] = useState(type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) params.set('start', startDate);
    else params.delete('start');
    if (endDate) params.set('end', endDate);
    else params.delete('end');
    if (cityVal) params.set('city', cityVal);
    else params.delete('city');
    if (carType) params.set('type', carType);
    else params.delete('type');
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4">
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
          value={cityVal}
          onChange={(e) => setCityVal(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">Any</option>
          {ZIMBABWE_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
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
        Apply
      </button>
    </form>
  );
}
