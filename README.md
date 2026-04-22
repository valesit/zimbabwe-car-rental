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
   - `supabase/migrations/009_booking_payments.sql` (PayPal columns on `bookings`: `paypal_order_id`, `paypal_capture_id`, `payment_status`, etc.)
   - `supabase/migrations/010_car_deposit_booking_extras.sql` (`cars.refundable_deposit_usd`; `bookings` pickup/drop-off and deposit snapshot columns)

   **Or one file:** paste [`supabase/manual/COMPLETE_SETUP.sql`](supabase/manual/COMPLETE_SETUP.sql) (same migrations in order, plus Harare fleet + default admin UUID — create that user in Authentication first, or edit/skip the tenant block per the file header).

3. Copy the project URL, **anon** key, and **service_role** key from Settings → API.

### 2. App

```bash
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# For bootstrap script, PayPal booking capture, and Admin → Users "Create user", add SUPABASE_SERVICE_ROLE_KEY (keep secret; never use in client code)
# PayPal: NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_API_BASE (sandbox vs live). Optional: PAYPAL_WEBHOOK_ID for /api/paypal/webhook.
# Optional: NEXT_PUBLIC_APP_URL=https://your-production-domain.com (used for invite-email redirect; defaults to VERCEL_URL or localhost)

npm install
npm run dev
```

**Vercel:** add the same variables under Project → Settings → Environment Variables (Preview + Production). Set `PAYPAL_API_BASE` to `https://api-m.paypal.com` when you go live. Register the webhook URL `https://your-domain.com/api/paypal/webhook` in the PayPal Developer Dashboard and paste the webhook ID into `PAYPAL_WEBHOOK_ID`.

#### PayPal credentials handoff (do not commit secrets)

- **Local:** Fill `.env.local` from [`.env.local.example`](.env.local.example): Supabase URL/anon key, **`SUPABASE_SERVICE_ROLE_KEY`** (server-only; used after PayPal capture to insert the booking and block dates, and for **Admin → Users → Create user** at `POST /api/admin/users`), **`NEXT_PUBLIC_PAYPAL_CLIENT_ID`**, **`PAYPAL_CLIENT_SECRET`**, and **`PAYPAL_API_BASE`** (start with sandbox: `https://api-m.sandbox.paypal.com`). Set **`NEXT_PUBLIC_APP_URL`** in production so invitation emails redirect correctly; add that URL (and `/login`) under Supabase **Authentication → URL configuration** redirect allow list if invites fail.
- **Vercel:** Add the same keys for **Preview** and **Production**. Use sandbox credentials on Preview for end-to-end tests; switch Production to live PayPal keys and `PAYPAL_API_BASE=https://api-m.paypal.com` when ready.
- **Webhook:** In the PayPal Developer Dashboard, create a webhook for `PAYMENT.CAPTURE.COMPLETED` pointing at `https://<your-domain>/api/paypal/webhook`, then set **`PAYPAL_WEBHOOK_ID`**. Use [ngrok](https://ngrok.com/) or similar if you need to test webhooks against localhost.

#### PayPal and Zimbabwe (operations)

Confirm with PayPal that your business can receive **USD** and that terms apply to how you operate in Zimbabwe; checkout and settlement rules are **operational**—this app only records PayPal order/capture IDs on bookings after a successful capture.

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
