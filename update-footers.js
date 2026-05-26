const fs = require('fs');
const path = require('path');

const targetFooter = `        <div>
          <p class="footer-col-title">Navegación</p>
          <ul class="footer-links">
            <li><a href="../../index.html">Inicio</a></li>
            <li><a href="asociacion.html">La Asociación</a></li>
            <li><a href="eventos.html">Eventos</a></li>
            <li><a href="contenidos.html">Contenidos</a></li>
            <li><a href="autores.html">Autores</a></li>
            <li><a href="contacto.html">Contacto</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Recursos</p>
          <ul class="footer-links">
            <li><a href="contenidos.html">Contenidos</a></li>
            <li><a href="eventos.html">Próximos Eventos</a></li>
            <li><a href="mailto:contacto@somoshispanidad.es">Contacto</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Más</p>
          <ul class="footer-links">
            <li><a href="https://protocolodesantapola.es/" target="_blank">Páginas Amigas</a></li>
            <li><a href="#" class="link-disabled">Lecturas recomendadas</a></li>
            <li><a href="#" class="link-disabled">Divulgadores</a></li>
          </ul>
        </div>`;

const htmlFiles = [
  'asociacion.html', 'autores.html', 'contacto.html', 
  'contenidos.html', 'eventos.html', 'privacidad.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the block starting with "Navegación" and ending right before "Legal"
  const navStart = content.indexOf('<div>\n        <p class="footer-col-title">Navegación</p>');
  if (navStart === -1) {
    const navStart2 = content.indexOf('<div>\n          <p class="footer-col-title">Navegación</p>');
  }
  
  // Because formatting could vary, I'll use a regex to replace everything between Navigation and Legal
  // Actually, wait, it's easier to replace the "Navegación" div entirely
  
  const regex = /<div>\s*<p class="footer-col-title">Navegación<\/p>[\s\S]*?(?=<div>\s*<p class="footer-col-title">Legal<\/p>)/;
  
  content = content.replace(regex, targetFooter + '\n      ');
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
});

// Update index.html and somoshispanidad-landing.html
const rootFiles = ['index.html', 'somoshispanidad-landing.html'];
rootFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/>Hispanistas<\/a>/g, '>Divulgadores</a>');
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
});
