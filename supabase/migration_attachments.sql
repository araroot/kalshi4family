-- ============================================================
-- Migration: add attachment support to comments
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add column to comments
alter table public.comments
  add column if not exists attachment_url text;

-- 2. Create storage bucket (run once)
insert into storage.buckets (id, name, public)
values ('comment-attachments', 'comment-attachments', true)
on conflict (id) do nothing;

-- 3. Storage RLS: authenticated users can upload to their own folder
create policy "Users can upload attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'comment-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Public read for everyone
create policy "Public read attachments"
  on storage.objects for select
  to public
  using (bucket_id = 'comment-attachments');

-- 5. Users can delete their own uploads
create policy "Users can delete own attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'comment-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
