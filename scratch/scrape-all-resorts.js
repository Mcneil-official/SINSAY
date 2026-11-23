const https = require('https');
const fs = require('fs');
const path = require('path');

const RESORTS = [
  {
    name: 'Camp Netanya Resort & Spa',
    slug: 'camp-netanya',
    fb: 'https://www.facebook.com/campnetanya',
    websiteCover: 'https://campnetanya.com.ph/wp-content/uploads/2015/12/homepage-banner-13.jpg',
    websiteLogo: 'https://campnetanya.com.ph/wp-content/uploads/2020/01/Web-Logo.jpg'
  },
  {
    name: 'Eagle Point Beach and Dive Resort',
    slug: 'eagle-point',
    fb: 'https://www.facebook.com/eaglepointbeachanddiveresort'
  },
  {
    name: 'Altamare Dive & Leisure Resort Anilao',
    slug: 'altamare',
    fb: 'https://www.facebook.com/altamareresort'
  },
  {
    name: 'Aquaventure Reef Club',
    slug: 'aquaventure',
    fb: 'https://www.facebook.com/aquaventurereefclub'
  },
  {
    name: 'Aiyanar Beach and Dive Resort',
    slug: 'aiyanar',
    fb: 'https://www.facebook.com/AiyanarAnilao'
  },
  {
    name: 'Solitude Acacia Resort',
    slug: 'solitude-acacia',
    fb: 'https://www.facebook.com/SolitudeAcacia'
  },
  {
    name: 'Planet Dive Resort',
    slug: 'planet-dive',
    fb: 'https://www.facebook.com/planetdiveresort'
  },
  {
    name: 'The Philip Ann Resort',
    slug: 'philip-ann',
    fb: 'https://www.facebook.com/1pjhphilipannresort'
  },
  {
    name: 'Bentrina Diving Resort',
    slug: 'bentrina',
    fb: 'https://www.facebook.com/bentrinaresort'
  },
  {
    name: 'Amor Laut',
    slug: 'amor-laut',
    fb: 'https://www.facebook.com/amorlautresort'
  },
  {
    name: 'Saltitude Dive & Beach Resort',
    slug: 'saltitude',
    fb: 'https://www.facebook.com/profile.php?id=100063830172974'
  },
  {
    name: 'Paradiso Rito',
    slug: 'paradiso-rito',
    fb: 'https://www.facebook.com/ParadisoRito'
  },
  {
    name: 'Vivere Azure',
    slug: 'vivere-azure',
    fb: 'https://www.facebook.com/vivere.azure'
  },
  {
    name: 'Pier Uno Dive Resort',
    slug: 'pier-uno',
    fb: 'https://www.facebook.com/pierunodiveresort.ph'
  },
  {
    name: "Arthur's Place Dive Resort",
    slug: 'arthurs-place',
    fb: 'https://www.facebook.com/arthursplacediveresort'
  },
  {
    name: 'Sea Spring Resort',
    slug: 'sea-spring',
    fb: 'https://www.facebook.com/seasspring'
  },
  {
    name: 'Blue Ribbon Dive Resort',
    slug: 'blue-ribbon',
    fb: 'https://www.facebook.com/Blueribbonphilippines'
  }
];

async function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function extractImages(html) {
  const ogMatch = html.match(/property="og:image" content="([^"]+)"/);
  const og = ogMatch ? ogMatch[1].replace(/&amp;/g, '&') : null;
  
  // Find all scontent links in page
  const allScontent = [...html.matchAll(/(https:\\?\/\\?\/scontent[^\s"'>\\]+)/g)]
    .map(m => m[1].replace(/\\\//g, '/').replace(/&amp;/g, '&'))
    .filter(u => u.includes('oe='));
  
  return { og, allScontent: [...new Set(allScontent)] };
}

(async () => {
  for (const r of RESORTS) {
    const html = await fetchPage(r.fb);
    const { og, allScontent } = extractImages(html);
    console.log(`[${r.name}] OG: ${og ? 'YES' : 'NO'}, Scontent count: ${allScontent.length}`);
  }
})();
