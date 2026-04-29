-- Enable RLS on public reference tables that already have SELECT policies.
-- This resolves Supabase linter findings without changing the existing policy intent.

alter table public.articles enable row level security;
alter table public.brands enable row level security;
alter table public.content_sources enable row level security;
