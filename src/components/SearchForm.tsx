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
    'h-14 w-full rounded-xl border border-[#dfe6e2] bg-white px-4 text-[15px] font-medium text-[#253a32] outline-none transition placeholder:text-[#87938e] hover:border-[#cbd8d1] focus:border-[#3b8a69] focus:ring-4 focus:ring-emerald-700/10';
  const selectClass = fieldClass + ' appearance-none pl-10 pr-10';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-[1.4rem] border border-[#e4e9e6] bg-white p-5 shadow-[0_24px_65px_-32px_rgba(20,54,42,0.28)] ring-1 ring-[#15392c]/[0.035] sm:grid-cols-2 sm:p-6 lg:grid-cols-12 lg:items-end"
    >
      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#52645d]">Pick-up date</span>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#52645d]">Drop-off date</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-2 lg:col-span-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#52645d]">Pick-up location</span>
        <span className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#215f49]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
            {cityOptions.map((c) => (
              <option key={typeof c === 'string' ? c : c.name} value={typeof c === 'string' ? c : c.name}>
                {typeof c === 'string' ? c : c.name}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </label>

      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#52645d]">Car type</span>
        <span className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#215f49]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 16.5h14M6.25 16.5l.65-5.15A2 2 0 018.88 9.6h6.24a2 2 0 011.98 1.75l.65 5.15M7.5 9.6l1.05-2.25A1.5 1.5 0 019.9 6.5h4.2a1.5 1.5 0 011.35.85L16.5 9.6M7 16.5v1.25M17 16.5v1.25" />
          </svg>
          <select value={carType} onChange={(e) => setCarType(e.target.value)} className={selectClass}>
            <option value="">Any</option>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t}>
                {CAR_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </label>

      <div className="flex sm:col-span-2 lg:col-span-3 lg:justify-end">
        <button
          type="submit"
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#176447] px-7 text-[15px] font-semibold text-white shadow-[0_12px_24px_-16px_rgba(18,88,62,0.65)] transition hover:bg-[#125239] focus:outline-none focus:ring-4 focus:ring-emerald-700/15 lg:w-auto lg:min-w-[10.5rem]"
        >
          Search cars
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      <div className="hidden border-t border-[#edf1ee] pt-4 text-sm text-[#53645d] lg:col-span-12 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-[#e4e9e6]">
        <ReassuranceItem type="check" label="Flexible booking" />
        <ReassuranceItem type="lock" label="Secure payments" />
        <ReassuranceItem type="support" label="Local support" />
      </div>
    </form>
  );
}

function ReassuranceItem({ type, label }: { type: 'check' | 'lock' | 'support'; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4">
      {type === 'check' ? (
        <svg className="h-4.5 w-4.5 text-[#176447]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.75l2 2 4.5-5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : type === 'lock' ? (
        <svg className="h-4.5 w-4.5 text-[#176447]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 10.5V8.25a4.5 4.5 0 019 0v2.25M6.75 10.5h10.5A1.75 1.75 0 0119 12.25v7A1.75 1.75 0 0117.25 21H6.75A1.75 1.75 0 015 19.25v-7a1.75 1.75 0 011.75-1.75z" />
        </svg>
      ) : (
        <svg className="h-4.5 w-4.5 text-[#176447]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.5 13.5v-1.25a7.5 7.5 0 0115 0v1.25M4.5 13.5v3A1.5 1.5 0 006 18h1.5v-6H6a1.5 1.5 0 00-1.5 1.5zm15 0v3A1.5 1.5 0 0118 18h-1.5v-6H18a1.5 1.5 0 011.5 1.5z" />
        </svg>
      )}
      <span className="font-medium">{label}</span>
    </div>
  );
}
