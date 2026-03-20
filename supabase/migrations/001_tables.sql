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

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_cars_updated_at
  before update on public.cars
  for each row execute function public.set_updated_at();

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();
