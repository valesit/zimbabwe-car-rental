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
