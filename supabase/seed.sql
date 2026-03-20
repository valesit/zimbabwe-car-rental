-- Seed initial cars (run after migrations and after you have at least one user).
-- Replace YOUR_ADMIN_USER_UUID with your Supabase auth user ID (from Auth > Users in dashboard).

-- Example: Harare fleet (amounts in USD; column daily_rate_usd)
/*
insert into public.cars (owner_id, make, model, year, car_type, location_city, daily_rate_usd, description, is_active) values
  ('YOUR_ADMIN_USER_UUID', 'Nissan', 'March', 2022, 'hatchback', 'Harare', 35, 'Compact and economical.', true),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Vitz', 2022, 'hatchback', 'Harare', 45, 'City-friendly hatchback.', true),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Aqua', 2022, 'hatchback', 'Harare', 50, 'Hybrid hatchback.', true),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Axio', 2022, 'sedan', 'Harare', 55, 'Comfortable sedan.', true),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Hiace', 2021, 'van', 'Harare', 110, 'Spacious van for groups.', true);
*/

-- To make your user an admin (run once after signup):
-- update public.profiles set role = 'admin' where id = 'YOUR_USER_UUID';
