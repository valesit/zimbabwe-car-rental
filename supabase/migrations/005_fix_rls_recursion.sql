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
