const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const times = ['16.05.10', '16.05.15'];
const formats = [
  (t) => `WhatsApp Image 2026-06-20 at ${t}.jpeg`,
  (t) => `WhatsApp Image 2026-06-20 at ${t}.jpg`,
  (t) => `WhatsApp Image 2026-06-20 at ${t}.png`,
  (t) => `WhatsApp Image 2026-06-20 at ${t.replace(/\./g, ':')}.jpeg`,
  (t) => `WhatsApp Image 2026-06-20 at ${t.replace(/\./g, ':')}.jpg`,
  (t) => `WhatsApp Image 2026-06-20 at ${t.replace(/\./g, '-')}.jpeg`,
  (t) => `WhatsApp Image 2026-06-20 at ${t.replace(/\./g, '-')}.jpg`,
  (t) => `WhatsApp Image 2026-06-20 ${t}.jpeg`,
  (t) => `WhatsApp Image 2026-06-20 ${t}.jpg`
];

async function checkFile(name) {
  const url = base + encodeURIComponent(name);
  return new Promise((resolve) => {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`FOUND: ${name}`);
        resolve(name);
      } else {
        resolve(null);
      }
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const found = [];
  for (const t of times) {
    for (const fmt of formats) {
      const name = fmt(t);
      const res = await checkFile(name);
      if (res) found.push(res);
    }
  }
  console.log('Results:', found);
}

run();
