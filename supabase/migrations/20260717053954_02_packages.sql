create table public.packages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  tracking_number text not null unique,
  merchant text not null,
  description text not null,
  weight_lb numeric(6,2) not null check (weight_lb > 0),
  date_received date not null,
  status text not null default 'Received at Warehouse'
    check (status in ('Pre-Alerted','Received at Warehouse','In Transit',
                       'Arrived at Local Branch','Ready for Pickup','Delivered')),
  invoice_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index packages_customer_id_idx on public.packages (customer_id);
create index packages_status_idx on public.packages (status);

create trigger set_packages_updated_at
  before update on public.packages
  for each row execute function private.set_updated_at();

alter table public.packages enable row level security;

grant select, insert, update, delete on public.packages to authenticated;

-- Customers view only their own shipments; admins (warehouse staff) view all.
create policy "packages_select_own_or_admin" on public.packages
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

-- Packages are created/updated/removed only by warehouse staff — a customer
-- never directly writes their own package row (pre-alerts are the
-- customer-initiated path, and admins match those to a package manually).
create policy "packages_admin_write" on public.packages
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
;