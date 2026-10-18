# Implementation Plan: Full PWA Installability on Vercel & Mobile Browsers [COMPLETED]

Resolve why SINSAY could not be installed or downloaded as a PWA when deployed to Vercel, enabling native browser install prompts (address bar icon, "Install app" menu, "Add to Home Screen") and an in-app installation sheet for both Android and iOS mobile devices.

## Root Causes Identified & Resolved
1. **Missing Manifest Link in HTML**: The generated `dist/index.html` lacked `<link rel="manifest" href="/manifest.json">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, and Apple touch icon references.
2. **Missing Manifest & SW in Output**: Expo web export does not automatically copy `public/manifest.json`, `public/sw.js`, or icon files to `dist/`.
3. **Missing PWA Icon Assets**: There were no dedicated 192x192, 512x512, and maskable PNG icons in `public/`.
4. **Vercel Rewrite Interception**: `vercel.json` rewrote `/manifest.json` and static icon files to `/index.html`, causing syntax errors when browsers fetched the manifest.
5. **iOS Safari Requirements**: Safari requires guided user steps ("Share" ⎋ -> "Add to Home Screen").

---

## Completed Implementations

### 1. PWA Assets & Manifest Generation
- [x] Created `scripts/generate-pwa-icons.js` and generated:
  - `public/icon-192.png` (192x192)
  - `public/icon-512.png` (512x512)
  - `public/icon-maskable-512.png` (512x512 with safe zone padding)
  - `public/apple-touch-icon.png` (180x180)
  - `public/favicon-32x32.png` & `public/favicon-16x16.png`
- [x] Created `/public/manifest.json` conforming to W3C Web App Manifest standards with `display: "standalone"`, `theme_color: "#005EEC"`, `start_url: "/"`, and all icon sizes.

### 2. Service Worker (`public/sw.js`) & Dynamic Registration
- [x] Enhanced `src/lib/registerSW.ts` to register `/sw.js` and dynamically ensure `<link rel="manifest">` and mobile meta tags exist in the document `<head>`.
- [x] Caches core static assets and provides offline fallback navigation via `/offline.html`.

### 3. Build & Export Pipeline for Vercel
- [x] Created `scripts/post-export-pwa.js` to copy all static PWA files from `public/` into `dist/` and inject all PWA `<link>` and `<meta>` tags into `dist/index.html`.
- [x] Updated `package.json` build script: `"expo export -p web --output-dir dist && node scripts/post-export-pwa.js"`.
- [x] Updated `vercel.json` to exclude `/manifest.json`, `/sw.js`, and icon files from SPA fallback rewrites, while adding proper MIME type and cache-control headers.

### 4. Browser & Mobile Installation Flow
- [x] Built `src/context/PWAContext.tsx`: captures `beforeinstallprompt`, checks standalone mode, identifies iOS/Android, and manages banner/modal visibility.
- [x] Built `src/components/PWAInstallBanner.tsx`: floating banner with app icon, title, and "Install" button.
- [x] Built `src/components/PWAInstallModal.tsx`: step-by-step visual instructions for iOS Safari and other browsers.
- [x] Added "Install SINSAY App" row to both tourist and operator Profile screens.

---

## Verification Results
- `npm run build`: Output confirmed `dist/manifest.json`, `dist/sw.js`, `dist/index.html` with injected manifest link, and all icons.
- Dev Server endpoints: Verified `HTTP 200` for `/`, `/manifest.json`, `/sw.js`, and `/icon-192.png`.
- Compilation: Ran `compile_applet` with successful build output.
