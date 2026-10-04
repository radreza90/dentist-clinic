export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

export function validateUpload(file: File) {
  if (!file.name || file.size === 0) return "Empty file";
  if (file.size > MAX_UPLOAD_SIZE) return "Maximum upload size is 10 MB";
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) return "File type is not allowed";
  return null;
}