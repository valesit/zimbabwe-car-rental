/**
 * Seed initial cars. Usage:
 *   node scripts/seed-cars.mjs <SUPABASE_URL> <SUPABASE_ANON_KEY> <OWNER_USER_ID>
 *
 * Get OWNER_USER_ID from Supabase Dashboard > Authentication > Users (copy the UUID).
 * Run migrations and seed cities first. Then create an account and use that user's ID.
 * To make that user admin: update public.profiles set role = 'admin' where id = '...';
 */

const [url, anonKey, ownerId] = process.argv.slice(2);
if (!url || !anonKey || !ownerId) {
  console.error('Usage: node scripts/seed-cars.mjs <SUPABASE_URL> <SUPABASE_ANON_KEY> <OWNER_USER_ID>');
  process.exit(1);
}

const cars = [
  { make: 'Toyota', model: 'Hilux', year: 2022, car_type: 'pickup', location_city: 'Harare', daily_rate_zwl: 150000, description: 'Reliable double cab, ideal for trips.' },
  { make: 'Honda', model: 'Fit', year: 2021, car_type: 'hatchback', location_city: 'Bulawayo', daily_rate_zwl: 75000, description: 'Economical hatchback for city use.' },
  { make: 'Toyota', model: 'Land Cruiser', year: 2020, car_type: 'suv', location_city: 'Harare', daily_rate_zwl: 250000, description: 'Full-size SUV for family or off-road.' },
  { make: 'Nissan', model: 'X-Trail', year: 2021, car_type: 'suv', location_city: 'Mutare', daily_rate_zwl: 120000, description: 'Comfortable SUV for long drives.' },
  { make: 'Toyota', model: 'Corolla', year: 2023, car_type: 'sedan', location_city: 'Harare', daily_rate_zwl: 85000, description: 'Sedan for business or leisure.' },
];

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, anonKey);
  for (const car of cars) {
    const { error } = await supabase.from('cars').insert({
      owner_id: ownerId,
      ...car,
      is_active: true,
    });
    if (error) {
      console.error('Error inserting car:', car.make, car.model, error.message);
    } else {
      console.log('Inserted:', car.make, car.model);
    }
  }
  console.log('Done. Make your user admin with: update public.profiles set role = \'admin\' where id = \'' + ownerId + '\';');
}

main();
