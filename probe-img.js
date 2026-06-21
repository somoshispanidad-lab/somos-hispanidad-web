const https = require('https');

const agent = new https.Agent({ keepAlive: true, maxSockets: 50 });
const baseUrl = 'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/';

async function checkUrl(filename) {
  return new Promise((resolve) => {
    const url = baseUrl + encodeURIComponent(filename);
    https.request(url, { method: 'HEAD', agent }, (res) => {
      res.resume();
      if (res.statusCode === 200) {
        resolve(filename);
      } else {
        resolve(null);
      }
    }).on('error', () => resolve(null)).end();
  });
}

async function run() {
  const promises = [];
  
  const specific = [
    'Cesar Perez Guevara.JPG', 'download.jpg', 'IMG_1979.JPG', 'Moctezuma.png',
    'Gemini_Generated_Image.jpeg', 'Gemini_Generated_Image (1).jpeg'
  ];
  for (const f of specific) {
    promises.push(checkUrl(f));
  }

  console.log(`Probing ${promises.length} possibilities...`);
  const results = await Promise.all(promises);
  const found = results.filter(r => r !== null);
  console.log('Found:', found);
}

run();
