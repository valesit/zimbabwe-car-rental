-- Rental Car Connect — run in Supabase SQL Editor (postgres role).
-- Admin user: admin@rentalcarconnect.com | id: 8ca81e4f-e63c-469b-8853-8eca467047b8
-- Safe to re-run where noted.
--
-- Canonical fleet (USD / day) — amounts stored in daily_rate_usd:
--   Nissan March   $35
--   Toyota Vitz    $45   (same car as “Viyz” spelling)
--   Toyota Aqua    $50
--   Toyota Axio    $55
--   Toyota Hiace   $110

-- ---------------------------------------------------------------------------
-- 1) Harare only
-- ---------------------------------------------------------------------------
delete from public.cities where name <> 'Harare';
insert into public.cities (name) values ('Harare') on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 2) USD column names (skip if you already have daily_rate_usd / total_amount_usd)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cars' and column_name = 'daily_rate_zwl'
  ) then
    alter table public.cars rename column daily_rate_zwl to daily_rate_usd;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'total_amount_zwl'
  ) then
    alter table public.bookings rename column total_amount_zwl to total_amount_usd;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Make this user admin
-- ---------------------------------------------------------------------------
update public.profiles
set role = 'admin'
where id = '8ca81e4f-e63c-469b-8853-8eca467047b8';

insert into public.profiles (id, role, display_name)
values (
  '8ca81e4f-e63c-469b-8853-8eca467047b8',
  'admin',
  'Admin'
)
on conflict (id) do update set role = 'admin';

-- ---------------------------------------------------------------------------
-- 4) Five Harare fleet cars (owner = admin). Safe to re-run: removes same models for this owner first.
--    If your cars table still has daily_rate_zwl only, rename (section 2) or swap column name in INSERT below.
--    After insert: set availability in the app (Edit listing) or use scripts/bootstrap-admin-and-fleet.mjs for 365-day slots.
-- ---------------------------------------------------------------------------
delete from public.cars
where owner_id = '8ca81e4f-e63c-469b-8853-8eca467047b8'
  and (
    (make = 'Nissan' and model = 'March')
    or (make = 'Toyota' and model in ('Vitz', 'Aqua', 'Axio', 'Hiace'))
  );

insert into public.cars (owner_id, make, model, year, car_type, location_city, daily_rate_usd, description, is_active, image_urls) values
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Nissan', 'March', 2022, 'hatchback', 'Harare', 35, 'Nissan March — $35/day.', true, array['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80']::text[]),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Vitz', 2022, 'hatchback', 'Harare', 45, 'Toyota Vitz — $45/day.', true, array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80']::text[]),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Aqua', 2022, 'hatchback', 'Harare', 50, 'Toyota Aqua — $50/day.', true, array['https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80']::text[]),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Axio', 2022, 'sedan', 'Harare', 55, 'Toyota Axio — $55/day.', true, array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80']::text[]),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Hiace', 2021, 'van', 'Harare', 110, 'Toyota Hiace — $110/day.', true, array['https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80']::text[]);

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- select id, role, display_name from public.profiles where id = '8ca81e4f-e63c-469b-8853-8eca467047b8';
