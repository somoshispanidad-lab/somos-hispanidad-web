/*
 * =====================================================
 * SOMOS HISPANIDAD — JavaScript Principal
 * Archivo: src/js/main.js
 *
 * Funciones compartidas en todas las páginas:
 * - navegación con scroll
 * - menú hamburguesa móvil
 * - animaciones de entrada (reveal)
 * - botón volver arriba
 * =====================================================
 */

document.addEventListener('DOMContentLoaded', function () {

  // ── EFECTO DE SCROLL EN LA NAVEGACIÓN ────────────────
  const navbar = document.getElementById('navbar');
  const backTop = document.getElementById('backTop');

  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 40);
    if (backTop) backTop.classList.toggle('visible', y > 400);

    // Resaltar enlace activo en el menú (solo para páginas con secciones)
    destacarNavActivo();
  });


  // ── MENÚ HAMBURGUESA (MÓVIL) ─────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
  }


  // ── ANIMACIÓN DE ENTRADA (REVEAL ON SCROLL) ───────────
  // Los elementos con clase "reveal" aparecen suavemente
  // cuando entran en el viewport (área visible de la pantalla)
  activarReveal();


  // ── MARCAR PÁGINA ACTIVA EN EL MENÚ ──────────────────
  marcarPaginaActiva();


  // ── GENERAR CÓDIGO QR DINÁMICO EN EL FOOTER ───────────
  const qrImg = document.getElementById('footer-qr');
  if (qrImg) {
    const currentUrl = encodeURIComponent(window.location.href);
    // Usamos el color de fondo var(--warm-white) #faf6f0 y color de código var(--ink) #2c1a0e
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentUrl}&color=2c1a0e&bgcolor=faf6f0`;
  }

});


// ── FUNCIÓN GLOBAL: activar animaciones reveal ────────────
// Se llama también desde eventos.js y contenidos.js
// cuando generan tarjetas dinámicamente
function activarReveal() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  if (reveals.length === 0) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(function (el) { observer.observe(el); });
}


// ── FUNCIÓN: cerrar menú móvil ────────────────────────────
// Se llama desde los enlaces del menú móvil con onclick=""
function closeMobile() {
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) mobileMenu.classList.remove('open');
}


// ── FUNCIÓN: destacar enlace de nav activo (one-page) ─────
function destacarNavActivo() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (sections.length === 0 || navLinks.length === 0) return;

  let current = '';
  sections.forEach(function (s) {
    if (window.scrollY >= s.offsetTop - 80) current = s.id;
  });

  navLinks.forEach(function (a) {
    const href = a.getAttribute('href');
    a.style.color = (href === '#' + current) ? 'var(--sepia-dark)' : '';
  });
}


// ── FUNCIÓN: marcar página actual en el menú multipage ────
function marcarPaginaActiva() {
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  navLinks.forEach(function (a) {
    const href = a.getAttribute('href');
    if (!href) return;

    // Comprueba si el href termina igual que el path actual
    if (path.endsWith(href) || (path === '/' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── INJECT VERCEL WEB ANALYTICS ──────────────────────
(function injectVercelAnalytics() {
  if (window.va) return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
})();

// ── CARGA DINÁMICA DE LA SECCIÓN "DE INTERÉS" Y VISITAS ───────
document.addEventListener('DOMContentLoaded', async function () {
  const deInteresSection = document.getElementById('de-interes');
  
  if (deInteresSection) {
    // Control de pestañas/tabs
    const tabs = deInteresSection.querySelectorAll('.btn-interes-tab');
    const panels = deInteresSection.querySelectorAll('.interes-tab-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const targetId = 'tab-' + tab.getAttribute('data-tab');
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    // Cargar enlaces desde Supabase
    try {
      if (typeof supabaseClient !== 'undefined') {
        const { data, error } = await supabaseClient
          .from('settings')
          .select('*')
          .in('key', ['lecturas_recomendadas', 'paginas_amigas', 'divulgadores']);
          
        if (error) throw error;
        
        const settingsMap = {};
        data?.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        
        const parseLinks = (val, def) => {
          if (!val) return def;
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            if (val.startsWith('http')) return [{ title: 'Enlace', url: val }];
          }
          return def;
        };

        const lecturas = parseLinks(settingsMap['lecturas_recomendadas'], [{ title: 'Protocolo de Santa Pola', url: 'https://protocolodesantapola.es/' }]);
        const paginas = parseLinks(settingsMap['paginas_amigas'], [{ title: 'Protocolo de Santa Pola', url: 'https://protocolodesantapola.es/' }]);
        const divulgadores = parseLinks(settingsMap['divulgadores'], [{ title: 'Somos Hispanidad Torrelodones', url: 'https://www.youtube.com/@SomosHispanidadTorrelodones' }]);

        renderList('list-lecturas', lecturas);
        renderList('list-paginas', paginas);
        renderList('list-divulgadores', divulgadores);
      } else {
        throw new Error('supabaseClient is not defined');
      }
    } catch (err) {
      console.warn('⚠ Error cargando enlaces de la sección De Interés:', err.message);
      // Fallbacks
      renderList('list-lecturas', [{ title: 'Protocolo de Santa Pola', url: 'https://protocolodesantapola.es/' }]);
      renderList('list-paginas', [{ title: 'Protocolo de Santa Pola', url: 'https://protocolodesantapola.es/' }]);
      renderList('list-divulgadores', [{ title: 'Somos Hispanidad Torrelodones', url: 'https://www.youtube.com/@SomosHispanidadTorrelodones' }]);
    }
  }

  function renderList(id, links) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!links || links.length === 0) {
      el.innerHTML = '<li class="interes-link-item empty">No hay enlaces disponibles.</li>';
      return;
    }
    el.innerHTML = links.map(l => `
      <li class="interes-link-item">
        <a href="${l.url}" target="_blank" rel="noopener" class="interes-link-anchor">
          <span class="interes-link-icon">✦</span>
          <span class="interes-link-text">${l.title}</span>
          <span class="interes-link-arrow">→</span>
        </a>
      </li>
    `).join('');
  }

  // ── REGISTRAR VISITA EN SUPABASE (DATOS REALES) ──────
  if (typeof supabaseClient !== 'undefined') {
    (async function registrarVisita() {
      try {
        let country = 'España';
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.country_name) country = geoData.country_name;
          }
        } catch (e) {
          // Fallback silencioso
        }

        const path = window.location.pathname;
        const referrer = document.referrer ? new URL(document.referrer).hostname : 'Directo';

        await supabaseClient
          .from('page_views')
          .insert([{ page_path: path, referrer: referrer, country: country }]);
        console.log('📊 Visita registrada en Supabase:', path, country);
      } catch (err) {
        console.warn('⚠ Error registrando visita:', err.message);
      }
    })();
  }

  // ── REPRODUCTOR DE VÍDEO EL ESCORIAL ───────────────────
  const fotosEscorial = [
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.08.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.09.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.10%20(1).jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.10.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/WhatsApp%20Image%202026-06-20%20at%2016.05.11.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_2058.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6003.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6004.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6006.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6007.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6008.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6009.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6010.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6013.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6014.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6015.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6016.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6017.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6018.jpeg',
    'https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Fotos/El%20Escorial/IMG_6019.jpeg'
  ];
  const btnEscorial = document.getElementById('btn-escorial-video');
  const modalEscorial = document.getElementById('escorial-video-modal');
  
  if (btnEscorial && modalEscorial) {
    const btnClose = modalEscorial.querySelector('.video-modal-close');
    const btnPlayPause = modalEscorial.querySelector('.video-play-pause');
    const iconPlay = modalEscorial.querySelector('.icon-play');
    const iconPause = modalEscorial.querySelector('.icon-pause');
    const progressBarFill = modalEscorial.querySelector('.video-progress-fill');
    const timeIndicator = modalEscorial.querySelector('.video-time-indicator');
    const slides = modalEscorial.querySelectorAll('.video-slide');
    
    let currentSlide = 0;
    let isPlaying = false;
    let progressTimer = null;
    let slideStartTime = 0;
    let timeElapsedInSlide = 0;
    const defaultDuration = 7000;
    
    function updateProgress() {
      if (!isPlaying) return;
      const now = Date.now();
      const dt = now - slideStartTime;
      const totalElapsed = timeElapsedInSlide + dt;
      let percent = (totalElapsed / defaultDuration) * 100;
      if (percent > 100) percent = 100;
      
      const totalDuration = slides.length * defaultDuration;
      const globalElapsed = (currentSlide * defaultDuration) + totalElapsed;
      const globalPercent = (globalElapsed / totalDuration) * 100;
      
      progressBarFill.style.width = `${globalPercent}%`;
      
      const secElapsed = Math.floor(globalElapsed / 1000);
      const totalSec = Math.floor(totalDuration / 1000);
      timeIndicator.textContent = `0:${secElapsed.toString().padStart(2, '0')} / 0:${totalSec}`;
      
      if (totalElapsed >= defaultDuration) {
        nextSlide();
      } else {
        progressTimer = requestAnimationFrame(updateProgress);
      }
    }
    
    function nextSlide() {
      slides[currentSlide].classList.remove('active');
      currentSlide++;
      timeElapsedInSlide = 0;
      
      if (currentSlide >= slides.length) {
        // Al final, pausar en la última foto
        pauseVideo();
        currentSlide = slides.length - 1;
        slides[currentSlide].classList.add('active');
        return;
      }
      
      slides[currentSlide].classList.add('active');
      slideStartTime = Date.now();
      if (isPlaying) {
        progressTimer = requestAnimationFrame(updateProgress);
      }
    }
    
    function playVideo() {
      // Reiniciar si estábamos en el final
      if (currentSlide >= slides.length - 1 && timeElapsedInSlide >= defaultDuration - 100) {
        currentSlide = 0;
        timeElapsedInSlide = 0;
        slides.forEach(s => s.classList.remove('active'));
        slides[0].classList.add('active');
      }
      isPlaying = true;
      slideStartTime = Date.now();
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      modalEscorial.querySelector('.video-player').classList.remove('paused');
      progressTimer = requestAnimationFrame(updateProgress);
    }
    
    function pauseVideo() {
      isPlaying = false;
      if (slideStartTime > 0) {
        timeElapsedInSlide += Date.now() - slideStartTime;
        slideStartTime = 0;
      }
      cancelAnimationFrame(progressTimer);
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      modalEscorial.querySelector('.video-player').classList.add('paused');
    }
    
    function togglePlayPause() {
      if (isPlaying) pauseVideo();
      else playVideo();
    }
    
    function openModal() {
      modalEscorial.classList.add('open');
      document.body.style.overflow = 'hidden'; // Evitar scroll
      
      currentSlide = 0;
      timeElapsedInSlide = 0;
      slides.forEach(s => s.classList.remove('active'));
      slides[0].classList.add('active');
      progressBarFill.style.width = '0%';
      
      const totalSec = Math.floor((slides.length * defaultDuration) / 1000);
      timeIndicator.textContent = `0:00 / 0:${totalSec}`;
      
      setTimeout(() => {
        playVideo();
      }, 500); // dar tiempo a la transición de apertura
    }
    
    function closeModal() {
      modalEscorial.classList.remove('open');
      document.body.style.overflow = '';
      pauseVideo();
    }
    
    btnEscorial.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    btnPlayPause.addEventListener('click', togglePlayPause);
  }
});
