-- PayPal payment metadata on bookings (pay-first flow)

alter table public.bookings
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists payment_currency text default 'USD',
  add column if not exists payment_status text;

-- Paid via PayPal capture; refunded when applicable. Legacy rows keep payment_status null.
alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status is null or payment_status in ('paid', 'refunded', 'pending'));

create unique index if not exists idx_bookings_paypal_order_id_unique
  on public.bookings (paypal_order_id)
  where paypal_order_id is not null;
