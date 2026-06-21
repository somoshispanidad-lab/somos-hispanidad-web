const http = require('https');

const urls = [
  'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.10.JPEG',
  'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.10.JPG',
  'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.15.JPEG',
  'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.15.JPG'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.error(`Error for ${url}:`, err);
      resolve();
    });
  });
}

async function run() {
  for (const url of urls) {
    await checkUrl(url);
  }
}

run();
