alter table public.post_performance
  add column if not exists audience_demographics jsonb,
  add column if not exists top_job_title text,
  add column if not exists top_location text,
  add column if not exists top_industry text,
  add column if not exists premium_custom_button_interactions integer,
  add column if not exists followers_gained_from_post integer,
  add column if not exists sends_on_linkedin integer,
  add column if not exists published_date_from_analytics timestamptz;
