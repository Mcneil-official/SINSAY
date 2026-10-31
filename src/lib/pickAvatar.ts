import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export type PickedAvatarResult =
  | { ok: true; uri: string; blob: Blob | null }
  | { ok: false; error: string }
  | null;

// Opens the platform image picker and returns a displayable URI plus the raw
// Blob (web: the picker's File — stored verbatim in IndexedDB). Returns
// { ok: false, error } on validation failure and null when the user cancels.
export async function pickAvatarImage(): Promise<PickedAvatarResult> {
  let result: DocumentPicker.DocumentPickerResult;
  try {
    result = await DocumentPicker.getDocumentAsync({
      type: IMAGE_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
  } catch {
    return null;
  }
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mime = asset.mimeType ?? "";
  if (mime && !IMAGE_TYPES.includes(mime)) {
    return { ok: false, error: "Only JPG, PNG, and WebP images are allowed." };
  }
  if (asset.size != null && asset.size > MAX_AVATAR_SIZE) {
    return { ok: false, error: "Image size must be under 5MB." };
  }

  // Web: DocumentPicker exposes the original File — pass it through so it can
  // be persisted raw in IndexedDB (no base64, no quality loss).
  let blob: Blob | null = asset.file ?? null;
  if (!blob && Platform.OS === "web") {
    try {
      blob = await fetch(asset.uri).then((r) => r.blob());
    } catch {
      blob = null;
    }
  }
  return { ok: true, uri: asset.uri, blob };
}
