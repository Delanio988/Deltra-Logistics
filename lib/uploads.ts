// Client-side invoice file upload — uploads straight to Supabase Storage
// (the `invoice-files` bucket) from the browser, authenticated via the
// customer's own session. Storage RLS (see the Phase 1 migrations) enforces
// that a customer can only write under their own `invoices/{their-uid}/...`
// prefix, so this needs no server round-trip of the file bytes themselves —
// only the resulting metadata (name/size/type/storage path) ever reaches a
// Server Action, in lib/actions/invoices.ts.

import { createClient } from "@/lib/supabase/client";

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILES_PER_INVOICE = 5;

export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".pdf"];

/** Value for <input accept="...">. */
export const ACCEPT_ATTR = [...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS].join(",");

/** Mime types a browser can reliably render in an <img> tag. HEIC/HEIF lack
 *  broad support, so those get a file-icon treatment instead, same as PDFs. */
export function isThumbnailableImage(type: string): boolean {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp";
}

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Returns an error message if the file is invalid, or null if it's fine. */
export function validateInvoiceFile(file: File): string | null {
  const typeOk = ACCEPTED_MIME_TYPES.includes(file.type) || hasAcceptedExtension(file.name);
  if (!typeOk) {
    return `${file.name}: unsupported file type. Use JPG, PNG, WEBP, HEIC, or PDF.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: file is too large (max ${MAX_FILE_SIZE_MB} MB).`;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type UploadedInvoiceFile = {
  name: string;
  size: number;
  type: string;
  /** Real Supabase Storage object path — what actually gets persisted. */
  storagePath: string;
  /** Displayable URL: a local blob preview while mid-upload, or a
   *  server-generated signed URL once the file belongs to a saved invoice.
   *  Absent means "preview unavailable" — the existing UI already handles that. */
  url?: string;
  uploadedAt?: string;
};

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function randomStorageFilename(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const ext = dot >= 0 ? originalName.slice(dot) : "";
  return `${crypto.randomUUID()}${ext}`;
}

/**
 * Uploads a single file to Storage under invoices/{customer_id}/pending/... —
 * "pending" because the invoice row this belongs to may not exist yet (a
 * fresh submission creates it only when the form is actually submitted).
 * `onProgress` is coarse (start/done) since the Supabase JS client doesn't
 * expose granular upload progress — a real backend can't fake percentages
 * the way the previous mock did.
 */
export async function uploadInvoiceFile(file: File, onProgress?: (percent: number) => void): Promise<UploadedInvoiceFile> {
  onProgress?.(10);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const storagePath = `invoices/${user.id}/pending/${randomStorageFilename(file.name)}`;
  const { error } = await supabase.storage.from("invoice-files").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  onProgress?.(100);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    storagePath,
    url: URL.createObjectURL(file),
    uploadedAt: formatToday(),
  };
}

/** Revokes the local preview URL only — deleting the real Storage object (and
 *  its invoice_files row) is a server-side operation requiring an ownership
 *  check, see lib/actions/invoices.ts's removeInvoiceFile. */
export function deleteInvoiceFile(file: { url?: string }): void {
  if (file.url) URL.revokeObjectURL(file.url);
}

export async function replaceInvoiceFile(
  oldFile: { url?: string },
  newFile: File,
  onProgress?: (percent: number) => void
): Promise<UploadedInvoiceFile> {
  deleteInvoiceFile(oldFile);
  return uploadInvoiceFile(newFile, onProgress);
}
