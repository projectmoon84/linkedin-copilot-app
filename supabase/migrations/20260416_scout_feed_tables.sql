-- Scout Social Pulse Feed — Phase 1 migration
-- Creates feed_sources and feed_items tables with RLS, indexes, and dedup constraints.

-- ─────────────────────────────────────────────
-- feed_sources
-- ─────────────────────────────────────────────
create table if not exists public.feed_sources (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  display_url            text not null,
  fetch_url              text not null,
  source_type            text not null check (source_type in ('reddit', 'rss')),
  title                  text not null,
  subreddit              text,
  reddit_sort            text check (reddit_sort in ('top', 'new', 'rising')),
  reddit_time_filter     text check (reddit_time_filter in ('day', 'week', 'month')),
  category               text,
  fetch_interval_minutes integer not null default 120,
  next_fetch_at          timestamptz not null default now(),
  last_fetched_at        timestamptz,
  last_error             text,
  is_active              boolean not null default true,
  created_at             timestamptz not null default now()
);

alter table public.feed_sources enable row level security;

create policy "Users manage their own feed sources"
  on public.feed_sources
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index feed_sources_user_id_idx on public.feed_sources (user_id);
create index feed_sources_next_fetch_idx on public.feed_sources (next_fetch_at) where is_active = true;

-- ─────────────────────────────────────────────
-- feed_items
-- ─────────────────────────────────────────────
create table if not exists public.feed_items (
  id                      uuid primary key default gen_random_uuid(),
  feed_source_id          uuid not null references public.feed_sources(id) on delete cascade,
  user_id                 uuid not null references auth.users(id) on delete cascade,
  external_id             text not null,
  title                   text not null,
  link                    text not null,
  description             text,
  author                  text,
  published_at            timestamptz,
  image_url               text,
  categories              text[] not null default '{}',
  reddit_score            integer,
  reddit_upvote_ratio     numeric(4, 3),
  reddit_num_comments     integer,
  reddit_awards           integer,
  engagement_score        numeric(10, 4),
  is_bookmarked           boolean not null default false,
  is_hidden               boolean not null default false,
  last_score_updated_at   timestamptz,
  created_at              timestamptz not null default now(),

  -- Deduplicate: one item per (source, external_id)
  constraint feed_items_source_external_id_key unique (feed_source_id, external_id)
);

alter table public.feed_items enable row level security;

create policy "Users manage their own feed items"
  on public.feed_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index feed_items_user_id_idx          on public.feed_items (user_id);
create index feed_items_published_at_idx     on public.feed_items (user_id, published_at desc);
create index feed_items_engagement_idx       on public.feed_items (user_id, engagement_score desc);
create index feed_items_feed_source_idx      on public.feed_items (feed_source_id);
create index feed_items_bookmarked_idx       on public.feed_items (user_id) where is_bookmarked = true;
