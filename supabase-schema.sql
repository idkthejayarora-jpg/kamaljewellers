-- ============================================================
-- KAMAL JEWELLERS — Supabase schema, security & storage
-- Run this once in your Supabase project:
--   Dashboard → SQL Editor → New query → paste all → Run.
-- Safe to re-run (uses IF NOT EXISTS / drops-then-creates policies).
-- ============================================================

-- ---------- 1. SITE CONTENT (all editable text + photo URLs) ----------
create table if not exists public.site_content (
  id          int primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- one row holds everything; seed it so the admin can update it
insert into public.site_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_content enable row level security;

drop policy if exists "site_content public read"  on public.site_content;
drop policy if exists "site_content admin write"   on public.site_content;

-- anyone (the website visitors) can READ the content
create policy "site_content public read"
  on public.site_content for select
  using (true);

-- only a logged-in admin can CHANGE it
create policy "site_content admin write"
  on public.site_content for all
  to authenticated
  using (true) with check (true);


-- ---------- 2. ENQUIRIES (messages from the contact widget) ----------
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  phone       text not null,
  email       text,
  interest    text,
  message     text not null,
  status      text not null default 'new'   -- 'new' | 'read'
);

alter table public.enquiries enable row level security;

drop policy if exists "enquiries public insert" on public.enquiries;
drop policy if exists "enquiries admin read"    on public.enquiries;
drop policy if exists "enquiries admin update"  on public.enquiries;
drop policy if exists "enquiries admin delete"  on public.enquiries;

-- anyone can SUBMIT an enquiry...
create policy "enquiries public insert"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

-- ...but only the admin can READ / manage them
create policy "enquiries admin read"
  on public.enquiries for select
  to authenticated using (true);

create policy "enquiries admin update"
  on public.enquiries for update
  to authenticated using (true) with check (true);

create policy "enquiries admin delete"
  on public.enquiries for delete
  to authenticated using (true);


-- ---------- 3. PHOTO STORAGE ----------
-- create a public bucket called "photos"
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read"  on storage.objects;
drop policy if exists "photos admin write"   on storage.objects;
drop policy if exists "photos admin update"  on storage.objects;
drop policy if exists "photos admin delete"  on storage.objects;

-- anyone can VIEW the photos (they're on a public website)
create policy "photos public read"
  on storage.objects for select
  using ( bucket_id = 'photos' );

-- only the admin can UPLOAD / replace / delete photos
create policy "photos admin write"
  on storage.objects for insert
  to authenticated with check ( bucket_id = 'photos' );

create policy "photos admin update"
  on storage.objects for update
  to authenticated using ( bucket_id = 'photos' );

create policy "photos admin delete"
  on storage.objects for delete
  to authenticated using ( bucket_id = 'photos' );

-- ============================================================
-- Done. Next: create your single admin user (SETUP.md step 5).
-- ============================================================
