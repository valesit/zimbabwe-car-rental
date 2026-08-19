'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CAR_TYPES, CAR_TYPE_LABELS } from '@/types/database';
import { CarImageUploader } from '@/components/CarImageUploader';

interface CarFormProps {
  car?: {
    id: string;
    make: string;
    model: string;
    year: number;
    car_type: string;
    location_city: string;
    location_detail: string | null;
    daily_rate_usd: number;
    refundable_deposit_usd?: number;
    description: string | null;
    image_urls: string[];
  };
  cities: { name: string }[];
  imageStorageOwnerId: string;
  redirectPath?: string;
}

export function CarForm({ car, cities, imageStorageOwnerId, redirectPath = '/dashboard' }: CarFormProps) {
  const router = useRouter();
  const [make, setMake] = useState(car?.make ?? '');
  const [model, setModel] = useState(car?.model ?? '');
  const [year, setYear] = useState(car?.year?.toString() ?? '');
  const [carType, setCarType] = useState(car?.car_type ?? '');
  const [locationCity, setLocationCity] = useState(car?.location_city ?? '');
  const [locationDetail, setLocationDetail] = useState(car?.location_detail ?? '');
  const [dailyRate, setDailyRate] = useState(car?.daily_rate_usd?.toString() ?? '');
  const [refundableDeposit, setRefundableDeposit] = useState(car?.refundable_deposit_usd != null ? String(car.refundable_deposit_usd) : '0');
  const [description, setDescription] = useState(car?.description ?? '');
  const [imageList, setImageList] = useState<string[]>(() => (car?.image_urls ?? []).filter((u) => typeof u === 'string' && u.trim()));
  const [urlExtras, setUrlExtras] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const fromTextarea = urlExtras.trim().split('\n').map((u) => u.trim()).filter(Boolean);
    const image_urls = Array.from(new Set([...imageList, ...fromTextarea]));
    const payload = {
      make,
      model,
      year: parseInt(year, 10),
      car_type: carType as 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van' | 'other',
      location_city: locationCity,
      location_detail: locationDetail || null,
      daily_rate_usd: parseFloat(dailyRate) || 0,
      refundable_deposit_usd: Math.max(0, parseFloat(refundableDeposit) || 0),
      description: description || null,
      image_urls,
      is_active: true,
    };

    if (car) {
      const { error: updateError } = await supabase.from('cars').update(payload).eq('id', car.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
    } else {
      const { error: insertError } = await supabase.from('cars').insert({ ...payload, owner_id: user.id });
      if (insertError) { setError(insertError.message); setLoading(false); return; }
    }

    router.push(redirectPath);
    router.refresh();
    setLoading(false);
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.09em] text-slate-500';

  return (
    <form onSubmit={handleSubmit} className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <div className="surface-card p-6 sm:p-7">
        <div className="border-b border-slate-100 pb-5"><h2 className="text-lg font-semibold text-slate-900">Vehicle details</h2><p className="mt-1 text-sm text-slate-500">Core information customers will see on the listing.</p></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label><span className={labelClass}>Make</span><input type="text" value={make} onChange={(e) => setMake(e.target.value)} required placeholder="e.g. Toyota" className={inputClass} /></label>
          <label><span className={labelClass}>Model</span><input type="text" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="e.g. RAV4" className={inputClass} /></label>
          <label><span className={labelClass}>Year</span><input type="number" value={year} onChange={(e) => setYear(e.target.value)} required min={1900} max={2100} placeholder="2024" className={inputClass} /></label>
          <label><span className={labelClass}>Car type</span><select value={carType} onChange={(e) => setCarType(e.target.value)} required className={inputClass}><option value="">Select type</option>{CAR_TYPES.map((t) => <option key={t} value={t}>{CAR_TYPE_LABELS[t]}</option>)}</select></label>
          <label><span className={labelClass}>City</span><select value={locationCity} onChange={(e) => setLocationCity(e.target.value)} required className={inputClass}><option value="">Select city</option>{cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>
          <label><span className={labelClass}>Pickup area</span><input type="text" value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} placeholder="Optional area or address" className={inputClass} /></label>
          <label><span className={labelClass}>Daily rate (USD)</span><div className="relative"><span className="absolute left-3.5 top-[1.05rem] text-sm text-slate-400">$</span><input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} required min={0} step={0.01} className={`${inputClass} pl-7`} /></div></label>
          <label><span className={labelClass}>Refundable deposit (USD)</span><div className="relative"><span className="absolute left-3.5 top-[1.05rem] text-sm text-slate-400">$</span><input type="number" value={refundableDeposit} onChange={(e) => setRefundableDeposit(e.target.value)} min={0} step={0.01} className={`${inputClass} pl-7`} /></div></label>
        </div>
        <label className="mt-5 block"><span className={labelClass}>Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe the vehicle, ideal use, key features, and anything renters should know." className={inputClass} /></label>
      </div>

      <div className="space-y-6">
        <div className="surface-card p-6 sm:p-7">
          <div className="border-b border-slate-100 pb-5"><h2 className="text-lg font-semibold text-slate-900">Car photos</h2><p className="mt-1 text-sm text-slate-500">Use clear exterior and interior images to help customers choose confidently.</p></div>
          <div className="mt-6"><CarImageUploader ownerIdForStoragePath={imageStorageOwnerId} imageUrls={imageList} onChange={setImageList} /></div>
          <label className="mt-5 block"><span className={labelClass}>Additional image URLs</span><textarea value={urlExtras} onChange={(e) => setUrlExtras(e.target.value)} rows={3} placeholder="One URL per line (optional)" className={inputClass} /></label>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="m9 12 2 2 4-4m5.62-4.02A11.95 11.95 0 0 1 12 2.94a11.95 11.95 0 0 1-8.62 3.04A12 12 0 0 0 3 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02Z" /></svg></div><div><p className="font-semibold text-slate-900">Published as an active listing</p><p className="mt-1 text-sm leading-6 text-slate-500">Saving makes this vehicle active. You can hide it later from Fleet management.</p></div></div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => router.push(redirectPath)} className="secondary-button">Cancel</button>
          <button type="submit" disabled={loading} className="primary-button min-w-36 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Saving…' : car ? 'Save changes' : 'Add car'}</button>
        </div>
      </div>
    </form>
  );
}
