-- Postgres grants EXECUTE to PUBLIC by default on function creation.
-- admin_set_role already re-checks is_admin() internally, but defense in
-- depth: anon (unauthenticated) has no business calling this RPC at all,
-- and PUBLIC should never carry an implicit grant on it either.
revoke all on function public.admin_set_role(uuid, text) from public;
revoke all on function public.admin_set_role(uuid, text) from anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
;