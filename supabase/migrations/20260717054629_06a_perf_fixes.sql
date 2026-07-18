-- Missing FK covering indexes (admin audit/attribution lookups: "actions by user X").
create index invoice_status_history_actor_id_idx on public.invoice_status_history (actor_id);
create index invoices_reviewed_by_idx on public.invoices (reviewed_by);
create index line_items_created_by_idx on public.line_items (created_by);
create index transactions_created_by_idx on public.transactions (created_by);

-- Replace each `for all` (admin) policy with insert/update/delete-only
-- policies — the dedicated *_select_own_or_admin policy already covers
-- SELECT, so leaving it in `for all` meant Postgres evaluated two
-- permissive policies on every read instead of one.
drop policy "packages_admin_write" on public.packages;
create policy "packages_admin_insert" on public.packages
  for insert to authenticated
  with check ((select private.is_admin()));
create policy "packages_admin_update" on public.packages
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "packages_admin_delete" on public.packages
  for delete to authenticated
  using ((select private.is_admin()));

drop policy "line_items_admin_write" on public.line_items;
create policy "line_items_admin_insert" on public.line_items
  for insert to authenticated
  with check ((select private.is_admin()));
create policy "line_items_admin_update" on public.line_items
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "line_items_admin_delete" on public.line_items
  for delete to authenticated
  using ((select private.is_admin()));

drop policy "authorised_users_write_own_or_admin" on public.authorised_users;
create policy "authorised_users_insert_own_or_admin" on public.authorised_users
  for insert to authenticated
  with check (owner_customer_id = (select auth.uid()) or (select private.is_admin()));
create policy "authorised_users_update_own_or_admin" on public.authorised_users
  for update to authenticated
  using (owner_customer_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_customer_id = (select auth.uid()) or (select private.is_admin()));
create policy "authorised_users_delete_own_or_admin" on public.authorised_users
  for delete to authenticated
  using (owner_customer_id = (select auth.uid()) or (select private.is_admin()));
;