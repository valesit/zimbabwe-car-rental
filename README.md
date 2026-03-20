# Rental Car Connect (MVP)

A Turo-style car rental platform focused on **Harare** (more cities later): list cars, book by availability, leave reviews, and manage support. Built with Next.js 14 and Supabase (PostgreSQL).

## Features

- **Public:** Browse cars with filters (dates, city, car type). View listing details and availability.
- **Users:** Sign up, list cars, set availability, request bookings, leave reviews after completed trips, open support tickets.
- **Admin:** Dashboard analytics, manage cars (add/edit/remove), users (verified/premium), support tickets, **promo banner** for the home page.
- **Storage:** Upload car photos (owners & admins) to Supabase Storage; optional image URLs still supported. Promo images use a separate public bucket.

**Admin URL:** `/admin` — e.g. [http://localhost:3000/admin](http://localhost:3000/admin) locally, or `https://your-domain.com/admin` in production (you must be logged in as a user whose `profiles.role` is `admin`).

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/001_tables.sql`
   - `supabase/migrations/002_trigger_new_user.sql`
   - `supabase/migrations/003_rls.sql`
   - `supabase/migrations/004_seed_cities.sql` (Harare only)
   - `supabase/migrations/005_fix_rls_recursion.sql`
   - `supabase/migrations/006_harare_only_cities.sql` (removes other cities if you ran an older `004` that listed many cities)
   - `supabase/migrations/007_rename_amount_columns_usd.sql` (renames `*_zwl` → `*_usd` on existing DBs only)
   - `supabase/migrations/008_storage_and_site_promo.sql` (**Storage** buckets `car-images` + `promo-banners`, RLS, and **`site_promo`** table for the home banner)

   **Or one file:** paste [`supabase/manual/COMPLETE_SETUP.sql`](supabase/manual/COMPLETE_SETUP.sql) (same migrations in order, plus Harare fleet + default admin UUID — create that user in Authentication first, or edit/skip the tenant block per the file header).

3. Copy the project URL, **anon** key, and **service_role** key from Settings → API.

### 2. App

```bash
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# For bootstrap script, also add SUPABASE_SERVICE_ROLE_KEY (keep secret; never use in client code)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Existing Supabase project (e.g. already has many cities / old column names):** run the combined script in the SQL Editor: [`supabase/manual/apply_harare_and_usd_columns.sql`](supabase/manual/apply_harare_and_usd_columns.sql), then deploy this app version so it matches `daily_rate_usd` / `total_amount_usd`.

### 3. Admin user + fleet (recommended)

One step: creates (or reuses) a user, sets `admin`, inserts the five Harare listings with daily rates **$35 / $45 / $50 / $55 / $110** and **365 days** of open availability:

```bash
npm run bootstrap -- you@example.com YourSecurePassword
```

Or:

```bash
node scripts/bootstrap-admin-and-fleet.mjs you@example.com YourSecurePassword
```

Then open **[/admin](http://localhost:3000/admin)** and log in with that email and password.

### 4. Manual alternative

1. Sign up a user in the app.
2. In Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = 'YOUR_USER_UUID';
   ```
3. Seed cars (needs **service role** key in `.env.local` or as second argument):
   ```bash
   node scripts/seed-cars.mjs YOUR_OWNER_USER_UUID
   ```
   Or: `node scripts/seed-cars.mjs <URL> <SERVICE_ROLE_KEY> <OWNER_USER_UUID>`

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase: Auth, PostgreSQL, Row Level Security

## Project structure

- `src/app/(public)/` – Home, listings, car detail
- `src/app/(auth)/` – Login, signup
- `src/app/(dashboard)/` – User dashboard, my listings, bookings, support
- `src/app/(admin)/` – Admin: cars, users, support
- `supabase/migrations/` – Schema, RLS, trigger, cities
