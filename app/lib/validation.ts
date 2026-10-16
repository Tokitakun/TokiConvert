// Validation utilities for Toki Convert file input
// No external dependencies; use native File APIs.

/**
 * Allowed MIME types for MVP image converter.
 */
export const ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

/** Maximum number of files per batch */
export const MAX_FILES = 10;
/** Maximum size per file in bytes (15 MB) */
export const MAX_SIZE = 15 * 1024 * 1024;

/**
 * Validate a single File object.
 * Returns null if valid, otherwise an error message string.
 */
export function validateFile(file: File): string | null {
  if (!ALLOWED_MIME.includes(file.type)) {
    return "Format tidak didukung";
  }
  if (file.size > MAX_SIZE) {
    return "Ukuran file melebihi 15 MB";
  }
  return null;
}

/**
 * Validate an array of files (batch).
 * Returns an object with `valid` (File[]) and `errors` (Map<File, string>). In case
 * of too many files, excess files are ignored and reported.
 */
export function validateBatch(files: FileList): {
  valid: File[];
  errors: Map<File, string>;
} {
  const valid: File[] = [];
  const errors = new Map<File, string>();
  const limit = Math.min(files.length, MAX_FILES);
  for (let i = 0; i < limit; i++) {
    const file = files[i];
    const err = validateFile(file);
    if (err) {
      errors.set(file, err);
    } else {
      valid.push(file);
    }
  }
  if (files.length > MAX_FILES) {
    // Mark excess files as error
    for (let i = MAX_FILES; i < files.length; i++) {
      errors.set(files[i], `Maksimum ${MAX_FILES} file per batch`);
    }
  }
  return { valid, errors };
}
