import { Platform } from "react-native";

// Snapshot capture + share for the web PWA. html-to-image works on the DOM
// node behind an RN-web View ref. Native capture is out of scope (PWA target).
export type SnapshotResult = "shared" | "downloaded";

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [head, body] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] ?? "image/png";
  const bytes = atob(body);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new File([buf], fileName, { type: mime });
}

export async function captureNodeToPng(node: unknown): Promise<string> {
  if (Platform.OS !== "web") {
    throw new Error("Snapshot sharing is supported on the web app.");
  }
  const el = node as unknown as HTMLElement | null;
  if (!el || typeof (el as HTMLElement).tagName !== "string") {
    throw new Error("Snapshot card isn't ready yet. Try again.");
  }
  const { toPng } = await import("html-to-image");
  return toPng(el, { cacheBust: true, pixelRatio: 2 });
}

export async function sharePng(dataUrl: string, fileName: string): Promise<SnapshotResult> {
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }) : undefined;
  if (nav && typeof nav.share === "function") {
    try {
      const file = dataUrlToFile(dataUrl, fileName);
      if (typeof nav.canShare === "function" && !nav.canShare({ files: [file] })) {
        throw new Error("share-unsupported");
      }
      await nav.share({ files: [file], title: "Dive manifest snapshot" });
      return "shared";
    } catch (e) {
      // User dismissal is not an error — rethrow only real failures.
      if (e instanceof Error && e.name === "AbortError") return "shared";
      if (e instanceof Error && e.message === "share-unsupported") {
        // fall through to download
      } else if (e instanceof DOMException && e.name === "AbortError") {
        return "shared";
      } else {
        // Web Share failed (e.g. non-secure context) — download instead.
      }
    }
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return "downloaded";
}

export async function captureAndShare(node: unknown, fileName: string): Promise<SnapshotResult> {
  const png = await captureNodeToPng(node);
  return sharePng(png, fileName);
}

export async function captureAndDownload(node: unknown, fileName: string): Promise<void> {
  const png = await captureNodeToPng(node);
  const a = document.createElement("a");
  a.href = png;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
