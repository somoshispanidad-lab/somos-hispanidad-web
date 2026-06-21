const https = require('https');

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 150,
  keepAliveMsecs: 10000
});

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const date = '2026-06-20';

function formatTime(h, m, s) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}.${mm}.${ss}`;
}

function checkFile(timeStr) {
  const name = `WhatsApp Image ${date} at ${timeStr}.jpeg`;
  const url = base + encodeURIComponent(name);
  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'HEAD',
      agent: agent,
      timeout: 5000
    }, (res) => {
      res.resume(); // Free the socket back to the keep-alive pool!
      if (res.statusCode === 200) {
        console.log(`FOUND: ${name}`);
        resolve(name);
      } else {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

async function run() {
  console.log('Generating times list...');
  const times = [];
  // Scan from 08:00:00 to 22:59:59 (15 hours)
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m++) {
      for (let s = 0; s < 60; s++) {
        times.push(formatTime(h, m, s));
      }
    }
  }
  
  console.log(`Scanning ${times.length} times on ${date} with keepAlive agent...`);
  const batchSize = 150;
  const found = [];
  
  for (let i = 0; i < times.length; i += batchSize) {
    const batch = times.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(checkFile));
    for (const res of results) {
      if (res) found.push(res);
    }
    if (i % 3000 === 0 && i > 0) {
      console.log(`Probed ${i} / ${times.length}... Found so far:`, found);
    }
  }
  
  console.log('All scans completed!');
  console.log('All found files:', found);
}

run();
