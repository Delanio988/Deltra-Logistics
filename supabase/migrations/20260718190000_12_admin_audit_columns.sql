-- Attribution columns for the admin-action audit trail, following the
-- existing created_by/actor_id convention already used by line_items,
-- transactions, and invoice_status_history. Approvals/rejections already
-- attribute to invoices.reviewed_by (trigger-set in invoices_before_update),
-- and wallet credits/refunds already attribute to transactions.created_by
-- (set inside admin_adjust_wallet) — those two need no changes here.

alter table public.packages add column created_by uuid references public.profiles(id);
alter table public.bills add column created_by uuid references public.profiles(id);
alter table public.bills add column paid_confirmed_by uuid references public.profiles(id);

create index packages_created_by_idx on public.packages (created_by);
create index bills_created_by_idx on public.bills (created_by);
create index bills_paid_confirmed_by_idx on public.bills (paid_confirmed_by);

-- Record which admin confirmed a cash-at-branch payment (adds
-- `paid_confirmed_by = auth.uid()` to the existing bill update; everything
-- else is unchanged from the 09_billing_rpcs.sql definition).
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

  update public.bills
    set amount_paid = total, status = 'paid', paid_at = now(), paid_confirmed_by = auth.uid()
    where id = p_bill_id;

  insert into public.transactions (customer_id, type, amount, description, reference, balance_after, created_by)
  values (v_customer_id, 'payment', -v_due, 'Cash payment confirmed at branch', p_bill_id::text, v_wallet, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;
