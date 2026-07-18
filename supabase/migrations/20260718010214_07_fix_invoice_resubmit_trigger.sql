-- The original trigger blocked ANY non-admin change to status/rejection_reason/
-- reviewed_by/reviewed_at — but a customer re-submitting a rejected invoice
-- legitimately needs to move status back to 'pending' and clear the prior
-- rejection_reason/reviewed_at/reviewed_by. Narrow the check: a non-admin may
-- only ever land the row in the "fresh submission awaiting review" shape
-- (status='pending', no review fields set) — never approve/reject themselves,
-- never forge a reviewer, never set a rejection reason.
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
    if new.status <> 'pending' then
      raise exception 'only an admin can approve or reject an invoice';
    end if;
    if new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'only an admin can set invoice review fields';
    end if;
    if new.rejection_reason is not null then
      raise exception 'only an admin can set a rejection reason';
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
;