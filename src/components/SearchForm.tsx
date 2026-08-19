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

  const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-[1.35rem] border border-white/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.13)] backdrop-blur sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_.9fr_.9fr_auto] lg:items-end">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Start date</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">End date</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">City</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass}>
          <option value="">Any city</option>
          {cityOptions.map((c) => {
            const value = typeof c === 'string' ? c : c.name;
            return <option key={value} value={value}>{value}</option>;
          })}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Car type</span>
        <select value={carType} onChange={(e) => setCarType(e.target.value)} className={fieldClass}>
          <option value="">Any type</option>
          {CAR_TYPES.map((t) => <option key={t} value={t}>{CAR_TYPE_LABELS[t]}</option>)}
        </select>
      </label>
      <button type="submit" className="primary-button h-[46px] whitespace-nowrap sm:col-span-2 lg:col-span-1">
        Search cars
        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
      </button>
    </form>
  );
}
