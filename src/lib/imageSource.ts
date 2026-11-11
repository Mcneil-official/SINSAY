import { Asset } from "expo-asset";
import { Image } from "react-native";

/**
 * Platform-safe resolution of an image source (string, `{ uri }`, or a bundled
 * `require(...)` asset id) to a URI. Never throws.
 *
 * `Image.resolveAssetSource` does not exist on react-native-web, so bundled
 * assets fall back to `expo-asset` there.
 */
export function resolveImageUri(source: unknown): string | null {
  try {
    if (!source) return null;
    if (typeof source === "string") return source;

    if (typeof source === "object") {
      const uri = (source as { uri?: unknown }).uri;
      return typeof uri === "string" && uri ? uri : null;
    }

    if (typeof source === "number") {
      const native = (
        Image as unknown as {
          resolveAssetSource?: (s: number) => { uri?: string } | null;
        }
      ).resolveAssetSource;
      if (typeof native === "function") {
        const resolved = native(source);
        if (resolved?.uri) return resolved.uri;
      }
      const uri = Asset.fromModule(source).uri;
      return uri || null;
    }
  } catch {
    // fall through
  }
  return null;
}
