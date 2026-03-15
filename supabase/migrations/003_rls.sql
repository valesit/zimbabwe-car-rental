-- Row Level Security for Zimbabwe Car Rental

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.cars enable row level security;
alter table public.car_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.support_tickets enable row level security;

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
