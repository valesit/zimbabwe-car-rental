'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CAR_TYPES, CAR_TYPE_LABELS, getCarTypeLabel } from '@/types/database';

const DEFAULT_CITY_NAMES = ['Harare'];

interface ListingsFiltersProps {
  start?: string;
  end?: string;
  city?: string;
  type?: string;
  cities?: { name: string }[];
}

export function ListingsFilters({ start = '', end = '', city = '', type = '', cities }: ListingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [cityVal, setCityVal] = useState(city);
  const [carType, setCarType] = useState(type);
  const cityNames = cities?.length ? cities.map((c) => c.name) : DEFAULT_CITY_NAMES;
  const hasFilters = Boolean(startDate || endDate || cityVal || carType);

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

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)] sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.95fr_0.95fr_auto] xl:items-end">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Pick-up</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Return</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Location</span>
          <select value={cityVal} onChange={(e) => setCityVal(e.target.value)} className={fieldClass}>
            <option value="">All locations</option>
            {cityNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Vehicle type</span>
          <select value={carType} onChange={(e) => setCarType(e.target.value)} className={fieldClass}>
            <option value="">All vehicles</option>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t}>{CAR_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-800/15 sm:col-span-2 xl:col-span-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
          </svg>
          Search fleet
        </button>
      </div>

      {hasFilters ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Active filters</span>
          {startDate && endDate ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {startDate} → {endDate}
            </span>
          ) : null}
          {cityVal ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{cityVal}</span>
          ) : null}
          {carType ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {getCarTypeLabel(carType)}
            </span>
          ) : null}
          <Link href="/listings" className="ml-auto text-xs font-semibold text-emerald-800 transition hover:text-emerald-950">
            Clear filters
          </Link>
        </div>
      ) : null}
    </form>
  );
}
