alter table public.pre_alerts
  add column declared_value numeric(10,2),
  add column currency text check (currency in ('USD','JMD','GBP','CAD')),
  add constraint pre_alerts_matched_package_id_unique unique (matched_package_id);

create table public.pre_alert_files (
  id uuid primary key default gen_random_uuid(),
  pre_alert_id uuid not null references public.pre_alerts(id) on delete cascade,
  name text not null,
  size int not null,
  mime_type text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index pre_alert_files_pre_alert_id_idx on public.pre_alert_files (pre_alert_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.pre_alert_files enable row level security;

grant select, insert, delete on public.pre_alert_files to authenticated;

create policy "pre_alert_files_select_own_or_admin" on public.pre_alert_files
  for select to authenticated
  using (exists (
    select 1 from public.pre_alerts p
    where p.id = pre_alert_id and (p.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "pre_alert_files_insert_own_or_admin" on public.pre_alert_files
  for insert to authenticated
  with check (exists (
    select 1 from public.pre_alerts p
    where p.id = pre_alert_id and (p.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "pre_alert_files_delete_own_or_admin" on public.pre_alert_files
  for delete to authenticated
  using (exists (
    select 1 from public.pre_alerts p
    where p.id = pre_alert_id and (p.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

-- Customers may edit their own pre-alert only while it's still pending; the
-- with check clause still requires status = 'pending' post-update, so a
-- customer can't flip status/matched_package_id themselves through this policy.
create policy "pre_alerts_update_own_while_pending" on public.pre_alerts
  for update to authenticated
  using (customer_id = (select auth.uid()) and status = 'pending')
  with check (customer_id = (select auth.uid()) and status = 'pending');
;
