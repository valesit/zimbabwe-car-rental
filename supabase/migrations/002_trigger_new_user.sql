-- Create profile when a new user signs up (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'user',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
