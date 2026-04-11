-- Life Drawer recovery migration
-- Aligns the schema used by the active Expo app with the current app contract.

create extension if not exists "pgcrypto";

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    avatar_url
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.drawers
  add column if not exists color text,
  add column if not exists icon text;

alter table public.tags
  add column if not exists color text;

alter table public.entries
  add column if not exists mood text,
  add column if not exists images jsonb not null default '[]'::jsonb,
  add column if not exists audio_url text,
  add column if not exists location jsonb,
  add column if not exists occurred_at timestamptz,
  add column if not exists life_phase_id uuid references public.life_phases(id) on delete set null;

update public.drawers
set color = '#7C9E7F'
where color is null;

update public.tags
set color = '#7C9E7F'
where color is null;

insert into public.profiles (id, display_name, avatar_url)
select
  users.id,
  users.raw_user_meta_data ->> 'display_name',
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where profiles.id is null;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
select 'entry-media', 'entry-media', true
where not exists (
  select 1 from storage.buckets where id = 'entry-media'
);

drop policy if exists "entry_media_select_own_or_public" on storage.objects;
create policy "entry_media_select_own_or_public"
  on storage.objects for select
  using (bucket_id = 'entry-media');

drop policy if exists "entry_media_insert_own" on storage.objects;
create policy "entry_media_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'entry-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry_media_update_own" on storage.objects;
create policy "entry_media_update_own"
  on storage.objects for update
  using (
    bucket_id = 'entry-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'entry-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry_media_delete_own" on storage.objects;
create policy "entry_media_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'entry-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
