// Client-side pre-alert receipt upload — mirrors lib/uploads.ts, uploading
// straight to Supabase Storage (the `pre-alert-files` bucket) from the
// browser. Storage RLS enforces that a customer can only write under their
// own `pre-alerts/{their-uid}/...` prefix, so only the resulting metadata
// (name/size/type/storage path) ever reaches a Server Action, in
// lib/actions/pre-alerts.ts.

import { createClient } from "@/lib/supabase/client";

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
export function validatePreAlertFile(file: File): string | null {
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

export type UploadedPreAlertFile = {
  name: string;
  size: number;
  type: string;
  /** Real Supabase Storage object path — what actually gets persisted. */
  storagePath: string;
  /** Displayable URL: a local blob preview while mid-upload, or a
   *  server-generated signed URL once the file belongs to a saved pre-alert.
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
 * Uploads a single receipt to Storage under pre-alerts/{customer_id}/pending/... —
 * "pending" because the pre-alert row this belongs to may not exist yet (a
 * fresh submission creates it only when the form is actually submitted).
 */
export async function uploadPreAlertFile(file: File, onProgress?: (percent: number) => void): Promise<UploadedPreAlertFile> {
  onProgress?.(10);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const storagePath = `pre-alerts/${user.id}/pending/${randomStorageFilename(file.name)}`;
  const { error } = await supabase.storage.from("pre-alert-files").upload(storagePath, file, {
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
 *  its pre_alert_files row) is a server-side operation requiring an ownership
 *  check, see lib/actions/pre-alerts.ts. */
export function deletePreAlertFile(file: { url?: string }): void {
  if (file.url) URL.revokeObjectURL(file.url);
}

export async function replacePreAlertFile(
  oldFile: { url?: string },
  newFile: File,
  onProgress?: (percent: number) => void
): Promise<UploadedPreAlertFile> {
  deletePreAlertFile(oldFile);
  return uploadPreAlertFile(newFile, onProgress);
}
