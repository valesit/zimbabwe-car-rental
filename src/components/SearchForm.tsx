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
  const [city, setCity] = useState(searchParams.get('city') ?? 'Harare');
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
    'h-14 w-full rounded-2xl border border-[#dfe6e2] bg-white px-4 text-[15px] font-medium text-[#253a32] outline-none transition placeholder:text-[#87938e] hover:border-[#cbd8d1] focus:border-[#3b8a69] focus:ring-4 focus:ring-emerald-700/10';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-[2rem] border border-[#e2e8e4] bg-white px-5 py-5 shadow-[0_24px_60px_-35px_rgba(15,40,31,0.28)] sm:grid-cols-2 sm:px-6 sm:py-6 lg:grid-cols-12 lg:items-end lg:px-8 lg:py-7"
    >
      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#56665f]">Pick-up date</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#56665f]">Drop-off date</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2 lg:col-span-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#56665f]">Pick-up location</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass}>
          {cityOptions.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#56665f]">Car type</span>
        <select value={carType} onChange={(e) => setCarType(e.target.value)} className={fieldClass}>
          <option value="">Any</option>
          {CAR_TYPES.map((t) => (
            <option key={t} value={t}>
              {CAR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex sm:col-span-2 lg:col-span-3 lg:justify-end">
        <button
          type="submit"
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#176447] px-7 text-[15px] font-semibold text-white shadow-[0_12px_28px_-16px_rgba(18,88,62,0.52)] transition hover:bg-[#125239] focus:outline-none focus:ring-4 focus:ring-emerald-700/15 lg:w-auto lg:min-w-[11.5rem]"
        >
          Search cars
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
