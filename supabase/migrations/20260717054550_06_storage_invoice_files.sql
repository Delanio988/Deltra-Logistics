-- Private bucket. Path convention: invoices/{customer_id}/{invoice_id}/{filename}
-- so RLS can key off storage.foldername(name)[2] = customer_id without a join.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoice-files',
  'invoice-files',
  false,
  10485760,  -- 10 MB, matches MAX_FILE_SIZE_MB in lib/uploads.ts
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
)
on conflict (id) do nothing;

create policy "invoice_files_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'invoice-files'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  );

create policy "invoice_files_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'invoice-files'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  );

create policy "invoice_files_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'invoice-files'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
  with check (
    bucket_id = 'invoice-files'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  );

create policy "invoice_files_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'invoice-files'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  );
;