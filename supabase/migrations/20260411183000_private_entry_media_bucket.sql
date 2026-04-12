-- Batch 3B: private entry media storage
-- Creates a dedicated private bucket for journal entry media.

insert into storage.buckets (id, name, public)
select 'entry-media-private', 'entry-media-private', false
where not exists (
  select 1 from storage.buckets where id = 'entry-media-private'
);

update storage.buckets
set public = false
where id = 'entry-media-private';

drop policy if exists "entry_media_private_select_own" on storage.objects;
create policy "entry_media_private_select_own"
  on storage.objects for select
  using (
    bucket_id = 'entry-media-private'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry_media_private_insert_own" on storage.objects;
create policy "entry_media_private_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'entry-media-private'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry_media_private_update_own" on storage.objects;
create policy "entry_media_private_update_own"
  on storage.objects for update
  using (
    bucket_id = 'entry-media-private'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'entry-media-private'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry_media_private_delete_own" on storage.objects;
create policy "entry_media_private_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'entry-media-private'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
