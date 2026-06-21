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
    http.get(url, (res) => {
      console.log(`TIME: ${timeStr} -> Code: ${res.statusCode}`);
      resolve(res.statusCode === 200 ? timeStr : null);
    }).on('error', () => {
      resolve(null);
    });
  });
}

async function run() {
  const times = [];
  // Check from 16:05:00 to 16:06:00
  for (let s = 0; s < 60; s++) {
    times.push(formatTime(16, 5, s));
  }
  // Check from 16:06:00 to 16:10:00
  for (let m = 6; m <= 10; m++) {
    for (let s = 0; s < 60; s++) {
      times.push(formatTime(16, m, s));
    }
  }

  console.log(`Checking ${times.length} times around 16:05...`);
  const found = [];
  for (let i = 0; i < times.length; i += 10) {
    const batch = times.slice(i, i + 10);
    const results = await Promise.all(batch.map(checkUrl));
    for (const res of results) {
      if (res) found.push(res);
    }
  }
  console.log('Found:', found);
}

run();
