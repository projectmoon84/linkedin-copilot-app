alter table public.user_profiles
add column if not exists ai_model_preferences jsonb not null default '{}'::jsonb;

create or replace function public.get_ai_feature_preferences()
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  result jsonb;
begin
  select coalesce(ai_model_preferences, '{}'::jsonb)
  into result
  from public.user_profiles
  where user_id = auth.uid();

  return coalesce(result, '{}'::jsonb);
end;
$function$;

create or replace function public.set_ai_feature_preferences(p_preferences jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_profiles (user_id, ai_model_preferences)
  values (auth.uid(), coalesce(p_preferences, '{}'::jsonb))
  on conflict (user_id)
  do update set
    ai_model_preferences = coalesce(excluded.ai_model_preferences, '{}'::jsonb),
    updated_at = now();

  return true;
exception
  when others then
    raise warning 'Error setting AI feature preferences: %', sqlerrm;
    return false;
end;
$function$;

revoke all on function public.get_ai_feature_preferences() from public, anon;
revoke all on function public.set_ai_feature_preferences(jsonb) from public, anon;
grant execute on function public.get_ai_feature_preferences() to authenticated, service_role;
grant execute on function public.set_ai_feature_preferences(jsonb) to authenticated, service_role;
