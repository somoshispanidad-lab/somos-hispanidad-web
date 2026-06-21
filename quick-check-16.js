const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const date = '2026-06-20';

function formatTime(h, m, s) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}.${mm}.${ss}`;
}

async function checkFile(timeStr) {
  const name = `WhatsApp Image ${date} at ${timeStr}.jpeg`;
  const url = base + encodeURIComponent(name);
  return new Promise((resolve) => {
    const req = http.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200) {
        console.log(`FOUND: ${name}`);
        resolve(name);
      } else {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function run() {
  const times = [];
  // Check from 16:30:00 to 16:59:59
  for (let m = 30; m < 60; m++) {
    for (let s = 0; s < 60; s++) {
      times.push(formatTime(16, m, s));
    }
  }

  console.log(`Checking ${times.length} times in hour 16:30-17:00...`);
  const batchSize = 100;
  const found = [];
  
  for (let i = 0; i < times.length; i += batchSize) {
    const batch = times.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(checkFile));
    for (const res of results) {
      if (res) found.push(res);
    }
  }
  console.log('Finished quick check 16! Found:', found);
}

run();
