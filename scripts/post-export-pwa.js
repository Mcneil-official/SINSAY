const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist! Run expo export first.');
  process.exit(1);
}

// 1. Copy all files from public/ into dist/
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`Copied public/${file} -> dist/${file}`);
    }
  }
}

// 1b. Ensure manifesto hero background exists at all potential production URLs
const heroSrc = path.resolve(__dirname, '../public/manifesto-hero-bg.png');
if (fs.existsSync(heroSrc)) {
  const targetDirs = [
    distDir,
    path.join(distDir, 'assets'),
    path.join(distDir, 'assets', 'assets')
  ];
  for (const tDir of targetDirs) {
    if (!fs.existsSync(tDir)) {
      fs.mkdirSync(tDir, { recursive: true });
    }
    fs.copyFileSync(heroSrc, path.join(tDir, 'manifesto-hero-bg.png'));
  }
  // Also copy to any hashed manifesto-hero-bg variants found in dist/assets/assets
  const assetsAssetsDir = path.join(distDir, 'assets', 'assets');
  if (fs.existsSync(assetsAssetsDir)) {
    const existing = fs.readdirSync(assetsAssetsDir);
    for (const f of existing) {
      if (f.startsWith('manifesto-hero-bg') && f.endsWith('.png')) {
        fs.copyFileSync(heroSrc, path.join(assetsAssetsDir, f));
      }
    }
  }
  console.log('Ensured manifesto-hero-bg.png copied to all dist asset paths');
}

// 1c. Bump service worker cache name in dist/sw.js for instant deployment cache busting
const swDistPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swDistPath)) {
  let swContent = fs.readFileSync(swDistPath, 'utf8');
  const buildVersion = `sinsay-v${Date.now()}`;
  swContent = swContent.replace(/const CACHE_NAME = ["'][^"']+["'];/, `const CACHE_NAME = "${buildVersion}";`);
  fs.writeFileSync(swDistPath, swContent, 'utf8');
  console.log(`Updated dist/sw.js cache name to ${buildVersion}`);
}

// 2. Patch dist/index.html with PWA tags
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Replace Expo's default icon links so the browser theme selects the
  // appropriate diving icon. The installed PWA icon is configured in the manifest.
  html = html.replace(/^\s*<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\s*$/gim, '');

  // Ensure viewport includes viewport-fit=cover, maximum-scale=1, user-scalable=no for iOS edge-to-edge PWA
  html = html.replace(
    /<meta\s+name=["']viewport["'][^>]*>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
  );

  const pwaTags = `
    <!-- Disable stale caching on initial HTML load -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <!-- PWA Web App Manifest & Mobile Configuration -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="SINSAY" />
    <meta name="application-name" content="SINSAY" />
    <meta name="theme-color" content="#FFFFFF" id="sinsay-theme-color" />
    <link rel="apple-touch-icon" href="/pwa-apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/SINSAY Blue Diving Icon.png" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/png" href="/SINSAY White Diving Icon.png" media="(prefers-color-scheme: dark)" />
  `;

  html = html.replace('</head>', `${pwaTags}\n</head>`);
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Injected PWA meta & theme-aware favicon tags into dist/index.html');
}

console.log('PWA post-export processing complete.');
