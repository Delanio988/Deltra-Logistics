-- Customer chooses "pay at branch in cash" for their own bill(s) — bills has
-- no customer-side UPDATE policy at all (direct writes are admin-only), so
-- this needs a narrow SECURITY DEFINER RPC, same pattern as the wallet
-- payment functions: ownership re-checked internally, no wallet touched.
create or replace function public.mark_bill_pending_branch(p_bill_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_bill public.bills%rowtype;
begin
  if v_customer_id is null then
    raise exception 'not authenticated';
  end if;

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

  update public.bills set status = 'pending_branch' where id = p_bill_id;
end;
$$;

create or replace function public.mark_bills_pending_branch(p_bill_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_bill record;
begin
  if v_customer_id is null then
    raise exception 'not authenticated';
  end if;

  for v_bill in select * from public.bills where id = any(p_bill_ids) order by id for update loop
    if v_bill.customer_id <> v_customer_id then
      raise exception 'bill % does not belong to you', v_bill.id;
    end if;
    if v_bill.status = 'paid' then
      raise exception 'bill % already paid', v_bill.id;
    end if;
  end loop;

  update public.bills set status = 'pending_branch' where id = any(p_bill_ids);
end;
$$;

-- Admin confirms cash collected at the branch — real money changed hands but
-- not through the wallet, so balance_after carries the wallet forward
-- unchanged (still a real ledger row, per "server-computed snapshot, every
-- row, every type"). Same fixed lock order (profile, then bill) as the
-- wallet payment functions, to avoid deadlocking against a concurrent
-- customer wallet payment on the same bill.
create or replace function public.admin_confirm_bill_payment(p_bill_id uuid)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_wallet numeric(12,2);
  v_bill public.bills%rowtype;
  v_due numeric(12,2);
  v_txn public.transactions%rowtype;
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  select customer_id into v_customer_id from public.bills where id = p_bill_id;
  if v_customer_id is null then
    raise exception 'bill % not found', p_bill_id;
  end if;

  select wallet_balance into v_wallet from public.profiles where id = v_customer_id for update;
  select * into v_bill from public.bills where id = p_bill_id for update;

  if v_bill.status = 'paid' then
    raise exception 'bill already paid';
  end if;

  v_due := v_bill.total - v_bill.amount_paid;

  update public.bills set amount_paid = total, status = 'paid', paid_at = now() where id = p_bill_id;

  insert into public.transactions (customer_id, type, amount, description, reference, balance_after, created_by)
  values (v_customer_id, 'payment', -v_due, 'Cash payment confirmed at branch', p_bill_id::text, v_wallet, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

-- Single RPC covering both admin-initiated wallet credits: a top-up (e.g.
-- cash received at branch, not tied to a specific bill) and a refund. Both
-- are positive wallet adjustments; only the type/description differ.
create or replace function public.admin_adjust_wallet(p_customer_id uuid, p_amount numeric, p_type text, p_description text)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet numeric(12,2);
  v_new_balance numeric(12,2);
  v_txn public.transactions%rowtype;
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_type not in ('topup', 'refund') then
    raise exception 'invalid adjustment type: %', p_type;
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select wallet_balance into v_wallet from public.profiles where id = p_customer_id for update;
  if not found then
    raise exception 'customer % not found', p_customer_id;
  end if;

  v_new_balance := v_wallet + p_amount;
  update public.profiles set wallet_balance = v_new_balance where id = p_customer_id;

  insert into public.transactions (customer_id, type, amount, description, balance_after, created_by)
  values (p_customer_id, p_type, p_amount, p_description, v_new_balance, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

revoke all on function public.mark_bill_pending_branch(uuid) from public, anon;
revoke all on function public.mark_bills_pending_branch(uuid[]) from public, anon;
revoke all on function public.admin_confirm_bill_payment(uuid) from public, anon;
revoke all on function public.admin_adjust_wallet(uuid, numeric, text, text) from public, anon;
grant execute on function public.mark_bill_pending_branch(uuid) to authenticated;
grant execute on function public.mark_bills_pending_branch(uuid[]) to authenticated;
grant execute on function public.admin_confirm_bill_payment(uuid) to authenticated;
grant execute on function public.admin_adjust_wallet(uuid, numeric, text, text) to authenticated;
;