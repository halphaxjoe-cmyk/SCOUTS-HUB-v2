-- SCOUT HUB V15.2: task metadata used by the UI and automatic badge display.
alter table public.tasks add column if not exists description text default '';
alter table public.tasks add column if not exists badge_icon text;
alter table public.tasks add column if not exists badge_title text;
alter table public.tasks add column if not exists completed_at timestamptz;
