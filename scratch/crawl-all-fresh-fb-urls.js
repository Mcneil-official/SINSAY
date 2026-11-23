const https = require('https');
const fs = require('fs');

const RESORTS = [
  {
    name: 'Camp Netanya Resort & Spa',
    match: '%Camp Netanya%',
    fb: 'https://www.facebook.com/campnetanya',
    phone: '0927 895 4092',
    website: 'http://campnetanya.com.ph/'
  },
  {
    name: 'Eagle Point Beach and Dive Resort',
    match: '%Eagle Point%',
    fb: 'https://www.facebook.com/eaglepointbeachanddiveresort',
    phone: '0917 846 3958',
    website: 'http://www.eaglepointresort.com.ph/'
  },
  {
    name: 'Altamare Dive & Leisure Resort Anilao',
    match: '%Altamare%',
    fb: 'https://www.facebook.com/altamareresort',
    phone: '0916 691 9222',
    website: 'http://www.altamare.com.ph/'
  },
  {
    name: 'Aquaventure Reef Club',
    match: '%Aquaventure%',
    fb: 'https://www.facebook.com/aquaventurereefclub',
    phone: '0939 924 6488',
    website: 'https://www.aqua-venture.com/'
  },
  {
    name: 'Aiyanar Beach and Dive Resort',
    match: '%Aiyanar%',
    fb: 'https://www.facebook.com/AiyanarAnilao',
    phone: '0917 883 1428',
    website: 'http://www.aiyanar.com/'
  },
  {
    name: 'Solitude Acacia Resort',
    match: '%Solitude Acacia%',
    fb: 'https://www.facebook.com/SolitudeAcacia',
    phone: '0966 200 2941',
    website: 'https://solitude.world/'
  },
  {
    name: 'Planet Dive Resort',
    match: '%Planet Dive%',
    fb: 'https://www.facebook.com/planetdiveresort',
    phone: '0916 704 3718',
    website: 'http://planetdive.com.ph/'
  },
  {
    name: 'The Philip Ann Resort',
    match: '%Philip Ann%',
    fb: 'https://www.facebook.com/1pjhphilipannresort',
    phone: '0915 933 5633',
    website: 'https://www.thephilipannresort.com/'
  },
  {
    name: 'Bentrina Diving Resort',
    match: '%Bentrina%',
    fb: 'https://www.facebook.com/bentrinaresort',
    phone: '0976 363 2424',
    website: 'https://www.bentrina.com/'
  },
  {
    name: 'Amor Laut',
    match: '%Amor Laut%',
    fb: 'https://www.facebook.com/amorlautresort',
    phone: '0917 108 7451',
    website: 'https://www.amorlautresort.com/'
  },
  {
    name: 'Saltitude Dive & Beach Resort',
    match: '%Saltitude%',
    fb: 'https://www.facebook.com/profile.php?id=100063830172974',
    altFb: 'https://www.facebook.com/SaltitudeDiveAndBeachResort',
    phone: '0917 109 8812',
    website: null
  },
  {
    name: 'Paradiso Rito',
    match: '%Paradiso Rito%',
    fb: 'https://www.facebook.com/ParadisoRito',
    phone: '0928 420 5438',
    website: 'https://paradisorito.com/'
  },
  {
    name: 'Vivere Azure',
    match: '%Vivere Azure%',
    fb: 'https://www.facebook.com/vivere.azure',
    phone: '+63 2 8771 7777',
    website: 'https://vivereazure.com/'
  },
  {
    name: 'Pier Uno Dive Resort',
    match: '%Pier Uno%',
    fb: 'https://www.facebook.com/pierunodiveresort.ph',
    phone: '0917 808 1877',
    website: 'https://pierunodiveresort.com/'
  },
  {
    name: "Arthur's Place Dive Resort",
    match: '%Arthur%',
    fb: 'https://www.facebook.com/arthursplacediveresort',
    phone: '0917 777 9341',
    website: 'https://www.arthursplacediveresort.com/'
  },
  {
    name: 'Sea Spring Resort',
    match: '%Sea Spring%',
    fb: 'https://www.facebook.com/seasspring',
    phone: '0917 564 8085',
    website: null
  },
  {
    name: 'Blue Ribbon Dive Resort',
    match: '%Blue Ribbon%',
    fb: 'https://www.facebook.com/Blueribbonphilippines',
    phone: '+63 917 893 2719',
    website: 'https://blueribbondivers.com/'
  }
];

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function verifyImage(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request({
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Range': 'bytes=0-10'
        }
      }, (res) => {
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300 });
      });
      req.on('error', () => resolve({ status: 'ERR', ok: false }));
      req.setTimeout(4000, () => { req.destroy(); resolve({ status: 'TIMEOUT', ok: false }); });
      req.end();
    } catch {
      resolve({ status: 'INVALID', ok: false });
    }
  });
}

(async () => {
  const verified = [];
  for (const r of RESORTS) {
    let data = await fetchPage(r.fb);
    let ogMatch = data.match(/property="og:image"\s+content="([^"]+)"/i) || data.match(/content="([^"]+)"\s+property="og:image"/i);
    if (!ogMatch && r.altFb) {
      data = await fetchPage(r.altFb);
      ogMatch = data.match(/property="og:image"\s+content="([^"]+)"/i) || data.match(/content="([^"]+)"\s+property="og:image"/i);
    }
    
    let freshUrl = ogMatch ? ogMatch[1].replace(/&amp;/g, '&') : null;
    let check = freshUrl ? await verifyImage(freshUrl) : { status: 'NONE', ok: false };
    
    console.log(`[${check.status}] ${r.name}: ${check.ok ? 'VERIFIED' : 'FAILED'}`);
    verified.push({
      ...r,
      freshUrl: check.ok ? freshUrl : null,
      status: check.status
    });
  }

  fs.writeFileSync('scratch/crawled-fresh-urls.json', JSON.stringify(verified, null, 2));
  console.log('Saved scratch/crawled-fresh-urls.json');
})();
