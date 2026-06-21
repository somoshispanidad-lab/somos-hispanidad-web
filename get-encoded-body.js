const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const file = 'WhatsApp Image 2026-06-20 at 16.05.10.jpeg';
const url = base + encodeURIComponent(file);

http.get(url, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Body: ${data}`);
  });
});
