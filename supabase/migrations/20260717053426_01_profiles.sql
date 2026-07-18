-- Private schema for internal-only helper functions (never exposed via PostgREST)
create schema if not exists private;

-- ============================================================
-- profiles: one row per auth.users row
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email text not null,                              -- synced from auth.users by trigger, never independently editable
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  account_code text unique,                         -- null for admins; format DLT####-A
  wallet_balance numeric(12,2) not null default 0,  -- CACHE only — transactions is the ledger
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);

comment on table public.profiles is 'One row per auth.users row. wallet_balance is a cache kept in sync by ledger functions — transactions is the source of truth.';

-- ============================================================
-- generic updated_at trigger
-- ============================================================
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ============================================================
-- is_admin(): the single admin-check used by every policy.
-- private schema (not callable via PostgREST), security definer + stable +
-- empty search_path (avoids the search-path privilege-escalation vector),
-- always called wrapped as (select private.is_admin()) from policies so
-- Postgres caches the result once per statement instead of once per row.
-- ============================================================
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function private.is_admin() to authenticated;

-- ============================================================
-- New-user provisioning. role is HARDCODED to 'customer' here —
-- raw_user_meta_data is client-settable at signup, so trusting a role field
-- from it would be a privilege-escalation hole. Admin rows are only ever
-- created out-of-band (seed script / admin_set_role below).
-- ============================================================
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_code text;
begin
  loop
    v_account_code := 'DLT' || lpad(floor(random() * 10000)::int::text, 4, '0')
                      || '-' || chr(65 + floor(random() * 26)::int);
    exit when not exists (select 1 from public.profiles where account_code = v_account_code);
  end loop;

  insert into public.profiles (id, first_name, last_name, email, phone, role, account_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    'customer',
    v_account_code
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Keep profiles.email in sync with auth.users.email — never independently editable.
create or replace function private.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function private.sync_user_email();

-- ============================================================
-- Narrow admin RPC for role changes — the only sanctioned way to promote/
-- demote a profile, since customers can never write their own `role` column
-- (see the revoked/granted column privileges below).
-- ============================================================
create or replace function public.admin_set_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('customer','admin') then
    raise exception 'invalid role: %', new_role;
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_id;
end;
$$;

grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- ============================================================
-- RLS + column-level grants.
-- Customers can SELECT their own row (or any row if admin), and can UPDATE
-- only first_name/last_name/phone on their own row — role/account_code/
-- wallet_balance/email/is_active/deleted_at are not grantable to
-- `authenticated` at all, so even a hand-crafted request smuggling those
-- fields gets a permission-denied error before RLS is even evaluated.
-- ============================================================
alter table public.profiles enable row level security;

revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
;