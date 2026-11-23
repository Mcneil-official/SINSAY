const https = require('https');
const fs = require('fs');

const RESORTS = [
  {
    name: 'Camp Netanya Resort & Spa',
    slug: 'camp-netanya',
    fb: 'https://www.facebook.com/campnetanya',
    phone: '0927 895 4092',
    website: 'http://campnetanya.com.ph/'
  },
  {
    name: 'Eagle Point Beach and Dive Resort',
    slug: 'eagle-point',
    fb: 'https://www.facebook.com/eaglepointbeachanddiveresort',
    phone: '0917 846 3958',
    website: 'http://www.eaglepointresort.com.ph/'
  },
  {
    name: 'Altamare Dive & Leisure Resort Anilao',
    slug: 'altamare',
    fb: 'https://www.facebook.com/altamareresort',
    phone: '0916 691 9222',
    website: 'http://www.altamare.com.ph/'
  },
  {
    name: 'Aquaventure Reef Club',
    slug: 'aquaventure',
    fb: 'https://www.facebook.com/aquaventurereefclub',
    phone: '0939 924 6488',
    website: 'https://www.aqua-venture.com/'
  },
  {
    name: 'Aiyanar Beach and Dive Resort',
    slug: 'aiyanar',
    fb: 'https://www.facebook.com/AiyanarAnilao',
    phone: '0917 883 1428',
    website: 'http://www.aiyanar.com/'
  },
  {
    name: 'Solitude Acacia Resort',
    slug: 'solitude-acacia',
    fb: 'https://www.facebook.com/SolitudeAcacia',
    phone: '0966 200 2941',
    website: 'https://solitude.world/'
  },
  {
    name: 'Planet Dive Resort',
    slug: 'planet-dive',
    fb: 'https://www.facebook.com/planetdiveresort',
    phone: '0916 704 3718',
    website: 'http://planetdive.com.ph/'
  },
  {
    name: 'The Philip Ann Resort',
    slug: 'philip-ann',
    fb: 'https://www.facebook.com/1pjhphilipannresort',
    phone: '0915 933 5633',
    website: 'https://www.thephilipannresort.com/'
  },
  {
    name: 'Bentrina Diving Resort',
    slug: 'bentrina',
    fb: 'https://www.facebook.com/bentrinaresort',
    phone: '0976 363 2424',
    website: 'https://www.bentrina.com/'
  },
  {
    name: 'Amor Laut',
    slug: 'amor-laut',
    fb: 'https://www.facebook.com/amorlautresort',
    phone: '0917 108 7451',
    website: 'https://www.amorlautresort.com/'
  },
  {
    name: 'Saltitude Dive & Beach Resort',
    slug: 'saltitude',
    fb: 'https://www.facebook.com/profile.php?id=100063830172974',
    phone: '0917 109 8812',
    website: null
  },
  {
    name: 'Paradiso Rito',
    slug: 'paradiso-rito',
    fb: 'https://www.facebook.com/ParadisoRito',
    phone: '0928 420 5438',
    website: 'https://paradisorito.com/'
  },
  {
    name: 'Vivere Azure',
    slug: 'vivere-azure',
    fb: 'https://www.facebook.com/vivere.azure',
    phone: '+63 2 8771 7777',
    website: 'https://vivereazure.com/'
  },
  {
    name: 'Pier Uno Dive Resort',
    slug: 'pier-uno',
    fb: 'https://www.facebook.com/pierunodiveresort.ph',
    phone: '0917 808 1877',
    website: 'https://pierunodiveresort.com/'
  },
  {
    name: "Arthur's Place Dive Resort",
    slug: 'arthurs-place',
    fb: 'https://www.facebook.com/arthursplacediveresort',
    phone: '0917 777 9341',
    website: 'https://www.arthursplacediveresort.com/'
  },
  {
    name: 'Sea Spring Resort',
    slug: 'sea-spring',
    fb: 'https://www.facebook.com/seasspring',
    phone: '0917 564 8085',
    website: null
  },
  {
    name: 'Blue Ribbon Dive Resort',
    slug: 'blue-ribbon',
    fb: 'https://www.facebook.com/Blueribbonphilippines',
    phone: '+63 917 893 2719',
    website: 'https://blueribbondivers.com/'
  }
];

function fetchUrl(url) {
  return new Promise((resolve) => {
    try {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', () => resolve(''));
    } catch {
      resolve('');
    }
  });
}

function checkStatus(url) {
  return new Promise((resolve) => {
    try {
      https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        resolve(res.statusCode);
      }).on('error', () => resolve(500)).end();
    } catch {
      resolve(500);
    }
  });
}

(async () => {
  const results = [];
  for (const r of RESORTS) {
    const html = await fetchUrl(r.fb);
    const ogMatch = html.match(/property="og:image" content="([^"]+)"/);
    const og = ogMatch ? ogMatch[1].replace(/&amp;/g, '&') : null;
    
    // Find all scontent links
    const allScontent = [...html.matchAll(/(https:\\?\/\\?\/scontent[^\s"'>\\]+)/g)]
      .map(m => m[1].replace(/\\\//g, '/').replace(/&amp;/g, '&'))
      .filter(u => u.includes('oe='));
    
    const unique = [...new Set(allScontent)];
    
    let validOg = null;
    if (og) {
      const code = await checkStatus(og);
      if (code >= 200 && code < 300) {
        validOg = og;
      }
    }
    
    // Find a valid logo / secondary image if available
    let validLogo = null;
    for (const u of unique) {
      if (u !== validOg) {
        const code = await checkStatus(u);
        if (code >= 200 && code < 300) {
          validLogo = u;
          break;
        }
      }
    }

    results.push({
      ...r,
      freshOg: validOg,
      freshLogo: validLogo,
      allValidCount: unique.length
    });
    console.log(`Checked [${r.name}] -> OG status: ${validOg ? 'OK 200' : 'NONE'}, Logo: ${validLogo ? 'OK 200' : 'NONE'}`);
  }

  fs.writeFileSync('scratch/fresh-resorts-data.json', JSON.stringify(results, null, 2));
  console.log('Saved scratch/fresh-resorts-data.json');
})();
