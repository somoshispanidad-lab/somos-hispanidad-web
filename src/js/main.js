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

// ── CARGA DINÁMICA DE ENLACES DEL PIE DE PÁGINA ───────
document.addEventListener('DOMContentLoaded', async function () {
  try {
    if (typeof supabaseClient === 'undefined') {
      console.warn('ℹ supabaseClient no está definido. Los enlaces del pie de página usarán los valores estáticos.');
      return;
    }
    
    // Consultar tabla settings para las dos URLs
    const { data, error } = await supabaseClient
      .from('settings')
      .select('*')
      .in('key', ['lecturas_recomendadas_url', 'divulgadores_url']);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      const settingsMap = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      
      const lecturasUrl = settingsMap['lecturas_recomendadas_url'];
      const divulgadoresUrl = settingsMap['divulgadores_url'];
      
      document.querySelectorAll('footer a').forEach(link => {
        const text = link.textContent.trim();
        if (text === 'Lecturas recomendadas' && lecturasUrl) {
          link.href = lecturasUrl;
          link.classList.remove('link-disabled');
          link.target = '_blank';
        }
        if (text === 'Divulgadores' && divulgadoresUrl) {
          link.href = divulgadoresUrl;
          link.classList.remove('link-disabled');
          link.target = '_blank';
        }
      });
    }

    // ── REGISTRAR VISITA EN SUPABASE (DATOS REALES) ──────
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

  } catch (err) {
    console.warn('⚠ Error cargando enlaces dinámicos del pie de página:', err.message);
  }
});
