-- ============================================================
-- mailbox_number: links a Deltra profile to its Kajay Warehousing
-- (OX) courier mailbox number, admin-assigned. Used to match OX
-- packages/customers (keyed by mailboxNumber) back to the right
-- Deltra customer for the warehouse-sync integration.
-- ============================================================
alter table public.profiles
  add column mailbox_number integer unique;

comment on column public.profiles.mailbox_number is
  'Customer''s mailbox number at the Kajay Warehousing (OX) partner facility. Admin-assigned via admin_set_mailbox_number() — matches OX packages/customers to this profile.';

-- Narrow admin RPC, same shape as admin_set_role: customers cannot write
-- this column themselves (no column grant on mailbox_number at all), so
-- assignment can only happen through this security-definer function.
create or replace function public.admin_set_mailbox_number(target_id uuid, new_mailbox_number integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.profiles set mailbox_number = new_mailbox_number, updated_at = now() where id = target_id;
end;
$$;

revoke all on function public.admin_set_mailbox_number(uuid, integer) from public;
revoke all on function public.admin_set_mailbox_number(uuid, integer) from anon;
grant execute on function public.admin_set_mailbox_number(uuid, integer) to authenticated;
;
