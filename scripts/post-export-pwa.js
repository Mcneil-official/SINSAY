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

// 2. Patch dist/index.html with PWA tags
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Replace Expo's default icon links so the browser theme selects the
  // appropriate diving icon. The installed PWA icon is configured in the manifest.
  html = html.replace(/^\s*<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\s*$/gim, '');

  const pwaTags = `
    <!-- PWA Web App Manifest & Mobile Configuration -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="SINSAY" />
    <meta name="application-name" content="SINSAY" />
    <meta name="theme-color" content="#005AF1" />
    <link rel="apple-touch-icon" href="/pwa-apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/SINSAY Blue Diving Icon.png" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/png" href="/SINSAY White Diving Icon.png" media="(prefers-color-scheme: dark)" />
  `;

  html = html.replace('</head>', `${pwaTags}\n</head>`);
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Injected PWA meta & theme-aware favicon tags into dist/index.html');
}

console.log('PWA post-export processing complete.');
