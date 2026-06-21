const http = require('https');

const base = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';
const dates = ['2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'];
const times = ['16.05.08', '16.05.10', '16.05.15'];
const extensions = ['.jpeg', '.jpg', '.png', '.JPEG', '.JPG', '.PNG'];

async function checkFile(date, time, ext) {
  const name = `WhatsApp Image ${date} at ${time}${ext}`;
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
  console.log('Running probe-more.js...');
  const found = [];
  for (const date of dates) {
    for (const time of times) {
      for (const ext of extensions) {
        const res = await checkFile(date, time, ext);
        if (res) found.push(res);
      }
    }
  }
  console.log('Finished! Found:', found);
}

run();
