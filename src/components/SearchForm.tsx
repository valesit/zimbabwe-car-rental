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
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_18px_55px_-24px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 backdrop-blur sm:grid-cols-2 sm:p-5 lg:grid-cols-12 lg:items-end"
    >
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Start date</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">End date</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">City</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass}>
          {cityOptions.map((c) => (
            <option key={typeof c === 'string' ? c : c.name} value={typeof c === 'string' ? c : c.name}>
              {typeof c === 'string' ? c : c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Car type</span>
        <select value={carType} onChange={(e) => setCarType(e.target.value)} className={fieldClass}>
          <option value="">Any</option>
          {CAR_TYPES.map((t) => (
            <option key={t} value={t}>
              {CAR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex sm:col-span-2 lg:col-span-4 lg:justify-end">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 lg:w-auto lg:min-w-[9rem]"
        >
          Search cars
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
