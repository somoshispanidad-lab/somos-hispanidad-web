const https = require('https');

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 150,
  keepAliveMsecs: 10000
});

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';

function formatTime(h, m, s) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}.${mm}.${ss}`;
}

function checkFile(dateStr, timeStr) {
  const name = `WhatsApp Image ${dateStr} at ${timeStr}.jpeg`;
  const url = base + encodeURIComponent(name);
  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'HEAD',
      agent: agent,
      timeout: 5000
    }, (res) => {
      res.resume();
      if (res.statusCode === 200) {
        console.log(`FOUND EXTRA: ${name}`);
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
  console.log('Generating extra times list...');
  const tasks = [];

  // 1. June 20: 00:00:00 to 07:59:59
  for (let h = 0; h < 8; h++) {
    for (let m = 0; m < 60; m++) {
      for (let s = 0; s < 60; s++) {
        tasks.push({ date: '2026-06-20', time: formatTime(h, m, s) });
      }
    }
  }

  // 2. June 20: 23:00:00 to 23:59:59
  for (let m = 0; m < 60; m++) {
    for (let s = 0; s < 60; s++) {
      tasks.push({ date: '2026-06-20', time: formatTime(23, m, s) });
    }
  }

  // 3. June 21: 00:00:00 to 13:00:00
  for (let h = 0; h <= 13; h++) {
    for (let m = 0; m < 60; m++) {
      for (let s = 0; s < 60; s++) {
        tasks.push({ date: '2026-06-21', time: formatTime(h, m, s) });
      }
    }
  }

  console.log(`Scanning ${tasks.length} combinations in background...`);
  const batchSize = 150;
  const found = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(t => checkFile(t.date, t.time)));
    for (const res of results) {
      if (res) found.push(res);
    }
    if (i % 5000 === 0 && i > 0) {
      console.log(`Probed ${i} / ${tasks.length}... Found so far:`, found);
    }
  }

  console.log('Extra scans completed!');
  console.log('Extra found files:', found);
}

run();
