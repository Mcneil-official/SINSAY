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

export async function loadImageAsBase64(uri: string): Promise<string> {
  if (!uri) return "";
  if (uri.startsWith("data:")) return uri;

  let fullUrl = uri;
  if (
    typeof window !== "undefined" &&
    !uri.startsWith("http://") &&
    !uri.startsWith("https://") &&
    !uri.startsWith("blob:")
  ) {
    try {
      fullUrl = new URL(uri, window.location.href).href;
    } catch {
      fullUrl = uri;
    }
  }

  // Strategy 1: fetch blob & FileReader (cleanest for CORS / local assets)
  try {
    const res = await fetch(fullUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Failed to convert image to data URL"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64 && base64.startsWith("data:image")) return base64;
    }
  } catch {
    // fall through to canvas strategy
  }

  // Strategy 2: HTML Image + Canvas (handles cached or same-origin images)
  if (typeof window !== "undefined") {
    try {
      const canvasResult = await new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 600;
            canvas.height = img.naturalHeight || img.height || 800;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(fullUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const isPng =
              fullUrl.toLowerCase().includes(".png") ||
              fullUrl.toLowerCase().includes("logo");
            resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.95));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = fullUrl;
      });
      if (canvasResult && canvasResult.startsWith("data:image"))
        return canvasResult;
    } catch {
      // return fallback URL
    }
  }

  return fullUrl;
}

export async function inlineNodeImagesAsBase64(el: HTMLElement): Promise<void> {
  if (typeof document === "undefined") return;

  // 1. Process all <img> elements inside node
  const imgElements = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgElements.map(async (img) => {
      try {
        img.crossOrigin = "anonymous";
        const src = img.getAttribute("src") || img.src;
        if (src && !src.startsWith("data:")) {
          const dataUrl = await loadImageAsBase64(src);
          if (dataUrl && dataUrl.startsWith("data:")) {
            img.src = dataUrl;
          }
        }
        if (!img.complete) {
          if (typeof img.decode === "function") {
            await img.decode().catch(() => {});
          } else {
            await new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            });
          }
        }
      } catch {
        // ignore image error
      }
    }),
  );

  // 2. Process all CSS background-image occurrences
  const allElements = [
    el,
    ...Array.from(el.querySelectorAll<HTMLElement>("*")),
  ];
  await Promise.all(
    allElements.map(async (item) => {
      const bg =
        item.style.backgroundImage ||
        (typeof window !== "undefined"
          ? window.getComputedStyle(item).backgroundImage
          : "");
      if (bg && bg.includes("url(") && !bg.includes("data:")) {
        const match = /url\(['"]?(.*?)['"]?\)/.exec(bg);
        if (match && match[1] && !match[1].startsWith("data:")) {
          try {
            const dataUrl = await loadImageAsBase64(match[1]);
            if (dataUrl && dataUrl.startsWith("data:")) {
              item.style.backgroundImage = `url("${dataUrl}")`;
            }
          } catch {
            // ignore bg error
          }
        }
      }
    }),
  );
}

export async function captureNodeToPng(node: unknown): Promise<string> {
  if (Platform.OS !== "web") {
    throw new Error("Snapshot sharing is supported on the web app.");
  }
  let el = node as any;
  if (el && !el.tagName && el._node) el = el._node;
  if (el && !el.tagName && el.node) el = el.node;
  if (!el || typeof (el as HTMLElement).tagName !== "string") {
    throw new Error("Snapshot card isn't ready yet. Try again.");
  }

  // Pre-inline all images as Base64 data URLs to eliminate CORS and Safari WebKit paint gaps
  await inlineNodeImagesAsBase64(el);

  const { toPng } = await import("html-to-image");

  // iOS Safari / WebKit warm-up pass: Safari often skips rasterizing image layers
  // into foreignObject SVG on the first render call. Triggering a fast warm-up pass
  // forces WebKit to cache the rendered paint layers.
  const isSafari =
    typeof navigator !== "undefined" &&
    (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent));

  if (isSafari) {
    try {
      await toPng(el, { cacheBust: false, pixelRatio: 1, skipFonts: true });
      await new Promise((resolve) => setTimeout(resolve, 140));
    } catch {
      // ignore warm-up error
    }
  }

  try {
    return await toPng(el, {
      cacheBust: false,
      pixelRatio: 2,
      style: {
        transform: "none",
        zoom: "1",
      },
    });
  } catch {
    // Fallback skipping external webfonts if stylesheet embedding fails
    return await toPng(el, {
      cacheBust: false,
      pixelRatio: 2,
      skipFonts: true,
      style: {
        transform: "none",
        zoom: "1",
      },
    });
  }
}

export async function sharePng(
  dataUrl: string,
  fileName: string,
): Promise<SnapshotResult> {
  const nav =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & {
          canShare?: (d: { files: File[] }) => boolean;
        })
      : undefined;
  if (nav && typeof nav.share === "function") {
    try {
      const file = dataUrlToFile(dataUrl, fileName);
      if (
        typeof nav.canShare === "function" &&
        !nav.canShare({ files: [file] })
      ) {
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

export async function captureAndShare(
  node: unknown,
  fileName: string,
): Promise<SnapshotResult> {
  const png = await captureNodeToPng(node);
  return sharePng(png, fileName);
}

export async function captureAndDownload(
  node: unknown,
  fileName: string,
): Promise<void> {
  const png = await captureNodeToPng(node);
  const [head, body] = png.split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] ?? "image/png";
  const bytes = atob(body);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  const blob = new Blob([buf], { type: mime });
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

// Text sharing (dive plans): system share sheet when available, clipboard
// fallback otherwise. Returns how the text left the device.
export type TextShareResult = "shared" | "copied" | "unavailable";

export async function shareText(
  title: string,
  text: string,
): Promise<TextShareResult> {
  const nav =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & {
          share?: (d: { title?: string; text?: string }) => Promise<void>;
        })
      : undefined;
  if (nav && typeof nav.share === "function") {
    try {
      await nav.share({ title, text });
      return "shared";
    } catch (e) {
      // Dismissal is not an error; real failures fall through to clipboard.
      if (e instanceof Error && e.name === "AbortError") return "shared";
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // Clipboard unavailable (non-secure context, permissions).
  }
  return "unavailable";
}
