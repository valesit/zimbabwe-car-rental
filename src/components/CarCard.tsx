import Link from 'next/link';
import Image from 'next/image';
import type { Car } from '@/types/database';
import { getCarTypeLabel } from '@/types/database';
import { formatDailyRateUsd } from '@/lib/money';
import { carListingImageUrl } from '@/lib/carImages';

interface CarCardProps {
  car: Pick<Car, 'id' | 'make' | 'model' | 'year' | 'car_type' | 'location_city' | 'daily_rate_usd' | 'image_urls' | 'description'>;
}

export function CarCard({ car }: CarCardProps) {
  const imageUrl = carListingImageUrl(car);

  return (
    <Link href={`/listings/${car.id}`} className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(15,23,42,0.1)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image src={imageUrl} alt={`${car.make} ${car.model}`} fill className="object-cover transition duration-500 group-hover:scale-[1.025]" sizes="(max-width: 768px) 100vw, 33vw" />
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm" aria-hidden="true">
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" /></svg>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight text-slate-900">{car.make} {car.model} <span className="font-medium text-slate-500">({car.year})</span></h2>
            <p className="mt-1 text-sm text-slate-500">{getCarTypeLabel(car.car_type)} · {car.location_city}</p>
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="text-lg font-semibold text-emerald-800">{formatDailyRateUsd(car.daily_rate_usd)} <span className="text-xs font-medium text-slate-500">/ day</span></p>
          <span className="text-sm font-semibold text-emerald-700 transition group-hover:translate-x-0.5">View car →</span>
        </div>
      </div>
    </Link>
  );
}
