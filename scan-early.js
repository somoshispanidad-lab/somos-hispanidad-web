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
        console.log(`FOUND EARLY: ${name}`);
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
  console.log('Generating scan list for early morning...');
  const times = [];
  for (let h = 8; h < 10; h++) {
    for (let m = 0; m < 60; m++) {
      for (let s = 0; s < 60; s++) {
        times.push(formatTime(h, m, s));
      }
    }
  }

  console.log(`Scanning ${times.length} times for early morning...`);
  const batchSize = 300;
  const found = [];
  
  for (let i = 0; i < times.length; i += batchSize) {
    const batch = times.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(checkFile));
    for (const res of results) {
      if (res) found.push(res);
    }
  }
  
  console.log('Scan completed!');
  console.log('Found early:', found);
  process.exit(0);
}

run();
