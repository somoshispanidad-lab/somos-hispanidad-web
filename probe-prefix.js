const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const prefixes = [
  'WhatsApp Image 2026-06-20 at ',
  'WhatsApp Image 2026-06-21 at ',
  'WhatsApp Image 2026-06-19 at ',
  'WhatsApp Image 2026-06-20 ',
  'WhatsApp Image 2026-06-21 ',
  'WhatsApp Image 2026-06-20 at 16.05.',
  'WhatsApp Image 2026-06-21 at 16.05.',
  'Image 2026-06-20 at ',
  'Image 2026-06-21 at ',
  'WhatsApp Image ',
  'IMG_',
  'DSC_',
  'El Escorial ',
  'Escorial ',
  'foto_',
  'foto',
  'image',
  'img',
  ''
];
const times = ['16.05.10', '16.05.15', '10', '15'];
const extensions = ['.jpeg', '.jpg', '.png', '.JPEG', '.JPG', '.PNG'];

async function checkFile(prefix, time, ext) {
  const name = `${prefix}${time}${ext}`;
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
  console.log('Running probe-prefix.js...');
  const found = [];
  for (const prefix of prefixes) {
    for (const time of times) {
      for (const ext of extensions) {
        const res = await checkFile(prefix, time, ext);
        if (res) found.push(res);
      }
    }
  }
  console.log('Finished! Found:', found);
}

run();
