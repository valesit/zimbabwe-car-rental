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
    <Link
      href={`/listings/${car.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_45px_-24px_rgba(15,23,42,0.45)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/20 to-transparent" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
              {car.make} {car.model} ({car.year})
            </h2>
            <p className="mt-1 text-sm text-slate-500">{getCarTypeLabel(car.car_type)}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Available
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">From</p>
            <p className="mt-1 text-lg font-semibold text-emerald-800">
              {formatDailyRateUsd(car.daily_rate_usd)}{' '}
              <span className="text-sm font-medium text-slate-500">/ day</span>
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-700 transition group-hover:text-emerald-800">
            View car →
          </span>
        </div>
      </div>
    </Link>
  );
}
