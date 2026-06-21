const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const files = [
  'WhatsApp Image 2026-06-20 at 16.05.08.jpeg',
  'WhatsApp Image 2026-06-20 at 16.05.10.jpeg',
  'WhatsApp Image 2026-06-20 at 16.05.15.jpeg'
];

async function checkUrl(file) {
  const url = base + encodeURIComponent(file);
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`FILE: ${file} -> Status: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.error(`Error for ${file}:`, err);
      resolve();
    });
  });
}

async function run() {
  for (const file of files) {
    await checkUrl(file);
  }
}

run();
