-- Per-car refundable security deposit (USD) and booking checkout extras

alter table public.cars
  add column if not exists refundable_deposit_usd decimal(12, 2) not null default 0
    check (refundable_deposit_usd >= 0);

alter table public.bookings
  add column if not exists include_pickup_dropoff boolean not null default false,
  add column if not exists pickup_dropoff_fee_usd decimal(12, 2) not null default 0
    check (pickup_dropoff_fee_usd >= 0),
  add column if not exists refundable_deposit_charged_usd decimal(12, 2) not null default 0
    check (refundable_deposit_charged_usd >= 0);
