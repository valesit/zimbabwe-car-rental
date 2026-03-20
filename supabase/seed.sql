-- Seed initial cars (run after migrations and after you have at least one user).
-- Replace YOUR_ADMIN_USER_UUID with your Supabase auth user ID (from Auth > Users in dashboard).

-- Example: Harare fleet — USD/day March 35, Vitz 45, Aqua 50, Axio 55, Hiace 110 (column daily_rate_usd)
/*
insert into public.cars (owner_id, make, model, year, car_type, location_city, daily_rate_usd, description, is_active, image_urls) values
  ('YOUR_ADMIN_USER_UUID', 'Nissan', 'March', 2022, 'hatchback', 'Harare', 35, 'Nissan March — $35/day.', true, array['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80']::text[]),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Vitz', 2022, 'hatchback', 'Harare', 45, 'Toyota Vitz — $45/day.', true, array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80']::text[]),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Aqua', 2022, 'hatchback', 'Harare', 50, 'Toyota Aqua — $50/day.', true, array['https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80']::text[]),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Axio', 2022, 'sedan', 'Harare', 55, 'Toyota Axio — $55/day.', true, array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80']::text[]),
  ('YOUR_ADMIN_USER_UUID', 'Toyota', 'Hiace', 2021, 'van', 'Harare', 110, 'Toyota Hiace — $110/day.', true, array['https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80']::text[]);
*/

-- To make your user an admin (run once after signup):
-- update public.profiles set role = 'admin' where id = 'YOUR_USER_UUID';
