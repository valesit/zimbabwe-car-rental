-- Seed initial cars (run after migrations and after you have at least one user).
-- Replace YOUR_ADMIN_USER_UUID with your Supabase auth user ID (from Auth > Users in dashboard).

-- Example: insert 3 sample cars (update the owner_id to your user UUID)
/*
insert into public.cars (owner_id, make, model, year, car_type, location_city, daily_rate_zwl, description, is_active) values
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Hilux', 2022, 'pickup', 'Harare', 150000, 'Reliable double cab, ideal for trips.', true),
  ('YOUR_ADMIN_USER_UUID', 'Honda', 'Fit', 2021, 'hatchback', 'Bulawayo', 75000, 'Economical hatchback for city use.', true),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Land Cruiser', 2020, 'suv', 'Harare', 250000, 'Full-size SUV for family or off-road.', true);
*/

-- To make your user an admin (run once after signup):
-- update public.profiles set role = 'admin' where id = 'YOUR_USER_UUID';
