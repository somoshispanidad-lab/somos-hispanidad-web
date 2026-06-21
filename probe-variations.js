const http = require('https');

const variations = [];
const baseNames = ['16.05.08', '16.05.10', '16.05.15'];
const suffixes = ['', ' (1)', ' (2)', ' (3)', ' (4)'];
const extensions = ['.jpeg', '.jpg', '.png'];

for (const name of baseNames) {
  for (const suffix of suffixes) {
    for (const ext of extensions) {
      variations.push(`WhatsApp Image 2026-06-20 at ${name}${suffix}${ext}`);
    }
  }
}

async function checkFile(fileName) {
  const url = `https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/${encodeURIComponent(fileName)}`;
  return new Promise((resolve) => {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`FOUND: ${fileName}`);
        resolve(fileName);
      } else {
        resolve(null);
      }
    }).on('error', () => resolve(null));
  });
}

async function run() {
  console.log(`Checking ${variations.length} variations...`);
  const found = [];
  for (const variation of variations) {
    const res = await checkFile(variation);
    if (res) found.push(res);
  }
  console.log('Done! Found:', found);
}

run();
