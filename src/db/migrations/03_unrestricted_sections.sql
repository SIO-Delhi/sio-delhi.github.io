-- UNRESTRICTED DEVELOPMENT SCRIPT
-- WARNING: This disables auth checks for sections. Only use for development/initial setup!

-- 1. Create Table (safe check)
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

-- 2. Drop existing policies
drop policy if exists "Public sections are viewable by everyone" on sections;
drop policy if exists "Admins can insert sections" on sections;
drop policy if exists "Admins can update sections" on sections;
drop policy if exists "Admins can delete sections" on sections;

alter table public.sections enable row level security;

-- 3. Create UNRESTRICTED Policies (for development)
create policy "Public sections are viewable by everyone" on sections for select using ( true );
create policy "Everyone can insert sections (DEV)" on sections for insert with check ( true );
create policy "Everyone can update sections (DEV)" on sections for update using ( true );
create policy "Everyone can delete sections (DEV)" on sections for delete using ( true );

-- 4. Insert Default Data
insert into public.sections (id, title, label, type, display_order, is_published)
values
  ('about', 'About SIO Delhi', 'ABOUT US', 'custom', 1, true),
  ('initiatives', 'Our Initiatives', 'INITIATIVES', 'custom', 2, true),
  ('media', 'Press & Media', 'MEDIA', 'custom', 3, true),
  ('leadership', 'Our Leadership', 'LEADERSHIP', 'custom', 4, true),
  ('more', 'More Resources', 'resources', 'custom', 5, true)
on conflict (id) do update 
set display_order = excluded.display_order;
