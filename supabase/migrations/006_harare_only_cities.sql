-- Single market: Harare only (add more cities with insert later)
delete from public.cities where name <> 'Harare';
insert into public.cities (name) values ('Harare') on conflict (name) do nothing;
