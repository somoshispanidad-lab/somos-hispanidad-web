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
