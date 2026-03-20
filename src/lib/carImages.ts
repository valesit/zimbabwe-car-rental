import type { CarType } from '@/types/database';

const U = 'https://images.unsplash.com';
const q = '?auto=format&fit=crop&w=900&q=80';

/** Fallback when `image_urls` is empty — Unsplash photos ≈ body style (keep in sync with fleet in scripts + supabase/manual). */
export function placeholderImageForCarType(carType: CarType | string): string {
  const byType: Record<string, string> = {
    hatchback: `${U}/photo-1549317661-bd32c8ce0db2${q}`, // compact / city car
    sedan: `${U}/photo-1617814076367-b759c7d7e738${q}`, // four-door saloon
    suv: `${U}/photo-1519641471654-76ce0107ad1b${q}`,
    van: `${U}/photo-1566576912321-d58ddd7a6088${q}`, // panel / passenger van
    pickup: `${U}/photo-1601584115197-04ecc0da31d7${q}`,
    other: `${U}/photo-1494976388531-d1058494cdd8${q}`,
  };
  return byType[carType] ?? byType.other;
}

export function carListingImageUrl(car: {
  image_urls?: string[] | null;
  car_type: string;
}): string {
  const first = car.image_urls?.find((u) => u?.trim());
  if (first) return first.trim();
  return placeholderImageForCarType(car.car_type);
}
