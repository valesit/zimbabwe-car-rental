-- Harare only for now; add more cities later via insert or a new migration
insert into public.cities (name) values ('Harare') on conflict (name) do nothing;
