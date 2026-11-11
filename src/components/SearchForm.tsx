'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CAR_TYPES, CAR_TYPE_LABELS } from '@/types/database';
import { horizonEndIso, toISODateLocal } from '@/lib/availability';
import { validateRentalSearchDates } from '@/lib/rental-search-dates';

const DEFAULT_CITIES = [{ name: 'Harare' }];

export function SearchForm({ cities }: { cities?: { name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('start') ?? '');
  const [endDate, setEndDate] = useState(searchParams.get('end') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? 'Harare');
  const [carType, setCarType] = useState(searchParams.get('type') ?? '');
  const [dateError, setDateError] = useState<string | null>(null);
  const today = toISODateLocal(new Date());
  const maxDate = horizonEndIso(today);

  const cityOptions = cities?.length ? cities : DEFAULT_CITIES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateRentalSearchDates(startDate, endDate, today);
    if (validationError) {
      setDateError(validationError);
      return;
    }
    setDateError(null);
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (city) params.set('city', city);
    if (carType) params.set('type', carType);
    router.push(`/listings?${params.toString()}`);
  }

  const fieldClass = 'rcc-field';

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
          onChange={(e) => {
            const next = e.target.value;
            setStartDate(next);
            if (next && endDate && endDate < next) setEndDate('');
            setDateError(null);
          }}
          min={today}
          max={maxDate}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#56665f]">Drop-off date</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setDateError(null);
          }}
          min={startDate || today}
          max={maxDate}
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
          className="rcc-primary-action w-full shadow-[0_12px_28px_-16px_rgba(18,88,62,0.52)] lg:w-auto lg:min-w-[11.5rem]"
        >
          Search cars
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {dateError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:col-span-2 lg:col-span-12">
          {dateError}
        </p>
      ) : null}

      <p className="pt-1 text-center text-sm text-[#496057] sm:col-span-2 lg:col-span-12">
        Looking for an airport pickup or drop-off?{' '}
        <Link href="/support" className="font-semibold text-[#2f765c] underline decoration-[#9ab9aa] underline-offset-4 transition hover:text-[#1e5d43]">
          Click here.
        </Link>
      </p>
    </form>
  );
}
