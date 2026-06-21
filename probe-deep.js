const https = require('https');

const agent = new https.Agent({ keepAlive: true, maxSockets: 200 });
const baseUrl = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';

async function checkUrl(filename) {
  return new Promise((resolve) => {
    const url = baseUrl + encodeURIComponent(filename);
    const req = https.request(url, { method: 'HEAD', agent }, (res) => {
      res.resume();
      if (res.statusCode === 200) resolve(filename);
      else resolve(null);
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function run() {
  const promises = [];
  const exts = ['.jpeg', '.JPG', '.jpg', '.png', '.HEIC', '.heic'];
  
  // Ranges
  for (let i = 6000; i <= 6050; i++) {
    for (const ext of exts) promises.push(checkUrl(`IMG_${i}${ext}`));
  }
  for (let i = 1900; i <= 2100; i++) {
    for (const ext of exts) promises.push(checkUrl(`IMG_${i}${ext}`));
  }
  for (let i = 2000; i <= 2099; i++) {
    for (const ext of exts) promises.push(checkUrl(`IMG_${i}${ext}`));
  }
  
  // Let's also check other possible prefixes like WhatsApp again
  const specific = [
    'WhatsApp Image 2026-06-20 at 16.05.08.jpeg',
    'WhatsApp Image 2026-06-20 at 16.05.09.jpeg',
    'WhatsApp Image 2026-06-20 at 16.05.10.jpeg',
    'WhatsApp Image 2026-06-20 at 16.05.10 (1).jpeg',
    'WhatsApp Image 2026-06-20 at 16.05.11.jpeg'
  ];
  for (const f of specific) promises.push(checkUrl(f));

  console.log(`Probing ${promises.length} files in Fotos/El Escorial/...`);
  const results = await Promise.all(promises);
  const found = results.filter(Boolean);
  
  // remove duplicates
  const unique = [...new Set(found)];
  console.log('Found ' + unique.length + ' files:');
  console.log(unique);
}

run();
