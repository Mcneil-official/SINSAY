import { supabase } from "./supabase";

export interface FileInfo {
  name: string;
  mimeType?: string;
  // DOM File on web exposes .type instead of .mimeType
  type?: string;
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
  const mime = file.mimeType ?? file.type;
  const mimeOk = mime && ALLOWED_MIME_TYPES.includes(mime);
  const extOk = ext && ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext);
  if (!mimeOk && !extOk) {
    return "Only JPG, PNG, WebP, and PDF files are allowed.";
  }
  if (file.size === undefined || file.size === null) {
    return "Could not determine file size. Please try another file.";
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > MAX_FILE_SIZE) {
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

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${folder}/${userId}/${Date.now()}_${safeName}`;
  const mime = file.mimeType ?? file.type;
  let body: Blob | FileInfo;
  try {
    body = file.uri
      ? await fetch(file.uri).then((r) => {
          if (!r.ok) throw new Error(`Fetch failed with status ${r.status}`);
          return r.blob();
        })
      : (file as any);
  } catch (e) {
    console.error("Failed to read file for upload:", e);
    return { path: null, error: "Could not read the selected file. Please try again." };
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, body, mime ? { contentType: mime } : undefined);

  if (error || !data) {
    return { path: null, error: error?.message || "Upload failed. Please try again." };
  }

  return { path: data.path, error: null };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return { url: data?.signedUrl || null, error: null };
  } catch (e) {
    console.error("Failed to create signed URL:", e);
    return { url: null, error: e instanceof Error ? e.message : "Failed to load file." };
  }
}
