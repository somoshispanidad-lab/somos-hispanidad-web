const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const times = ['16.05.10', '16.05.15'];
const extensions = ['.jpeg', '.jpg', '.png', '.JPEG', '.JPG', '.PNG'];

async function checkFile(dateStr, timeStr, ext) {
  const name = `WhatsApp Image ${dateStr} at ${timeStr}${ext}`;
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
  console.log('Generating scan list for June...');
  const tasks = [];
  
  // Scan all days of June 2026 from 01 to 21
  for (let day = 1; day <= 21; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-06-${dayStr}`;
    for (const timeStr of times) {
      for (const ext of extensions) {
        tasks.push({ dateStr, timeStr, ext });
      }
    }
  }

  console.log(`Scanning ${tasks.length} combinations for June...`);
  const batchSize = 50;
  const found = [];
  
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(t => checkFile(t.dateStr, t.timeStr, t.ext)));
    for (const res of results) {
      if (res) found.push(res);
    }
  }
  
  console.log('June Scan completed!');
  console.log('Found:', found);
}

run();
