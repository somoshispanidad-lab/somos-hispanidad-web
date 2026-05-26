const fs = require('fs');
const path = require('path');

function addCacheBuster(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/href="(.*?)styles\.css(\?v=\d+)?"/g, 'href="$1styles.css?v=' + Date.now() + '"');
  content = content.replace(/src="(.*?)main\.js(\?v=\d+)?"/g, 'src="$1main.js?v=' + Date.now() + '"');
  fs.writeFileSync(filePath, content);
  console.log('Cache buster added to ' + filePath);
}

const innerFiles = ['asociacion.html', 'autores.html', 'contacto.html', 'contenidos.html', 'eventos.html', 'privacidad.html'];
innerFiles.forEach(file => addCacheBuster(path.join(__dirname, 'src', 'pages', file)));
addCacheBuster(path.join(__dirname, 'index.html'));
addCacheBuster(path.join(__dirname, 'somoshispanidad-landing.html'));
