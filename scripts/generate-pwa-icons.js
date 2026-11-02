const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

const publicDir = path.resolve(__dirname, '../public');
const logoPath = path.resolve(__dirname, '../public/SINSAY-favicon.png');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons from', logoPath);

const sizes = [
  { name: 'pwa-icon-192.png', size: 192, logoSize: 154 },
  { name: 'pwa-icon-512.png', size: 512, logoSize: 410 },
  { name: 'pwa-icon-maskable-512.png', size: 512, logoSize: 340 },
  { name: 'pwa-apple-touch-icon.png', size: 180, logoSize: 144 },
  { name: 'pwa-icon-32.png', size: 32, logoSize: 26 },
  { name: 'pwa-icon-16.png', size: 16, logoSize: 13 },
];

async function generateIcons() {
  const source = await Jimp.read(logoPath);

  for (const item of sizes) {
    const icon = new Jimp(item.size, item.size, 0xffffffff);
    const artwork = source.clone().contain(item.logoSize, item.logoSize);
    icon.composite(artwork, (item.size - artwork.bitmap.width) / 2, (item.size - artwork.bitmap.height) / 2);
    await icon.writeAsync(path.join(publicDir, item.name));
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }
}

generateIcons().then(() => console.log('All PWA icons generated successfully in public/'));
