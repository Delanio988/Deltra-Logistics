create table public.bills (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  package_id uuid not null unique references public.packages(id) on delete restrict,
  total numeric(12,2) not null default 0 check (total >= 0),      -- trigger-recomputed from line_items
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  status text not null default 'unpaid' check (status in ('unpaid','partially_paid','paid','pending_branch')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.line_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  label text not null,
  amount numeric(10,2) not null check (amount > 0),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- The ledger. Insert ONLY via SECURITY DEFINER wallet functions below —
-- `authenticated` never gets an insert grant on this table at all.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  type text not null check (type in ('payment','topup','refund','charge')),
  amount numeric(12,2) not null,
  description text not null,
  reference text,
  balance_after numeric(12,2) not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index bills_customer_id_idx on public.bills (customer_id);
create index line_items_bill_id_idx on public.line_items (bill_id);
create index transactions_customer_id_idx on public.transactions (customer_id, created_at);

-- bills.total is a pure function of its line_items — recomputed, never client-set.
create or replace function private.recompute_bill_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill_id uuid := coalesce(new.bill_id, old.bill_id);
begin
  update public.bills
    set total = (select coalesce(sum(amount), 0) from public.line_items where bill_id = v_bill_id)
  where id = v_bill_id;
  return coalesce(new, old);
end;
$$;

create trigger line_items_recompute_total
  after insert or update or delete on public.line_items
  for each row execute function private.recompute_bill_total();

-- ============================================================
-- Wallet payment functions.
-- Fixed lock order everywhere (profile row, THEN bill row(s) in `order by
-- id`) prevents deadlocks between concurrent calls, and re-checking bill
-- status after the lock closes the double-spend window a double-click or a
-- simultaneous admin cash-confirmation could otherwise open.
-- ============================================================

-- Single bill, partial payment allowed (pays whatever the wallet can cover).
create or replace function public.pay_bill_from_wallet(p_bill_id uuid)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_wallet numeric(12,2);
  v_bill public.bills%rowtype;
  v_pay numeric(12,2);
  v_new_balance numeric(12,2);
  v_txn public.transactions%rowtype;
begin
  if v_customer_id is null then
    raise exception 'not authenticated';
  end if;

  select wallet_balance into v_wallet from public.profiles where id = v_customer_id for update;

  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then
    raise exception 'bill % not found', p_bill_id;
  end if;
  if v_bill.customer_id <> v_customer_id then
    raise exception 'not your bill';
  end if;
  if v_bill.status = 'paid' then
    raise exception 'bill already paid';
  end if;

  v_pay := least(v_wallet, v_bill.total - v_bill.amount_paid);
  if v_pay <= 0 then
    raise exception 'insufficient wallet balance';
  end if;

  v_new_balance := v_wallet - v_pay;
  update public.profiles set wallet_balance = v_new_balance where id = v_customer_id;

  update public.bills
    set amount_paid = amount_paid + v_pay,
        status = case when amount_paid + v_pay >= total then 'paid' else 'partially_paid' end,
        paid_at = case when amount_paid + v_pay >= total then now() else paid_at end
    where id = p_bill_id;

  insert into public.transactions (customer_id, type, amount, description, reference, balance_after, created_by)
  values (v_customer_id, 'payment', -v_pay, 'Wallet payment', p_bill_id::text, v_new_balance, null)
  returning * into v_txn;

  return v_txn;
end;
$$;

-- Batch: all-or-nothing full payment of every selected bill.
create or replace function public.pay_bills_from_wallet(p_bill_ids uuid[])
returns setof public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_wallet numeric(12,2);
  v_total_due numeric(12,2) := 0;
  v_bill record;
  v_new_balance numeric(12,2);
  v_dues jsonb := '[]'::jsonb;
begin
  if v_customer_id is null then
    raise exception 'not authenticated';
  end if;

  select wallet_balance into v_wallet from public.profiles where id = v_customer_id for update;

  for v_bill in
    select * from public.bills where id = any(p_bill_ids) order by id for update
  loop
    if v_bill.customer_id <> v_customer_id then
      raise exception 'bill % does not belong to you', v_bill.id;
    end if;
    if v_bill.status = 'paid' then
      raise exception 'bill % already paid', v_bill.id;
    end if;
    v_total_due := v_total_due + (v_bill.total - v_bill.amount_paid);
    v_dues := v_dues || jsonb_build_object('id', v_bill.id, 'due', v_bill.total - v_bill.amount_paid);
  end loop;

  if v_total_due <= 0 then
    raise exception 'nothing due on the selected bills';
  end if;
  if v_wallet < v_total_due then
    raise exception 'insufficient wallet balance for full payment of selected bills';
  end if;

  v_new_balance := v_wallet - v_total_due;
  update public.profiles set wallet_balance = v_new_balance where id = v_customer_id;

  update public.bills set amount_paid = total, status = 'paid', paid_at = now()
  where id = any(p_bill_ids);

  return query
    insert into public.transactions (customer_id, type, amount, description, reference, balance_after, created_by)
    select v_customer_id, 'payment', -(d->>'due')::numeric(12,2), 'Wallet payment (batch)', (d->>'id'), v_new_balance, null
    from jsonb_array_elements(v_dues) d
    returning *;
end;
$$;

revoke all on function public.pay_bill_from_wallet(uuid) from public, anon;
revoke all on function public.pay_bills_from_wallet(uuid[]) from public, anon;
grant execute on function public.pay_bill_from_wallet(uuid) to authenticated;
grant execute on function public.pay_bills_from_wallet(uuid[]) to authenticated;

-- ============================================================
-- RLS
-- ============================================================
alter table public.bills enable row level security;
alter table public.line_items enable row level security;
alter table public.transactions enable row level security;

grant select, insert, update on public.bills to authenticated;
grant select, insert, update, delete on public.line_items to authenticated;
grant select on public.transactions to authenticated;   -- write path is the wallet functions only

create policy "bills_select_own_or_admin" on public.bills
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

-- Direct bill writes are admin-only — customer-side payment happens only
-- through the SECURITY DEFINER wallet functions above, which bypass RLS.
create policy "bills_admin_insert" on public.bills
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "bills_admin_update" on public.bills
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "line_items_select_own_or_admin" on public.line_items
  for select to authenticated
  using (exists (
    select 1 from public.bills b
    where b.id = bill_id and (b.customer_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "line_items_admin_write" on public.line_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "transactions_select_own_or_admin" on public.transactions
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));
;