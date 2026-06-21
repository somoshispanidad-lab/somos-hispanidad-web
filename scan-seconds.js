const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const date = '2026-06-20';
const extensions = ['.jpeg', '.jpg', '.png', '.JPEG', '.JPG', '.PNG'];

function formatTime(h, m, s) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}.${mm}.${ss}`;
}

async function checkFile(timeStr, ext) {
  const name = `WhatsApp Image ${date} at ${timeStr}${ext}`;
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
  console.log('Generating scan list...');
  const tasks = [];
  
  // Scan from 16:00:00 to 16:15:00
  for (let m = 0; m <= 15; m++) {
    for (let s = 0; s < 60; s++) {
      const timeStr = formatTime(16, m, s);
      for (const ext of extensions) {
        tasks.push({ timeStr, ext });
      }
    }
  }

  console.log(`Scanning ${tasks.length} combinations...`);
  const batchSize = 100;
  const found = [];
  
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(t => checkFile(t.timeStr, t.ext)));
    for (const res of results) {
      if (res) found.push(res);
    }
  }
  
  console.log('Scan completed!');
  console.log('Found:', found);
}

run();
