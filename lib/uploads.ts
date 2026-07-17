// Isolated file-upload service for invoice submissions. Every consumer goes
// through uploadInvoiceFile() — swapping the mock body below for a real
// upload (Supabase Storage / S3 / UploadThing, etc.) later means editing
// only this file, not any component.

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
  id: string;
  name: string;
  size: number;
  type: string;
  /** Object URL for this browser session only — see lib/data-store.tsx for
   *  why this doesn't survive a reload. */
  url: string;
  uploadedAt: string;
};

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Uploads a single file and reports progress, resolving with the stored
 * file's metadata + URL. `onProgress` mirrors the shape a real XHR/fetch
 * upload-progress event would have, so the UI doesn't need to change when
 * the mock body below is replaced with a real network call.
 *
 * TODO: replace this body with a real upload (Supabase Storage / S3 /
 * UploadThing) + a database record for the resulting file. Server-side
 * file-type/size validation and virus scanning belong at that boundary,
 * re-checked server-side even though the client already validates —
 * client-side checks are a UX nicety, not a security control.
 */
export function uploadInvoiceFile(file: File, onProgress?: (percent: number) => void): Promise<UploadedInvoiceFile> {
  return new Promise((resolve) => {
    let percent = 0;
    const tick = () => {
      percent = Math.min(100, percent + 15 + Math.random() * 20);
      onProgress?.(Math.round(percent));
      if (percent >= 100) {
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadedAt: formatToday(),
        });
        return;
      }
      setTimeout(tick, 150 + Math.random() * 150);
    };
    setTimeout(tick, 150);
  });
}

/**
 * Deletes a single invoice file. Mock: just revokes its local object URL.
 * TODO: replace with a real delete call against your storage provider
 * (Supabase Storage / S3 / UploadThing) and remove the corresponding
 * database file record. Server-side authorization must live here too —
 * only the owning customer or an admin may delete a given file; right now
 * this check doesn't exist at all and is trivially bypassable client-side.
 */
export function deleteInvoiceFile(file: { url?: string }): void {
  if (file.url) URL.revokeObjectURL(file.url);
}

/**
 * Swaps one invoice file for another. Mock: deletes the old file's object
 * URL, then uploads the replacement through the normal upload path — a
 * real backend would ideally do this as one atomic operation server-side.
 */
export function replaceInvoiceFile(
  oldFile: { url?: string },
  newFile: File,
  onProgress?: (percent: number) => void
): Promise<UploadedInvoiceFile> {
  deleteInvoiceFile(oldFile);
  return uploadInvoiceFile(newFile, onProgress);
}
