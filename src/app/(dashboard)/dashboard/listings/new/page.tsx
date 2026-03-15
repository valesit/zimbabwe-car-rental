import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Add a car</h1>
      <CarForm cities={cities ?? []} />
    </div>
  );
}
