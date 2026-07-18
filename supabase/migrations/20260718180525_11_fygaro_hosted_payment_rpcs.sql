
-- Idempotency ledger for hosted-payment webhook deliveries (Fygaro can and
-- will retry webhook delivery on transient failures/timeouts). The unique
-- constraint on provider_reference is the actual concurrency lock: two
-- concurrent deliveries for the same reference serialize on this insert.
create table public.hosted_payment_events (
  provider_reference text primary key,
  transaction_id uuid references public.transactions(id),
  created_at timestamptz not null default now()
);

alter table public.hosted_payment_events enable row level security;
revoke all on public.hosted_payment_events from public, anon, authenticated;

create or replace function public.confirm_hosted_bill_payment(
  p_bill_id uuid,
  p_amount numeric,
  p_provider_reference text
) returns public.transactions
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_bill public.bills%rowtype;
  v_inserted int;
  v_existing_txn_id uuid;
  v_txn public.transactions%rowtype;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_provider_reference is null or length(p_provider_reference) = 0 then
    raise exception 'provider reference is required';
  end if;

  insert into public.hosted_payment_events (provider_reference)
  values (p_provider_reference)
  on conflict (provider_reference) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select transaction_id into v_existing_txn_id from public.hosted_payment_events where provider_reference = p_provider_reference;
    if v_existing_txn_id is null then
      raise exception 'payment % is already being processed, try again shortly', p_provider_reference;
    end if;
    select * into v_txn from public.transactions where id = v_existing_txn_id;
    return v_txn;
  end if;

  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then
    raise exception 'bill % not found', p_bill_id;
  end if;
  if v_bill.status = 'paid' then
    raise exception 'bill already paid';
  end if;

  update public.bills
    set amount_paid = amount_paid + p_amount,
        status = case when amount_paid + p_amount >= total then 'paid' else 'partially_paid' end,
        paid_at = case when amount_paid + p_amount >= total then now() else paid_at end
    where id = p_bill_id;

  insert into public.transactions (customer_id, type, amount, description, reference, balance_after, created_by)
  values (
    v_bill.customer_id, 'payment', -p_amount, 'Card/bank payment via Fygaro', p_provider_reference,
    (select wallet_balance from public.profiles where id = v_bill.customer_id), null
  )
  returning * into v_txn;

  update public.hosted_payment_events set transaction_id = v_txn.id where provider_reference = p_provider_reference;

  return v_txn;
end;
$function$;

revoke all on function public.confirm_hosted_bill_payment(uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.confirm_hosted_bill_payment(uuid, numeric, text) to service_role;

create or replace function public.confirm_hosted_wallet_topup(
  p_customer_id uuid,
  p_amount numeric,
  p_provider_reference text
) returns public.transactions
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_wallet numeric(12,2);
  v_new_balance numeric(12,2);
  v_inserted int;
  v_existing_txn_id uuid;
  v_txn public.transactions%rowtype;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_provider_reference is null or length(p_provider_reference) = 0 then
    raise exception 'provider reference is required';
  end if;

  insert into public.hosted_payment_events (provider_reference)
  values (p_provider_reference)
  on conflict (provider_reference) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select transaction_id into v_existing_txn_id from public.hosted_payment_events where provider_reference = p_provider_reference;
    if v_existing_txn_id is null then
      raise exception 'payment % is already being processed, try again shortly', p_provider_reference;
    end if;
    select * into v_txn from public.transactions where id = v_existing_txn_id;
    return v_txn;
  end if;

  select wallet_balance into v_wallet from public.profiles where id = p_customer_id for update;
  if not found then
    raise exception 'customer % not found', p_customer_id;
  end if;

  v_new_balance := v_wallet + p_amount;
  update public.profiles set wallet_balance = v_new_balance where id = p_customer_id;

  insert into public.transactions (customer_id, type, amount, description, reference, balance_after, created_by)
  values (p_customer_id, 'topup', p_amount, 'Wallet top-up via Fygaro', p_provider_reference, v_new_balance, null)
  returning * into v_txn;

  update public.hosted_payment_events set transaction_id = v_txn.id where provider_reference = p_provider_reference;

  return v_txn;
end;
$function$;

revoke all on function public.confirm_hosted_wallet_topup(uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.confirm_hosted_wallet_topup(uuid, numeric, text) to service_role;
;