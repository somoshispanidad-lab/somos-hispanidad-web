const http = require('https');

const baseUrl = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%20';

// We want to probe from 10:00:00 to 19:00:00
// Filename format: WhatsApp Image 2026-06-20 at HH.MM.SS.jpeg
// Example: WhatsApp Image 2026-06-20 at 16.05.08.jpeg

function formatTime(h, m, s) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}.${mm}.${ss}.jpeg`;
}

async function checkUrl(timeStr) {
  return new Promise((resolve) => {
    const url = baseUrl + encodeURIComponent(timeStr);
    const req = http.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200) {
        resolve(timeStr);
      } else {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function run() {
  console.log('Generating probe list...');
  const times = [];
  // Probe from 10:00:00 to 19:00:00
  for (let h = 10; h <= 19; h++) {
    for (let m = 0; m < 60; m++) {
      for (let s = 0; s < 60; s++) {
        times.push(formatTime(h, m, s));
      }
    }
  }
  console.log(`Total URLs to probe: ${times.length}`);

  const batchSize = 300;
  const found = [];

  for (let i = 0; i < times.length; i += batchSize) {
    const batch = times.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(checkUrl));
    for (const res of results) {
      if (res) {
        console.log(`Found file: ${res}`);
        found.push(res);
      }
    }
    if (i % 3000 === 0 && i > 0) {
      console.log(`Probed ${i} / ${times.length} URLs...`);
    }
  }

  console.log('Scan completed!');
  console.log('Found files:', found);
}

run();
