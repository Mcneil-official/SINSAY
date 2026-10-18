const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
const logoPath = path.resolve(__dirname, '../assets/images/logo.png');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons from', logoPath);

// Standard sizes
const sizes = [
  { name: 'icon-192.png', size: 192, logoSize: 154, bg: '#FFFFFF' },
  { name: 'icon-512.png', size: 512, logoSize: 410, bg: '#FFFFFF' },
  { name: 'icon-maskable-512.png', size: 512, logoSize: 340, bg: '#FFFFFF' },
  { name: 'apple-touch-icon.png', size: 180, logoSize: 144, bg: '#FFFFFF' },
  { name: 'favicon-32x32.png', size: 32, logoSize: 26, bg: '#FFFFFF' },
  { name: 'favicon-16x16.png', size: 16, logoSize: 13, bg: '#FFFFFF' },
];

for (const item of sizes) {
  const outPath = path.join(publicDir, item.name);
  const cmd = `convert -size ${item.size}x${item.size} xc:"${item.bg}" \\( "${logoPath}" -resize ${item.logoSize}x${item.logoSize} \\) -gravity center -composite "${outPath}"`;
  execSync(cmd);
  console.log(`Generated ${item.name} (${item.size}x${item.size})`);
}

console.log('All PWA icons generated successfully in public/');
