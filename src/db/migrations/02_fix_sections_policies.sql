-- COMPLETE REPAIR SCRIPT
-- Run this in Supabase SQL Editor to fully fix the Sections table

-- 1. Create Table (if it was deleted or never created)
create table if not exists public.sections (
  id text primary key,
  title text not null,
  label text not null,
  type text default 'generic',
  display_order integer default 0,
  is_published boolean default true,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Drop existing policies to clear "already exists" errors
drop policy if exists "Public sections are viewable by everyone" on sections;
drop policy if exists "Admins can insert sections" on sections;
drop policy if exists "Admins can update sections" on sections;
drop policy if exists "Admins can delete sections" on sections;

-- 3. Ensure RLS is enabled
alter table public.sections enable row level security;

-- 4. Re-create Policies
create policy "Public sections are viewable by everyone"
  on sections for select
  using ( true );

create policy "Admins can insert sections"
  on sections for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update sections"
  on sections for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete sections"
  on sections for delete
  using ( auth.role() = 'authenticated' );

-- 5. Force Insert Default Data (Upsert)
insert into public.sections (id, title, label, type, display_order, is_published)
values
  ('about', 'About SIO Delhi', 'ABOUT US', 'custom', 1, true),
  ('initiatives', 'Our Initiatives', 'INITIATIVES', 'custom', 2, true),
  ('media', 'Press & Media', 'MEDIA', 'custom', 3, true),
  ('leadership', 'Our Leadership', 'LEADERSHIP', 'custom', 4, true),
  ('more', 'More Resources', 'resources', 'custom', 5, true)
on conflict (id) do update 
set 
  display_order = excluded.display_order,
  title = excluded.title,
  type = excluded.type;
