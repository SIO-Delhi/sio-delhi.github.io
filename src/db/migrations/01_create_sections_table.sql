-- Create Sections Table
create table if not exists public.sections (
  id text primary key, -- e.g. 'about', 'initiatives', 'generic-123'
  title text not null, -- e.g. 'Our Initiatives'
  label text not null, -- e.g. 'INITIATIVES' (for navbar)
  type text default 'generic', -- 'custom' or 'generic'. If 'custom', frontend maps to specific component.
  display_order integer default 0,
  is_published boolean default true,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.sections enable row level security;

-- Policies
create policy "Public sections are viewable by everyone"
  on sections for select
  using ( is_published = true or auth.role() = 'authenticated' );

create policy "Admins can insert sections"
  on sections for insert
  with check ( auth.role() = 'authenticated' ); -- assuming only admins are authenticated

create policy "Admins can update sections"
  on sections for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete sections"
  on sections for delete
  using ( auth.role() = 'authenticated' );

-- Insert Default Sections
insert into public.sections (id, title, label, type, display_order)
values
  ('about', 'About SIO Delhi', 'ABOUT US', 'custom', 1),
  ('initiatives', 'Our Initiatives', 'INITIATIVES', 'custom', 2),
  ('media', 'Press & Media', 'MEDIA', 'custom', 3),
  ('leadership', 'Our Leadership', 'LEADERSHIP', 'custom', 4),
  ('more', 'More Resources', 'resources', 'custom', 5)
on conflict (id) do nothing;
