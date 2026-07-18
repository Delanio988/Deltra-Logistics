create table public.messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.authorised_users (
  id uuid primary key default gen_random_uuid(),
  owner_customer_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  email text not null,
  status text not null default 'invited' check (status in ('invited','active')),
  created_at timestamptz not null default now()
);

create table public.pre_alerts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  tracking_number text not null,
  merchant text not null,
  description text,
  expected_weight_lb numeric(6,2),
  status text not null default 'pending' check (status in ('pending','matched','expired')),
  matched_package_id uuid references public.packages(id),
  created_at timestamptz not null default now()
);

-- Singleton row — active seasonal theme + scope, admin-controlled.
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  scope text not null default 'both' check (scope in ('portal','public','both')),
  auto_schedule_enabled boolean not null default false,
  selected_theme_id text not null default 'none'
);
insert into public.site_settings (id) values (1);

create index messages_customer_id_idx on public.messages (customer_id, created_at);
create index messages_unread_idx on public.messages (customer_id) where not read;
create index authorised_users_owner_idx on public.authorised_users (owner_customer_id);
create index pre_alerts_customer_id_idx on public.pre_alerts (customer_id);
create index pre_alerts_matched_package_idx on public.pre_alerts (matched_package_id);

-- Customers may only toggle `read` on their own messages — title/body/
-- customer_id are admin-authoring fields, pinned back to their old values
-- for non-admin callers (same shared-`authenticated`-role problem as
-- invoices' review fields, same fix: an explicit trigger guard).
create or replace function private.messages_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    new.title := old.title;
    new.body := old.body;
    new.customer_id := old.customer_id;
  end if;
  return new;
end;
$$;

create trigger messages_before_update
  before update on public.messages
  for each row execute function private.messages_before_update();

-- ============================================================
-- RLS
-- ============================================================
alter table public.messages enable row level security;
alter table public.authorised_users enable row level security;
alter table public.pre_alerts enable row level security;
alter table public.site_settings enable row level security;

grant select, update on public.messages to authenticated;
grant insert on public.messages to authenticated;    -- restricted to admin via RLS below
grant select, insert, update, delete on public.authorised_users to authenticated;
grant select, insert, delete on public.pre_alerts to authenticated;
grant update on public.pre_alerts to authenticated;  -- restricted to admin via RLS below
grant select on public.site_settings to authenticated, anon;
grant update on public.site_settings to authenticated;  -- restricted to admin via RLS below

create policy "messages_select_own_or_admin" on public.messages
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "messages_insert_admin" on public.messages
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "messages_update_own_or_admin" on public.messages
  for update to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()))
  with check (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "authorised_users_select_own_or_admin" on public.authorised_users
  for select to authenticated
  using (owner_customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "authorised_users_write_own_or_admin" on public.authorised_users
  for all to authenticated
  using (owner_customer_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "pre_alerts_select_own_or_admin" on public.pre_alerts
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "pre_alerts_insert_own" on public.pre_alerts
  for insert to authenticated
  with check (customer_id = (select auth.uid()));

create policy "pre_alerts_delete_own_or_admin" on public.pre_alerts
  for delete to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

-- Matching a pre-alert to an arrived package (status/matched_package_id) is admin-only.
create policy "pre_alerts_update_admin" on public.pre_alerts
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Readable by everyone, including signed-out visitors — the seasonal theme
-- can target the public marketing site, which has no auth.uid() at all.
create policy "site_settings_select_all" on public.site_settings
  for select to authenticated, anon
  using (true);

create policy "site_settings_update_admin" on public.site_settings
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
;