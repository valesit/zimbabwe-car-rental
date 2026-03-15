-- Seed Zimbabwe cities for filters and dropdowns
insert into public.cities (name) values
  ('Harare'),
  ('Bulawayo'),
  ('Mutare'),
  ('Gweru'),
  ('Kwekwe'),
  ('Kadoma'),
  ('Masvingo'),
  ('Chinhoyi'),
  ('Marondera'),
  ('Norton'),
  ('Chegutu'),
  ('Zvishavane'),
  ('Bindura'),
  ('Beitbridge'),
  ('Redcliffe'),
  ('Victoria Falls'),
  ('Rusape'),
  ('Chiredzi'),
  ('Kariba'),
  ('Karoi')
on conflict (name) do nothing;
