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

  const pwaTags = `
    <!-- PWA Web App Manifest & Mobile Configuration -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="SINSAY" />
    <meta name="application-name" content="SINSAY" />
    <meta name="theme-color" content="#005EEC" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  `;

  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${pwaTags}\n</head>`);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Injected PWA meta & link tags into dist/index.html');
  } else {
    console.log('dist/index.html already contains manifest link.');
  }
}

console.log('PWA post-export processing complete.');
