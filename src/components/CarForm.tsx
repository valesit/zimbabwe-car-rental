'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CAR_TYPES } from '@/types/database';

interface CarFormProps {
  car?: {
    id: string;
    make: string;
    model: string;
    year: number;
    car_type: string;
    location_city: string;
    location_detail: string | null;
    daily_rate_zwl: number;
    description: string | null;
    image_urls: string[];
  };
  cities: { name: string }[];
}

export function CarForm({ car, cities }: CarFormProps) {
  const router = useRouter();
  const [make, setMake] = useState(car?.make ?? '');
  const [model, setModel] = useState(car?.model ?? '');
  const [year, setYear] = useState(car?.year?.toString() ?? '');
  const [carType, setCarType] = useState(car?.car_type ?? '');
  const [locationCity, setLocationCity] = useState(car?.location_city ?? '');
  const [locationDetail, setLocationDetail] = useState(car?.location_detail ?? '');
  const [dailyRate, setDailyRate] = useState(car?.daily_rate_zwl?.toString() ?? '');
  const [description, setDescription] = useState(car?.description ?? '');
  const [imageUrls, setImageUrls] = useState(car?.image_urls?.join('\n') ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const urls = imageUrls.trim() ? imageUrls.trim().split('\n').map((u) => u.trim()).filter(Boolean) : [];
    const payload = {
      make,
      model,
      year: parseInt(year, 10),
      car_type: carType as 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van' | 'other',
      location_city: locationCity,
      location_detail: locationDetail || null,
      daily_rate_zwl: parseFloat(dailyRate) || 0,
      description: description || null,
      image_urls: urls,
      is_active: true,
    };
    if (car) {
      const { error: updateError } = await supabase.from('cars').update(payload).eq('id', car.id);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } else {
      const { error: insertError } = await supabase.from('cars').insert({ ...payload, owner_id: user.id });
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Make</span>
          <input
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Model</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Year</span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            min={1900}
            max={2100}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Car type</span>
          <select
            value={carType}
            onChange={(e) => setCarType(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select</option>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">City</span>
        <select
          value={locationCity}
          onChange={(e) => setLocationCity(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Address / area (optional)</span>
        <input
          type="text"
          value={locationDetail}
          onChange={(e) => setLocationDetail(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Daily rate (ZWL)</span>
        <input
          type="number"
          value={dailyRate}
          onChange={(e) => setDailyRate(e.target.value)}
          required
          min={0}
          step={0.01}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Image URLs (one per line, optional)</span>
        <textarea
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          rows={3}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : car ? 'Update car' : 'Add car'}
      </button>
    </form>
  );
}
