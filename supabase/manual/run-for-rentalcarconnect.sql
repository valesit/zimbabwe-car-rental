-- Rental Car Connect — run in Supabase SQL Editor (postgres role).
-- Admin user: admin@rentalcarconnect.com | id: 8ca81e4f-e63c-469b-8853-8eca467047b8
-- Safe to re-run where noted.

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
-- 4) Optional: five Harare fleet cars (owner = admin). Skip if you already seeded.
--    If your cars table still has daily_rate_zwl, change daily_rate_usd below to daily_rate_zwl.
-- ---------------------------------------------------------------------------
/*
insert into public.cars (owner_id, make, model, year, car_type, location_city, daily_rate_usd, description, is_active) values
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Nissan', 'March', 2022, 'hatchback', 'Harare', 35, 'Compact and economical.', true),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Vitz', 2022, 'hatchback', 'Harare', 45, 'City-friendly hatchback.', true),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Aqua', 2022, 'hatchback', 'Harare', 50, 'Hybrid hatchback.', true),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Axio', 2022, 'sedan', 'Harare', 55, 'Comfortable sedan.', true),
  ('8ca81e4f-e63c-469b-8853-8eca467047b8', 'Toyota', 'Hiace', 2021, 'van', 'Harare', 110, 'Spacious van for groups.', true);
*/

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- select id, role, display_name from public.profiles where id = '8ca81e4f-e63c-469b-8853-8eca467047b8';
