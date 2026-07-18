create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null unique references public.packages(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,  -- trigger-derived from packages, never client-supplied
  merchant text,
  value numeric(10,2),
  currency text check (currency in ('USD','JMD','GBP','CAD')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  has_unreviewed_changes boolean not null default false,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.invoice_files (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  name text not null,
  size int not null,
  mime_type text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

-- Trigger-populated only — never directly insertable/updatable by any client role.
create table public.invoice_status_history (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid references public.profiles(id),
  at timestamptz not null default now()
);

create index invoices_customer_id_idx on public.invoices (customer_id);
create index invoices_status_idx on public.invoices (status);
create index invoice_files_invoice_id_idx on public.invoice_files (invoice_id);
create index invoice_status_history_invoice_id_idx on public.invoice_status_history (invoice_id, at);

-- Derive customer_id from the referenced package server-side — never trust a
-- client-supplied value, so invoices.customer_id can't drift from packages.customer_id.
create or replace function private.invoices_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.customer_id := (select customer_id from public.packages where id = new.package_id);
  if new.customer_id is null then
    raise exception 'package % not found', new.package_id;
  end if;
  return new;
end;
$$;

create trigger invoices_before_insert
  before insert on public.invoices
  for each row execute function private.invoices_before_insert();

-- package_id/customer_id are immutable post-creation. Review fields
-- (status/rejection_reason/reviewed_by/reviewed_at) are admin-only — enforced
-- here via an explicit old-vs-new comparison, since RLS policy syntax alone
-- can't express "these specific columns only change for admins" on a table
-- where customer and admin share the same Postgres `authenticated` role.
create or replace function private.invoices_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.customer_id := old.customer_id;
  new.package_id := old.package_id;

  if not (select private.is_admin()) then
    if new.status is distinct from old.status
       or new.rejection_reason is distinct from old.rejection_reason
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'only an admin can change invoice review fields';
    end if;
  end if;

  if new.status in ('approved','rejected') and old.status = 'pending' then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger invoices_before_update
  before update on public.invoices
  for each row execute function private.invoices_before_update();

-- Status history — runs as the function owner (security definer), so it
-- writes even though `authenticated` is never granted insert on this table.
create or replace function private.log_invoice_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.invoice_status_history (invoice_id, status, actor_id)
    values (new.id, new.status, auth.uid());
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.invoice_status_history (invoice_id, status, note, actor_id)
    values (new.id, new.status, new.rejection_reason, auth.uid());
  end if;
  return new;
end;
$$;

create trigger invoices_log_status_insert
  after insert on public.invoices
  for each row execute function private.log_invoice_status_change();

create trigger invoices_log_status_update
  after update on public.invoices
  for each row execute function private.log_invoice_status_change();

-- ============================================================
-- RLS
-- ============================================================
alter table public.invoices enable row level security;
alter table public.invoice_files enable row level security;
alter table public.invoice_status_history enable row level security;

grant select, insert, update on public.invoices to authenticated;
grant select, insert, delete on public.invoice_files to authenticated;
grant select on public.invoice_status_history to authenticated;   -- write path is trigger-only

create policy "invoices_select_own_or_admin" on public.invoices
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "invoices_insert_own_or_admin" on public.invoices
  for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (select 1 from public.packages p where p.id = package_id and p.customer_id = (select auth.uid()))
  );

create policy "invoices_update_own_or_admin" on public.invoices
  for update to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()))
  with check (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy "invoice_files_select_own_or_admin" on public.invoice_files
  for select to authenticated
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and (i.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "invoice_files_insert_own_or_admin" on public.invoice_files
  for insert to authenticated
  with check (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and (i.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "invoice_files_delete_own_or_admin" on public.invoice_files
  for delete to authenticated
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and (i.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "invoice_status_history_select_own_or_admin" on public.invoice_status_history
  for select to authenticated
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and (i.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));
;