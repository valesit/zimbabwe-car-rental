-- Public buckets for car listing photos and home promo banner (URLs stored in DB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('car-images', 'car-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]),
  ('promo-banners', 'promo-banners', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects policies (RLS is enabled by default on storage.objects)
drop policy if exists "Public read car images" on storage.objects;
drop policy if exists "Users manage own car image folder" on storage.objects;
drop policy if exists "Admins full access car images" on storage.objects;
drop policy if exists "Public read promo banners" on storage.objects;
drop policy if exists "Admins manage promo banners" on storage.objects;

create policy "Public read car images"
  on storage.objects for select
  using (bucket_id = 'car-images');

create policy "Users manage own car image folder"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'car-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'car-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins full access car images"
  on storage.objects for all to authenticated
  using (bucket_id = 'car-images' and public.get_my_role() = 'admin')
  with check (bucket_id = 'car-images' and public.get_my_role() = 'admin');

create policy "Public read promo banners"
  on storage.objects for select
  using (bucket_id = 'promo-banners');

create policy "Admins manage promo banners"
  on storage.objects for all to authenticated
  using (bucket_id = 'promo-banners' and public.get_my_role() = 'admin')
  with check (bucket_id = 'promo-banners' and public.get_my_role() = 'admin');

-- Singleton promo row for home banner + optional CTA copy
create table if not exists public.site_promo (
  id int primary key default 1 check (id = 1),
  banner_url text,
  headline text,
  subheadline text,
  cta_label text,
  cta_href text,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_site_promo_updated_at on public.site_promo;
create trigger set_site_promo_updated_at
  before update on public.site_promo
  for each row execute function public.set_updated_at();

insert into public.site_promo (id) values (1)
on conflict (id) do nothing;

alter table public.site_promo enable row level security;

drop policy if exists "Anyone can read site promo" on public.site_promo;
drop policy if exists "Admins update site promo" on public.site_promo;
drop policy if exists "Admins insert site promo" on public.site_promo;

create policy "Anyone can read site promo"
  on public.site_promo for select using (true);

create policy "Admins update site promo"
  on public.site_promo for update using (public.get_my_role() = 'admin');

create policy "Admins insert site promo"
  on public.site_promo for insert with check (public.get_my_role() = 'admin');
