-- A non-admin INSERT (both a fresh submission and a withdraw/restore) must
-- never be able to land a row in anything but "fresh, awaiting review" shape.
-- Without this, a crafted client payload could insert a row with
-- status='approved' directly, bypassing the whole review process — the
-- existing UPDATE-side trigger already blocks this on update, this closes
-- the same hole on insert. Legitimate customer inserts never set these
-- fields anyway, so this silently overrides rather than raising, which
-- leaves normal submitInvoice/restoreInvoice usage unaffected.
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

  if not (select private.is_admin()) then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.rejection_reason := null;
  end if;

  return new;
end;
$$;
;