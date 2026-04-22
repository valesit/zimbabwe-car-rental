-- =============================================================================
-- RENTAL CAR CONNECT — COMPLETE DATABASE SETUP (single script)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (postgres / full DDL).
--
-- • New empty project: run the whole file once.
-- • Already applied 001–007: run only PART 008, then PART TENANT (or skip tenant).
-- • Re-running schema parts may fail on existing triggers/policies — use fresh DB
--   or run individual migration files from supabase/migrations/.
--
-- TENANT BLOCK: Replace ADMIN_UUID if your admin user id differs. That user must
-- exist in Authentication (auth.users) before the profile upsert, or the insert
-- will fail the FK to auth.users.
-- =============================================================================

-- ########## 001_tables.sql ##########

-- Zimbabwe Car Rental MVP: Core tables
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_verified boolean not null default false,
  is_premium boolean not null default false,
  display_name text,
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Zimbabwe cities (for dropdowns and filters)
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Cars
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null check (year >= 1900 and year <= 2100),
  car_type text not null check (car_type in ('sedan', 'suv', 'hatchback', 'pickup', 'van', 'other')),
  location_city text not null,
  location_detail text,
  daily_rate_usd decimal(12,2) not null check (daily_rate_usd >= 0),
  image_urls text[] default '{}',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cars_owner on public.cars(owner_id);
create index if not exists idx_cars_location on public.cars(location_city);
create index if not exists idx_cars_type on public.cars(car_type);
create index if not exists idx_cars_active on public.cars(is_active) where is_active = true;

-- Car availability (per date)
create table if not exists public.car_availability (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  available_date date not null,
  is_available boolean not null default true,
  unique(car_id, available_date)
);

create index if not exists idx_car_availability_car_date on public.car_availability(car_id, available_date);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete restrict,
  renter_id uuid not null references public.profiles(id) on delete restrict,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  total_amount_usd decimal(12,2) not null check (total_amount_usd >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_car on public.bookings(car_id);
create index if not exists idx_bookings_renter on public.bookings(renter_id);
create index if not exists idx_bookings_dates on public.bookings(start_date, end_date);

-- Reviews (for completed bookings)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(booking_id)
);

create index if not exists idx_reviews_booking on public.reviews(booking_id);
create index if not exists idx_reviews_reviewee on public.reviews(reviewee_id);

-- Support tickets
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_cars_updated_at on public.cars;
create trigger set_cars_updated_at
  before update on public.cars
  for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- ########## 002_trigger_new_user.sql ##########

-- Create profile when a new user signs up (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'user',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ########## 003_rls.sql ##########

-- Row Level Security for Zimbabwe Car Rental

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.cars enable row level security;
alter table public.car_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.support_tickets enable row level security;

-- Idempotent re-run: policies from 003 (and 005’s replacements share the same names for the six admin/select policies)
drop policy if exists "Cities are viewable by everyone" on public.cities;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Active cars are viewable by everyone; owners and admins see all" on public.cars;
drop policy if exists "Authenticated users can create cars" on public.cars;
drop policy if exists "Owners can update own cars" on public.cars;
drop policy if exists "Owners can delete own cars" on public.cars;
drop policy if exists "Car availability is viewable by everyone" on public.car_availability;
drop policy if exists "Car owners can manage availability" on public.car_availability;
drop policy if exists "Users can view own or related bookings" on public.bookings;
drop policy if exists "Authenticated users can create bookings as renter" on public.bookings;
drop policy if exists "Renter or car owner can update booking" on public.bookings;
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
drop policy if exists "Renter can create review for own completed booking" on public.reviews;
drop policy if exists "Users can view own tickets" on public.support_tickets;
drop policy if exists "Users can create own tickets" on public.support_tickets;
drop policy if exists "Users can update own tickets (limited - e.g. add message)" on public.support_tickets;
drop policy if exists "Admins can manage all profiles" on public.profiles;
drop policy if exists "Admins can manage all cars" on public.cars;
drop policy if exists "Admins can manage all car_availability" on public.car_availability;
drop policy if exists "Admins can manage all bookings" on public.bookings;
drop policy if exists "Admins can manage all support_tickets" on public.support_tickets;

-- Cities: public read
create policy "Cities are viewable by everyone"
  on public.cities for select
  using (true);

-- Profiles: users can read all (for listings/owners), update own; admin can update verified/premium
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only admin can set is_verified, is_premium, role (handled via service role or admin check in app)
-- For RLS we allow owner to update but app will restrict sensitive fields; or use a separate admin API.
-- Simpler: allow update for own row; admin-only fields we enforce in app (admin dashboard uses service role or backend).
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cars: public read active cars; owner and admin can insert/update/delete
create policy "Active cars are viewable by everyone; owners and admins see all"
  on public.cars for select
  using (
    is_active = true
    or owner_id = auth.uid()
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Authenticated users can create cars"
  on public.cars for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own cars"
  on public.cars for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete own cars"
  on public.cars for delete
  using (auth.uid() = owner_id);

-- Car availability: readable by everyone (for calendar); writable by car owner
create policy "Car availability is viewable by everyone"
  on public.car_availability for select
  using (true);

create policy "Car owners can manage availability"
  on public.car_availability for all
  using (
    exists (select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid())
  );

-- Bookings: renter and car owner can read; renter can create; owner can update (confirm/cancel)
create policy "Users can view own or related bookings"
  on public.bookings for select
  using (renter_id = auth.uid() or exists (select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid()));

create policy "Authenticated users can create bookings as renter"
  on public.bookings for insert
  with check (auth.uid() = renter_id);

create policy "Renter or car owner can update booking"
  on public.bookings for update
  using (
    renter_id = auth.uid() or exists (select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid())
  );

-- Reviews: public read; reviewer can insert for own completed booking
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Renter can create review for own completed booking"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.renter_id = auth.uid() and b.status = 'completed'
    )
  );

-- Support tickets: user sees own; user can create; admin needs to update (use service role in admin or add policy for admin)
create policy "Users can view own tickets"
  on public.support_tickets for select
  using (user_id = auth.uid());

create policy "Users can create own tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tickets (limited - e.g. add message)"
  on public.support_tickets for update
  using (user_id = auth.uid());

-- Admin policies: allow admin role to do everything (admin dashboard will use auth.uid() and role from profiles)
-- We need a helper or check role in policies. Supabase RLS can use: (select role from public.profiles where id = auth.uid()) = 'admin'
create policy "Admins can manage all profiles"
  on public.profiles for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can manage all cars"
  on public.cars for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can manage all car_availability"
  on public.car_availability for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can manage all bookings"
  on public.bookings for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can manage all support_tickets"
  on public.support_tickets for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ########## 004_seed_cities.sql ##########

-- Harare only for now; add more cities later via insert or a new migration
insert into public.cities (name) values ('Harare') on conflict (name) do nothing;

-- ########## 005_fix_rls_recursion.sql ##########

-- Fix infinite recursion: policies must not read from profiles when evaluating profiles RLS.
-- Use a SECURITY DEFINER function that bypasses RLS to get the current user's role.

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1
$$;

-- Ensure anon and authenticated can call it (required for RLS)
grant execute on function public.get_my_role() to anon;
grant execute on function public.get_my_role() to authenticated;

-- Drop policies that use (select role from public.profiles where id = auth.uid())
drop policy if exists "Active cars are viewable by everyone; owners and admins see all" on public.cars;
drop policy if exists "Admins can manage all profiles" on public.profiles;
drop policy if exists "Admins can manage all cars" on public.cars;
drop policy if exists "Admins can manage all car_availability" on public.car_availability;
drop policy if exists "Admins can manage all bookings" on public.bookings;
drop policy if exists "Admins can manage all support_tickets" on public.support_tickets;

-- Recreate cars SELECT (public + owner + admin via helper)
create policy "Active cars are viewable by everyone; owners and admins see all"
  on public.cars for select
  using (
    is_active = true
    or owner_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

-- Admins can manage all profiles (using helper, no self-read)
create policy "Admins can manage all profiles"
  on public.profiles for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Admins can manage all cars
create policy "Admins can manage all cars"
  on public.cars for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Admins can manage all car_availability
create policy "Admins can manage all car_availability"
  on public.car_availability for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Admins can manage all bookings
create policy "Admins can manage all bookings"
  on public.bookings for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Admins can manage all support_tickets
create policy "Admins can manage all support_tickets"
  on public.support_tickets for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ########## 006_harare_only_cities.sql ##########

-- Single market: Harare only (add more cities with insert later)
delete from public.cities where name <> 'Harare';
insert into public.cities (name) values ('Harare') on conflict (name) do nothing;

-- ########## 007_rename_amount_columns_usd.sql ##########

-- Legacy installs used *_zwl column names; amounts are USD. Rename if still present (idempotent).
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

-- ########## 008_storage_and_site_promo.sql ##########

-- Public buckets for car listing photos and home promo banner (URLs stored in DB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('car-images', 'car-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]),
  ('promo-banners', 'promo-banners', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects policies (RLS is enabled by default on storage.objects)
drop policy if exists "Public read car images" on storage.objects;
drop policy if exists "Users manage own car image folder" on storage.objects;
drop policy if exists "Admins full access car images" on storage.objects;
drop policy if exists "Public read promo banners" on storage.objects;
drop policy if exists "Admins manage promo banners" on storage.objects;

create policy "Public read car images"
  on storage.objects for select
  using (bucket_id = 'car-images');

create policy "Users manage own car image folder"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'car-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'car-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins full access car images"
  on storage.objects for all to authenticated
  using (bucket_id = 'car-images' and public.get_my_role() = 'admin')
  with check (bucket_id = 'car-images' and public.get_my_role() = 'admin');

create policy "Public read promo banners"
  on storage.objects for select
  using (bucket_id = 'promo-banners');

create policy "Admins manage promo banners"
  on storage.objects for all to authenticated
  using (bucket_id = 'promo-banners' and public.get_my_role() = 'admin')
  with check (bucket_id = 'promo-banners' and public.get_my_role() = 'admin');

-- Singleton promo row for home banner + optional CTA copy
create table if not exists public.site_promo (
  id int primary key default 1 check (id = 1),
  banner_url text,
  headline text,
  subheadline text,
  cta_label text,
  cta_href text,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_site_promo_updated_at on public.site_promo;
create trigger set_site_promo_updated_at
  before update on public.site_promo
  for each row execute function public.set_updated_at();

insert into public.site_promo (id) values (1)
on conflict (id) do nothing;

alter table public.site_promo enable row level security;

drop policy if exists "Anyone can read site promo" on public.site_promo;
drop policy if exists "Admins update site promo" on public.site_promo;
drop policy if exists "Admins insert site promo" on public.site_promo;

create policy "Anyone can read site promo"
  on public.site_promo for select using (true);

create policy "Admins update site promo"
  on public.site_promo for update using (public.get_my_role() = 'admin');

create policy "Admins insert site promo"
  on public.site_promo for insert with check (public.get_my_role() = 'admin');

-- ########## TENANT: admin role + Harare fleet (edit ADMIN_UUID) ##########
-- Requires: that UUID must already exist in Authentication (auth.users), or the
-- profile INSERT fails (FK). New project: create the admin user in the Dashboard
-- first, replace admin_uuid with their id, then run from this section (or re-run
-- the whole script after signup — schema parts will error if already applied).
-- Default matches run-for-rentalcarconnect.sql (admin@rentalcarconnect.com).
-- Fleet USD/day: March 35, Vitz 45, Aqua 50, Axio 55, Hiace 110.

do $tenant$
declare
  admin_uuid uuid := '8ca81e4f-e63c-469b-8853-8eca467047b8';
begin
  update public.profiles
  set role = 'admin'
  where id = admin_uuid;

  insert into public.profiles (id, role, display_name)
  values (admin_uuid, 'admin', 'Admin')
  on conflict (id) do update set role = 'admin';

  delete from public.cars
  where owner_id = admin_uuid
    and (
      (make = 'Nissan' and model = 'March')
      or (make = 'Toyota' and model in ('Vitz', 'Aqua', 'Axio', 'Hiace'))
    );

  insert into public.cars (owner_id, make, model, year, car_type, location_city, daily_rate_usd, description, is_active, image_urls) values
    (admin_uuid, 'Nissan', 'March', 2022, 'hatchback', 'Harare', 35, 'Nissan March — $35/day.', true, array['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80']::text[]),
    (admin_uuid, 'Toyota', 'Vitz', 2022, 'hatchback', 'Harare', 45, 'Toyota Vitz — $45/day.', true, array['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80']::text[]),
    (admin_uuid, 'Toyota', 'Aqua', 2022, 'hatchback', 'Harare', 50, 'Toyota Aqua — $50/day.', true, array['https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80']::text[]),
    (admin_uuid, 'Toyota', 'Axio', 2022, 'sedan', 'Harare', 55, 'Toyota Axio — $55/day.', true, array['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80']::text[]),
    (admin_uuid, 'Toyota', 'Hiace', 2021, 'van', 'Harare', 110, 'Toyota Hiace — $110/day.', true, array['https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80']::text[]);
end $tenant$;

-- verify: select id, role from public.profiles where id = '8ca81e4f-e63c-469b-8853-8eca467047b8';
-- verify: select make, model, daily_rate_usd from public.cars where owner_id = '8ca81e4f-e63c-469b-8853-8eca467047b8';

-- ---------------------------------------------------------------------------
-- Migration 009 (also in supabase/migrations/009_booking_payments.sql)
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists payment_currency text default 'USD',
  add column if not exists payment_status text;

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status is null or payment_status in ('paid', 'refunded', 'pending'));

create unique index if not exists idx_bookings_paypal_order_id_unique
  on public.bookings (paypal_order_id)
  where paypal_order_id is not null;

-- ---------------------------------------------------------------------------
-- Migration 010 (also in supabase/migrations/010_car_deposit_booking_extras.sql)
-- ---------------------------------------------------------------------------
alter table public.cars
  add column if not exists refundable_deposit_usd decimal(12, 2) not null default 0
    check (refundable_deposit_usd >= 0);

alter table public.bookings
  add column if not exists include_pickup_dropoff boolean not null default false,
  add column if not exists pickup_dropoff_fee_usd decimal(12, 2) not null default 0
    check (pickup_dropoff_fee_usd >= 0),
  add column if not exists refundable_deposit_charged_usd decimal(12, 2) not null default 0
    check (refundable_deposit_charged_usd >= 0);
