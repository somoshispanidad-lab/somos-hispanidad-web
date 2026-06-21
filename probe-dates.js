const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const dates = ['2026-06-20', '2026-06-21'];
const times = ['16.05.08', '16.05.10', '16.05.15'];

async function checkFile(date, time) {
  const name = `WhatsApp Image ${date} at ${time}.jpeg`;
  const url = base + encodeURIComponent(name);
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`CHECK: ${name} -> Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        resolve(name);
      } else {
        resolve(null);
      }
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const found = [];
  for (const date of dates) {
    for (const time of times) {
      const res = await checkFile(date, time);
      if (res) found.push(res);
    }
  }
  console.log('Found:', found);
}

run();
