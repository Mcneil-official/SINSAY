import { supabase } from "./supabase";

export interface FileInfo {
  name: string;
  mimeType?: string;
  size?: number;
  uri?: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateFile(file: FileInfo): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mimeOk = file.mimeType && ALLOWED_MIME_TYPES.includes(file.mimeType);
  const extOk = ext && ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext);
  if (!mimeOk && !extOk) {
    return "Only JPG, PNG, WebP, and PDF files are allowed.";
  }
  if (file.size && file.size > MAX_FILE_SIZE) {
    return "File size must be under 5MB.";
  }
  return null;
}

export async function uploadFile(
  bucket: string,
  folder: string,
  file: FileInfo,
  userId: string
): Promise<{ path: string | null; error: string | null }> {
  const validationError = validateFile(file);
  if (validationError) {
    return { path: null, error: validationError };
  }

  const fileName = `${folder}/${userId}/${Date.now()}_${file.name}`;
  const body = file.uri
    ? await fetch(file.uri).then((r) => r.blob())
    : (file as any);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, body);

  if (error || !data) {
    return { path: null, error: "Upload failed. Please try again." };
  }

  return { path: data.path, error: null };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  return data?.signedUrl || null;
}
