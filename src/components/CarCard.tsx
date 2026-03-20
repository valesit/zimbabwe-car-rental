import Link from 'next/link';
import Image from 'next/image';
import type { Car } from '@/types/database';
import { getCarTypeLabel } from '@/types/database';
import { formatDailyRateUsd } from '@/lib/money';

interface CarCardProps {
  car: Pick<Car, 'id' | 'make' | 'model' | 'year' | 'car_type' | 'location_city' | 'daily_rate_usd' | 'image_urls' | 'description'>;
}

export function CarCard({ car }: CarCardProps) {
  const imageUrl = car.image_urls?.[0] ?? null;

  return (
    <Link
      href={`/listings/${car.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] relative bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-semibold text-slate-800">
          {car.make} {car.model} ({car.year})
        </h2>
        <p className="mt-1 text-sm text-gray-500">{getCarTypeLabel(car.car_type)}</p>
        <p className="mt-1 text-sm text-gray-600">{car.location_city}</p>
        <p className="mt-2 font-medium text-slate-800">
          {formatDailyRateUsd(car.daily_rate_usd)} <span className="text-sm font-normal text-gray-500">/ day</span>
        </p>
      </div>
    </Link>
  );
}
