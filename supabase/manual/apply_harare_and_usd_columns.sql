-- Run once in Supabase Dashboard → SQL Editor (uses postgres privileges; not possible with the anon key).
-- Safe to re-run: city cleanup + column renames are idempotent.

-- Harare only
delete from public.cities where name <> 'Harare';
insert into public.cities (name) values ('Harare') on conflict (name) do nothing;

-- USD column names (if your project was created with daily_rate_zwl / total_amount_zwl)
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
