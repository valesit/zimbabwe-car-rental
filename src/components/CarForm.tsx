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
  returnTo?: string;
}

export function CarForm({ car, cities, imageStorageOwnerId, returnTo = '/admin/cars' }: CarFormProps) {
  const router = useRouter();
  const [make, setMake] = useState(car?.make ?? '');
  const [model, setModel] = useState(car?.model ?? '');
  const [year, setYear] = useState(car?.year?.toString() ?? '');
  const [carType, setCarType] = useState(car?.car_type ?? '');
  const [locationCity, setLocationCity] = useState(car?.location_city ?? '');
  const [locationDetail, setLocationDetail] = useState(car?.location_detail ?? '');
  const [dailyRate, setDailyRate] = useState(car?.daily_rate_usd?.toString() ?? '');
  const [refundableDeposit, setRefundableDeposit] = useState(
    car?.refundable_deposit_usd != null ? String(car.refundable_deposit_usd) : '0',
  );
  const [description, setDescription] = useState(car?.description ?? '');
  const [imageList, setImageList] = useState<string[]>(() =>
    (car?.image_urls ?? []).filter((url) => typeof url === 'string' && url.trim()),
  );
  const [urlExtras, setUrlExtras] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const fromTextarea = urlExtras
      .trim()
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);
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
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('cars').insert({ ...payload, owner_id: user.id });
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    router.push(returnTo);
    router.refresh();
    setLoading(false);
  }

  const fieldClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.11em] text-slate-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Vehicle information</p>
          <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">The essentials</h2>
          <p className="mt-1 text-sm text-slate-500">These details appear on the public listing.</p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Make</span>
            <input type="text" value={make} onChange={(e) => setMake(e.target.value)} required placeholder="e.g. Toyota" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Model</span>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="e.g. RAV4" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Year</span>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required min={1900} max={2100} placeholder="2024" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Vehicle type</span>
            <select value={carType} onChange={(e) => setCarType(e.target.value)} required className={fieldClass}>
              <option value="">Select type</option>
              {CAR_TYPES.map((type) => (
                <option key={type} value={type}>{CAR_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="border-t border-slate-100 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Location &amp; pricing</p>
        <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Rental details</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>City</span>
            <select value={locationCity} onChange={(e) => setLocationCity(e.target.value)} required className={fieldClass}>
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Area / pick-up location</span>
            <input type="text" value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} placeholder="e.g. Borrowdale" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Daily rate (USD)</span>
            <input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} required min={0} step={0.01} placeholder="65" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Refundable deposit (USD)</span>
            <input type="number" value={refundableDeposit} onChange={(e) => setRefundableDeposit(e.target.value)} min={0} step={0.01} className={fieldClass} />
            <p className="mt-2 text-xs leading-5 text-slate-400">Charged with the booking and refundable according to your rental policy.</p>
          </label>
        </div>
        <label className="mt-5 block">
          <span className={labelClass}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the vehicle, comfort, ideal use and any useful rental details."
            className={fieldClass}
          />
        </label>
      </section>

      <section className="border-t border-slate-100 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Photography</p>
        <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Car photos</h2>
        <p className="mt-1 text-sm text-slate-500">Use clear exterior and interior images. The first image becomes the primary listing photo.</p>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
          <CarImageUploader
            ownerIdForStoragePath={imageStorageOwnerId}
            imageUrls={imageList}
            onChange={setImageList}
          />
        </div>
        <label className="mt-5 block">
          <span className={labelClass}>Additional image URLs</span>
          <textarea
            value={urlExtras}
            onChange={(e) => setUrlExtras(e.target.value)}
            rows={2}
            placeholder="One URL per line (optional)"
            className={fieldClass}
          />
        </label>
      </section>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(returnTo)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving…' : car ? 'Save changes' : 'Add to fleet'}
        </button>
      </div>
    </form>
  );
}
