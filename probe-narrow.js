const http = require('https');

const baseUrl = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%20';

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
  console.log('Generating narrow probe list...');
  const times = [];
  
  // Let's probe from 15:30:00 to 16:30:00 (1 hour around the known photo at 16:05:08)
  for (let h = 15; h <= 16; h++) {
    for (let m = 0; m < 60; m++) {
      if (h === 15 && m < 30) continue;
      if (h === 16 && m > 30) continue;
      for (let s = 0; s < 60; s++) {
        times.push(formatTime(h, m, s));
      }
    }
  }
  
  console.log(`Narrow probe: checking ${times.length} URLs...`);

  const batchSize = 50;
  const found = [];

  for (let i = 0; i < times.length; i += batchSize) {
    const batch = times.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(checkUrl));
    for (const res of results) {
      if (res) {
        console.log(`Found: ${res}`);
        found.push(res);
      }
    }
  }

  console.log('Narrow probe completed!');
  console.log('Found:', found);
}

run();
