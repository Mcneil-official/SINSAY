const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist! Run expo export first.');
  process.exit(1);
}

const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || 'https://sinsay-mabini.techsite.live').replace(/\/+$/, '');

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

// 1d. Sync site URL in dist/robots.txt and dist/sitemap.xml if customized
const robotsDistPath = path.join(distDir, 'robots.txt');
if (fs.existsSync(robotsDistPath)) {
  let robotsContent = fs.readFileSync(robotsDistPath, 'utf8');
  robotsContent = robotsContent.replace(/https:\/\/(sinsay-mabini\.techsite\.live|sinsay\.ph)/g, siteUrl);
  fs.writeFileSync(robotsDistPath, robotsContent, 'utf8');
}
const sitemapDistPath = path.join(distDir, 'sitemap.xml');
if (fs.existsSync(sitemapDistPath)) {
  let sitemapContent = fs.readFileSync(sitemapDistPath, 'utf8');
  sitemapContent = sitemapContent.replace(/https:\/\/(sinsay-mabini\.techsite\.live|sinsay\.ph)/g, siteUrl);
  fs.writeFileSync(sitemapDistPath, sitemapContent, 'utf8');
}

// 2. Patch dist/index.html with PWA tags, SEO meta, schema, and physical viewport pinning
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Replace Expo's default icon links so the browser theme selects the
  // appropriate diving icon. The installed PWA icon is configured in the manifest.
  html = html.replace(/^\s*<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\s*$/gim, '');

  // Keep the iOS PWA within the browser viewport instead of forcing edge-to-edge layout.
  html = html.replace(
    /<meta\s+name=["']viewport["'][^>]*>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=auto" />'
  );

  // Ensure high-relevance title tag for search crawlers
  const pageTitle = 'SINSAY — Mabini Eco-Dive Tourism & Conservation Pass';
  if (/<title>.*?<\/title>/i.test(html)) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);
  } else {
    html = html.replace('<head>', `<head>\n    <title>${pageTitle}</title>`);
  }

  const pwaAndSeoTags = `
    <!-- Disable stale caching on initial HTML load -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />

    <!-- Primary SEO Metadata -->
    <meta name="description" content="Official Eco-Dive Tourism & Conservation Pass platform for the Municipality of Mabini (Anilao, Batangas). Explore dive sites, accredited resorts, and generate smart dive itineraries." />
    <meta name="keywords" content="Mabini, Anilao, Batangas, scuba diving, eco-dive pass, dive sites, conservation pass, SINSAY, Batangas diving, marine sanctuary" />
    <meta name="author" content="Municipality of Mabini, Batangas" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${siteUrl}/" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SINSAY" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:title" content="SINSAY — Mabini Eco-Dive Tourism & Conservation Pass" />
    <meta property="og:description" content="Official Eco-Dive Tourism & Conservation Pass platform for the Municipality of Mabini (Anilao, Batangas). Explore dive sites, accredited resorts, and generate smart dive itineraries." />
    <meta property="og:image" content="${siteUrl}/pwa-icon-512.png" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="SINSAY — Mabini Eco-Dive Tourism & Conservation Pass" />
    <meta name="twitter:description" content="Official Eco-Dive Tourism & Conservation Pass platform for the Municipality of Mabini (Anilao, Batangas)." />
    <meta name="twitter:image" content="${siteUrl}/pwa-icon-512.png" />

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "SINSAY",
      "applicationCategory": "TravelApplication",
      "operatingSystem": "All",
      "description": "Official Eco-Dive Tourism & Conservation Pass platform for the Municipality of Mabini (Anilao, Batangas).",
      "url": "${siteUrl}",
      "image": "${siteUrl}/pwa-icon-512.png",
      "author": {
        "@type": "GovernmentOrganization",
        "name": "Municipality of Mabini, Batangas"
      }
    }
    </script>

    <!-- PWA Web App Manifest & Mobile Configuration -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="SINSAY" />
    <meta name="application-name" content="SINSAY" />
    <meta name="theme-color" content="#FFFFFF" id="sinsay-theme-color" />
    <link rel="apple-touch-icon" href="/pwa-apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/SINSAY Blue Diving Icon.png" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/png" href="/SINSAY White Diving Icon.png" media="(prefers-color-scheme: dark)" />

    <!-- Enforce physical screen pinning on iOS WebKit -->
    <style id="sinsay-viewport-pin">
      html, body {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #root {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        overscroll-behavior: none !important;
        background-color: #F8FAFC !important;
      }
    </style>
  `;

  html = html.replace('</head>', `${pwaAndSeoTags}\n</head>`);

  // Provide crawler-indexable fallback content in noscript for Googlebot before client hydration
  const noscriptFallback = `
    <noscript>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; text-align: center; color: #1E293B;">
        <h1 style="color: #032B69; font-size: 24px; margin-bottom: 8px;">SINSAY — Mabini Eco-Dive Tourism & Conservation Pass</h1>
        <p style="font-size: 15px; max-width: 600px; margin: 0 auto 16px; line-height: 1.5;">
          Official eco-dive management and conservation pass platform for the Municipality of Mabini (Anilao, Batangas). Explore certified dive sites, view accredited resorts and operators, and plan your dive trips.
        </p>
        <p style="font-size: 13px; color: #64748B;">Please enable JavaScript to experience the full interactive SINSAY PWA.</p>
      </div>
    </noscript>
  `;

  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">${noscriptFallback}</div>`);
  } else if (!html.includes('<noscript>')) {
    html = html.replace(/(<div id="root"[^>]*>)/, `$1${noscriptFallback}`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Injected SEO meta, Schema.org JSON-LD, PWA tags, and noscript fallback into dist/index.html');
}

console.log('PWA post-export processing complete.');
