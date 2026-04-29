-- Harden function execution and search_path handling for Supabase-exposed functions.

-- Explicit search_path for linter cleanliness and safer execution.
alter function public.generate_invite_code() set search_path = public;
alter function public.get_posting_stats(uuid) set search_path = public;
alter function public.get_my_posting_stats() set search_path = public;
alter function public.calculate_weekly_score() set search_path = public;
alter function public.get_ai_preferences() set search_path = public;
alter function public.set_ai_preferences(text, text) set search_path = public;
alter function public.touch_user_ai_credentials_updated_at() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;

-- AI preference functions can use caller RLS directly on user_profiles.
alter function public.get_ai_preferences() security invoker;
alter function public.set_ai_preferences(text, text) security invoker;
alter function public.get_ai_feature_preferences() security invoker;
alter function public.set_ai_feature_preferences(jsonb) security invoker;

-- Internal helpers and trigger functions should never be RPC-callable.
revoke all on function public._is_circle_member(uuid) from public, anon, authenticated;
revoke all on function public.ensure_user_ai_credentials_row() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.migrate_legacy_ai_credentials() from public, anon, authenticated;
revoke all on function public.generate_invite_code() from public, anon, authenticated;
revoke all on function public.touch_user_ai_credentials_updated_at() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;

-- Public/anon should not be able to execute signed-in app RPCs.
revoke all on function public.calculate_weekly_score() from public, anon;
revoke all on function public.create_circle(text) from public, anon;
revoke all on function public.get_circle_leaderboard(uuid) from public, anon;
revoke all on function public.get_my_posting_stats() from public, anon;
revoke all on function public.get_posting_stats(uuid) from public, anon, authenticated;
revoke all on function public.join_circle(text, boolean, boolean) from public, anon;
revoke all on function public.leave_circle(uuid) from public, anon;
revoke all on function public.update_circle_privacy(uuid, boolean, boolean) from public, anon;

grant execute on function public.calculate_weekly_score() to authenticated, service_role;
grant execute on function public.create_circle(text) to authenticated, service_role;
grant execute on function public.get_circle_leaderboard(uuid) to authenticated, service_role;
grant execute on function public.get_my_posting_stats() to authenticated, service_role;
grant execute on function public.join_circle(text, boolean, boolean) to authenticated, service_role;
grant execute on function public.leave_circle(uuid) to authenticated, service_role;
grant execute on function public.update_circle_privacy(uuid, boolean, boolean) to authenticated, service_role;
