# Skyrise Car Rental (MVP)

A Turo-style car rental platform for Zimbabwe: list cars, book by availability, leave reviews, and manage support. Built with Next.js 14 and Supabase (PostgreSQL).

## Features

- **Public:** Browse cars with filters (dates, city, car type). View listing details and availability.
- **Users:** Sign up, list cars, set availability, request bookings, leave reviews after completed trips, open support tickets.
- **Admin:** Manage all cars (add/edit/remove), mark users as Verified or Premium, handle support tickets.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/001_tables.sql`
   - `supabase/migrations/002_trigger_new_user.sql`
   - `supabase/migrations/003_rls.sql`
   - `supabase/migrations/004_seed_cities.sql`
3. Copy the project URL and anon key from Settings > API.

### 2. App

```bash
cp .env.local.example .env.local
# Edit .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. First admin and seed cars

1. Sign up a user in the app.
2. In Supabase SQL Editor, set that user as admin:
   ```sql
   update public.profiles set role = 'admin' where id = 'YOUR_USER_UUID';
   ```
   (Get the UUID from Authentication > Users.)
3. Seed initial cars (optional):
   ```bash
   node scripts/seed-cars.mjs YOUR_SUPABASE_URL YOUR_ANON_KEY YOUR_USER_UUID
   ```
   Or add cars via the app: log in, go to Dashboard > Add car, and set availability in Edit listing.

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase: Auth, PostgreSQL, Row Level Security

## Project structure

- `src/app/(public)/` – Home, listings, car detail
- `src/app/(auth)/` – Login, signup
- `src/app/(dashboard)/` – User dashboard, my listings, bookings, support
- `src/app/(admin)/` – Admin: cars, users, support
- `supabase/migrations/` – Schema, RLS, trigger, seed cities
