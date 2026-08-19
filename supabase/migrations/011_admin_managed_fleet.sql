-- Rental Car Connect now uses a centrally managed fleet.
-- Customers are renters only; vehicle, availability and fleet-image management is admin-only.

-- Cars: remove legacy owner/self-service permissions.
drop policy if exists "Authenticated users can create cars" on public.cars;
drop policy if exists "Owners can update own cars" on public.cars;
drop policy if exists "Owners can delete own cars" on public.cars;
drop policy if exists "Active cars are viewable by everyone; owners and admins see all" on public.cars;

create policy "Active cars are viewable by everyone; admins see all"
  on public.cars for select
  using (
    is_active = true
    or public.get_my_role() = 'admin'
  );

-- Availability: remove legacy owner management. The existing
-- "Admins can manage all car_availability" policy from migration 005 remains in force.
drop policy if exists "Car owners can manage availability" on public.car_availability;

-- Bookings: customers see their own bookings; administrators see and manage all bookings.
-- Remove legacy access granted through a car's owner_id.
drop policy if exists "Users can view own or related bookings" on public.bookings;
drop policy if exists "Renter or car owner can update booking" on public.bookings;

create policy "Renters can view own bookings; admins see all"
  on public.bookings for select
  using (
    renter_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

-- Booking state changes are handled by the admin console or trusted server-side flows.
-- The existing "Admins can manage all bookings" policy from migration 005 remains in force.

-- Storage: customers no longer receive a writable car-image folder.
-- The existing "Admins full access car images" policy from migration 008 remains in force.
drop policy if exists "Users manage own car image folder" on storage.objects;
