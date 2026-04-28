-- Secure user AI credential storage
-- Moves user API keys out of public.user_profiles into a dedicated Vault-backed table,
-- locks decrypt access to service_role only, and removes the insecure base64 fallback.

create table if not exists public.user_ai_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  openai_secret_id uuid references vault.secrets (id) on delete set null,
  claude_secret_id uuid references vault.secrets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_ai_credentials enable row level security;

revoke all on public.user_ai_credentials from public, anon, authenticated;
grant all on public.user_ai_credentials to service_role;

create or replace function public.touch_user_ai_credentials_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists trg_user_ai_credentials_updated_at on public.user_ai_credentials;
create trigger trg_user_ai_credentials_updated_at
before update on public.user_ai_credentials
for each row
execute function public.touch_user_ai_credentials_updated_at();

create or replace function public.ensure_user_ai_credentials_row()
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_ai_credentials (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;
end;
$function$;

create or replace function public.migrate_legacy_ai_credentials()
returns void
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  profile_row record;
  legacy_openai text;
  legacy_claude text;
begin
  for profile_row in
    select
      user_id,
      openai_api_key_encrypted,
      claude_api_key_encrypted
    from public.user_profiles
    where coalesce(openai_api_key_encrypted, '') <> ''
       or coalesce(claude_api_key_encrypted, '') <> ''
  loop
    insert into public.user_ai_credentials (user_id)
    values (profile_row.user_id)
    on conflict (user_id) do nothing;

    if coalesce(profile_row.openai_api_key_encrypted, '') <> '' then
      legacy_openai := convert_from(decode(profile_row.openai_api_key_encrypted, 'base64'), 'utf8');

      update public.user_ai_credentials
      set openai_secret_id = vault.create_secret(
        legacy_openai,
        format('user-openai-key-%s', profile_row.user_id),
        format('OpenAI API key for user %s', profile_row.user_id)
      )
      where user_id = profile_row.user_id
        and openai_secret_id is null;
    end if;

    if coalesce(profile_row.claude_api_key_encrypted, '') <> '' then
      legacy_claude := convert_from(decode(profile_row.claude_api_key_encrypted, 'base64'), 'utf8');

      update public.user_ai_credentials
      set claude_secret_id = vault.create_secret(
        legacy_claude,
        format('user-claude-key-%s', profile_row.user_id),
        format('Claude API key for user %s', profile_row.user_id)
      )
      where user_id = profile_row.user_id
        and claude_secret_id is null;
    end if;
  end loop;

  update public.user_profiles
  set
    openai_api_key_encrypted = null,
    claude_api_key_encrypted = null,
    updated_at = now()
  where coalesce(openai_api_key_encrypted, '') <> ''
     or coalesce(claude_api_key_encrypted, '') <> '';
end;
$function$;

create or replace function public.has_openai_key()
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.user_ai_credentials
    where user_id = auth.uid()
      and openai_secret_id is not null
  );
end;
$function$;

create or replace function public.save_openai_key(api_key text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  existing_secret_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if api_key is null or btrim(api_key) = '' then
    raise exception 'API key is required';
  end if;

  perform public.ensure_user_ai_credentials_row();

  select openai_secret_id into existing_secret_id
  from public.user_ai_credentials
  where user_id = auth.uid();

  if existing_secret_id is null then
    update public.user_ai_credentials
    set openai_secret_id = vault.create_secret(
      api_key,
      format('user-openai-key-%s', auth.uid()),
      format('OpenAI API key for user %s', auth.uid())
    )
    where user_id = auth.uid();
  else
    perform vault.update_secret(
      existing_secret_id,
      api_key,
      format('user-openai-key-%s', auth.uid()),
      format('OpenAI API key for user %s', auth.uid())
    );
  end if;

  return true;
exception
  when others then
    raise warning 'Error saving OpenAI API key: %', sqlerrm;
    return false;
end;
$function$;

create or replace function public.delete_openai_key()
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  existing_secret_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select openai_secret_id into existing_secret_id
  from public.user_ai_credentials
  where user_id = auth.uid();

  if existing_secret_id is null then
    return false;
  end if;

  delete from vault.secrets where id = existing_secret_id;

  update public.user_ai_credentials
  set openai_secret_id = null
  where user_id = auth.uid();

  return true;
end;
$function$;

create or replace function public.has_claude_key()
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.user_ai_credentials
    where user_id = auth.uid()
      and claude_secret_id is not null
  );
end;
$function$;

create or replace function public.save_claude_key(api_key text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  existing_secret_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if api_key is null or btrim(api_key) = '' then
    raise exception 'API key is required';
  end if;

  perform public.ensure_user_ai_credentials_row();

  select claude_secret_id into existing_secret_id
  from public.user_ai_credentials
  where user_id = auth.uid();

  if existing_secret_id is null then
    update public.user_ai_credentials
    set claude_secret_id = vault.create_secret(
      api_key,
      format('user-claude-key-%s', auth.uid()),
      format('Claude API key for user %s', auth.uid())
    )
    where user_id = auth.uid();
  else
    perform vault.update_secret(
      existing_secret_id,
      api_key,
      format('user-claude-key-%s', auth.uid()),
      format('Claude API key for user %s', auth.uid())
    );
  end if;

  return true;
exception
  when others then
    raise warning 'Error saving Claude API key: %', sqlerrm;
    return false;
end;
$function$;

create or replace function public.delete_claude_key()
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  existing_secret_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select claude_secret_id into existing_secret_id
  from public.user_ai_credentials
  where user_id = auth.uid();

  if existing_secret_id is null then
    return false;
  end if;

  delete from vault.secrets where id = existing_secret_id;

  update public.user_ai_credentials
  set claude_secret_id = null
  where user_id = auth.uid();

  return true;
end;
$function$;

create or replace function public.decrypt_api_key(user_id_param uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  existing_secret_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'decrypt_api_key is restricted to service_role';
  end if;

  select openai_secret_id into existing_secret_id
  from public.user_ai_credentials
  where user_id = user_id_param;

  if existing_secret_id is null then
    return null;
  end if;

  return (
    select decrypted_secret
    from vault.decrypted_secrets
    where id = existing_secret_id
  );
end;
$function$;

create or replace function public.decrypt_claude_api_key(user_id_param uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $function$
declare
  existing_secret_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'decrypt_claude_api_key is restricted to service_role';
  end if;

  select claude_secret_id into existing_secret_id
  from public.user_ai_credentials
  where user_id = user_id_param;

  if existing_secret_id is null then
    return null;
  end if;

  return (
    select decrypted_secret
    from vault.decrypted_secrets
    where id = existing_secret_id
  );
end;
$function$;

revoke all on function public.decrypt_api_key(uuid) from public, anon, authenticated;
revoke all on function public.decrypt_claude_api_key(uuid) from public, anon, authenticated;
grant execute on function public.decrypt_api_key(uuid) to service_role;
grant execute on function public.decrypt_claude_api_key(uuid) to service_role;

revoke all on function public.save_openai_key(text) from public, anon;
revoke all on function public.delete_openai_key() from public, anon;
revoke all on function public.has_openai_key() from public, anon;
revoke all on function public.save_claude_key(text) from public, anon;
revoke all on function public.delete_claude_key() from public, anon;
revoke all on function public.has_claude_key() from public, anon;
revoke all on function public.get_ai_preferences() from public, anon;
revoke all on function public.set_ai_preferences(text, text) from public, anon;

grant execute on function public.save_openai_key(text) to authenticated, service_role;
grant execute on function public.delete_openai_key() to authenticated, service_role;
grant execute on function public.has_openai_key() to authenticated, service_role;
grant execute on function public.save_claude_key(text) to authenticated, service_role;
grant execute on function public.delete_claude_key() to authenticated, service_role;
grant execute on function public.has_claude_key() to authenticated, service_role;
grant execute on function public.get_ai_preferences() to authenticated, service_role;
grant execute on function public.set_ai_preferences(text, text) to authenticated, service_role;

select public.migrate_legacy_ai_credentials();
