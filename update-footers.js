const fs = require('fs');
const path = require('path');

const footerRoot = `<footer>
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand-col">
          <div class="footer-brand-info">
            <div class="footer-logo">Somos <span>Hispanidad</span></div>
            <p class="footer-desc">Ciudadanos comprometidos con rescatar la verdad histórica del imperio español y
              promover los lazos culturales entre España y el mundo hispano a través de la investigación y la difusión.
            </p>
            <div class="social-row">
              <a href="https://www.youtube.com/@SomosHispanidadTorrelodones" target="_blank" class="social-icon social-icon-yt"
                aria-label="Nuestro canal de Youtube">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span class="social-yt-label">Nuestro canal de Youtube</span>
              </a>
            </div>
          </div>
          <div class="footer-qr-container">
            <div class="footer-qr-card">
              <img id="footer-qr"
                src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Fsomoshispanidad.es%2F&color=2c1a0e&bgcolor=faf6f0"
                alt="Código QR" class="footer-qr-img" width="100" height="100">
            </div>
            <span class="footer-qr-label">Compartir web</span>
          </div>
        </div>
        <div>
          <p class="footer-col-title">Navegación</p>
          <ul class="footer-links">
            <li><a href="index.html">Inicio</a></li>
            <li><a href="src/pages/asociacion.html">La Asociación</a></li>
            <li><a href="src/pages/eventos.html">Eventos</a></li>
            <li><a href="src/pages/contenidos.html">Contenidos</a></li>
            <li><a href="src/pages/autores.html">Autores</a></li>
            <li><a href="src/pages/contacto.html">Contacto</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Recursos</p>
          <ul class="footer-links">
            <li><a href="src/pages/contenidos.html">Contenidos</a></li>
            <li><a href="src/pages/eventos.html">Próximos Eventos</a></li>
            <li><a href="mailto:contacto@somoshispanidad.es">Contacto</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">© 2026 Somos Hispanidad · Todos los derechos reservados</p>
        <a href="src/pages/privacidad.html" class="footer-legal">Política de Privacidad</a>
      </div>
    </div>
  </footer>`;

const footerInner = `<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand-col">
        <div class="footer-brand-info">
          <div class="footer-logo">Somos <span>Hispanidad</span></div>
          <p class="footer-desc">Ciudadanos comprometidos con rescatar la verdad histórica del imperio español y promover los lazos culturales entre España y el mundo hispano a través de la investigación y la difusión.</p>
          <div class="social-row">
            <a href="https://www.youtube.com/@SomosHispanidadTorrelodones" target="_blank" class="social-icon social-icon-yt" aria-label="Nuestro canal de Youtube">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span class="social-yt-label">Nuestro canal de Youtube</span>
            </a>
          </div>
        </div>
        <div class="footer-qr-container">
          <div class="footer-qr-card">
            <img id="footer-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Fsomoshispanidad.es%2F&color=2c1a0e&bgcolor=faf6f0" alt="Código QR" class="footer-qr-img" width="100" height="100">
          </div>
          <span class="footer-qr-label">Compartir web</span>
        </div>
      </div>
      <div>
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
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Somos Hispanidad · Todos los derechos reservados</p>
      <a href="privacidad.html" class="footer-legal">Política de Privacidad</a>
    </div>
  </div>
</footer>`;

const footerLanding = footerRoot.replace('index.html', '#inicio')
  .replace('src/pages/asociacion.html', '#quienes-somos')
  .replace('src/pages/eventos.html', '#eventos')
  .replace('src/pages/contenidos.html', '#contenidos')
  .replace('src/pages/autores.html', '#')
  .replace('src/pages/contacto.html', '#contacto')
  .replace('href="src/pages/privacidad.html"', 'href="https://www.somoshispanidad.es/_files/ugd/c4fe9a_d60b3c057b984740bd2023525d8cef3b.docx" target="_blank"');

function replaceFooter(filePath, footerHTML) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/<footer>[\s\S]*?<\/footer>/i, footerHTML);
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

// Update Inner Pages
const innerFiles = ['asociacion.html', 'autores.html', 'contacto.html', 'contenidos.html', 'eventos.html', 'privacidad.html'];
innerFiles.forEach(file => {
  replaceFooter(path.join(__dirname, 'src', 'pages', file), footerInner);
});

// Update root pages
replaceFooter(path.join(__dirname, 'index.html'), footerRoot);
// For the old landing page
replaceFooter(path.join(__dirname, 'somoshispanidad-landing.html'), footerLanding);
