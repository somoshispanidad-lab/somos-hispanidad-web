/*
 * =====================================================
 * SOMOS HISPANIDAD — Datos y lógica de Eventos
 * Archivo: src/js/eventos.js
 *
 * Contiene los datos simulados de eventos y las
 * funciones para mostrarlos en la página eventos.html.
 * En el futuro, los datos vendrán de Supabase.
 * =====================================================
 */

// ── DATOS SIMULADOS DE EVENTOS ────────────────────────────
// Cuando Supabase esté conectado, estos datos se reemplazarán
// por la función getEventos() del archivo supabaseClient.js

const EVENTOS_SIMULADOS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    titulo: "Visita guiada al Monasterio del Escorial con comida de hermandad",
    fecha: "2026-06-20",
    dia: "20",
    mes: "Jun",
    anio: "2026",
    hora: "18:00",
    lugar: "Real Monasterio de San Lorenzo de El Escorial, Madrid",
    tipo: "Visita Cultural",
    descripcion: "Una jornada especial en uno de los monumentos más emblemáticos del imperio español. Incluye visita guiada y comida de hermandad con los socios.",
    url_inscripcion: "#inscripcion",
    estado: "abierto"
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    titulo: "Conferencia: La España Olvidada — Legado jurídico en América",
    fecha: "2026-07-15",
    dia: "15",
    mes: "Jul",
    anio: "2026",
    hora: "18:30",
    lugar: "Madrid, España (sede por confirmar)",
    tipo: "Conferencia",
    descripcion: "Análisis profundo del sistema jurídico que España implantó en América, sus raíces romanas y su influencia en los ordenamientos modernos hispanoamericanos.",
    url_inscripcion: "#inscripcion",
    estado: "abierto"
  }
];


// ── FUNCIÓN: RENDERIZAR TARJETAS DE EVENTOS ───────────────
/**
 * Genera y muestra las tarjetas de eventos en el contenedor indicado.
 * @param {string} contenedorId - El id del elemento HTML donde se insertarán
 * @param {number} limite - Cuántos eventos mostrar (0 = todos)
 */
async function renderizarEventos(contenedorId, limite = 0) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  // Cargar eventos desde Supabase (con fallback a simulados)
  const eventos = await getEventos();
  const lista = limite > 0 ? eventos.slice(0, limite) : eventos;

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="body-text">No hay eventos próximos en este momento. Vuelve pronto.</p>';
    return;
  }

  contenedor.innerHTML = lista.map(ev => `
    <div class="evento-card reveal">
      <div class="evento-date">
        <div class="evento-day">${ev.dia}</div>
        <div class="evento-month">${ev.mes} · ${ev.anio}</div>
        <div class="evento-time" style="font-size:0.8rem; margin-top:5px; color:var(--gold); font-family:'Lato', sans-serif;">${ev.hora || '18:00'} h</div>
      </div>
      <div class="evento-info">
        <p class="evento-tipo">${ev.tipo}</p>
        <h3 class="evento-title">${ev.titulo}</h3>
        <p class="evento-loc">📍 ${ev.lugar}</p>
        <p style="font-family:'Cormorant Garamond',serif; font-size:1rem; color:var(--ink-soft); margin-bottom:16px; line-height:1.7;">${ev.descripcion}</p>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:12px;">
          ${ev.estado === 'abierto' ? `
            <a href="${limite > 0 ? 'src/pages/eventos.html#inscripcion?id=' + ev.id : '#inscripcion'}" 
               class="btn-primary btn-inscribirse" 
               data-id="${ev.id}" 
               style="font-size:0.7rem; padding:10px 22px;">
              Inscribirse
            </a>
          ` : `
            <span class="btn-outline" style="font-size:0.7rem; padding:10px 22px; cursor:not-allowed; opacity:0.6; display:inline-block;">
              Inscripción Cerrada
            </span>
          `}
          ${(ev.pdf_url && ev.pdf_visible !== false) ? `
            <a href="${ev.pdf_url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="btn-outline" 
               style="font-size:0.7rem; padding:10px 22px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
              📄 Ver Folleto (PDF)
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Delegación de eventos para auto-seleccionar en el formulario (mismo panel)
  contenedor.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-inscribirse');
    if (btn) {
      const eventId = btn.getAttribute('data-id');
      const select = document.getElementById('select-evento');
      if (select) {
        select.value = eventId;
      }
    }
  });

  activarReveal();
}


// ── FUNCIÓN: FORMULARIO DE INSCRIPCIÓN ────────────────────
async function initFormularioInscripcion() {
  const form = document.getElementById('form-inscripcion');
  if (!form) return;

  const selectEvento = document.getElementById('select-evento');
  if (selectEvento) {
    const eventos = await getEventos();
    // Limpiar opciones previas excepto la primera
    selectEvento.innerHTML = '<option value="">— Selecciona un evento —</option>';
    eventos.forEach(ev => {
      const option = document.createElement('option');
      option.value = ev.id;
      option.textContent = `${ev.dia} ${ev.mes} · ${ev.titulo}`;
      selectEvento.appendChild(option);
    });

    // AUTO-SELECCIONAR POR URL
    // Si la URL viene con ?id=... (desde el home)
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const preselectedId = urlParams.get('id');
    if (preselectedId) {
      selectEvento.value = preselectedId;
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre = document.getElementById('insc-nombre')?.value.trim();
    const email = document.getElementById('insc-email')?.value.trim();
    const evento = document.getElementById('select-evento')?.value;
    const phone = document.getElementById('insc-telefono')?.value?.trim() || null;
    const comments = document.getElementById('insc-comentarios')?.value?.trim() || null;

    if (!nombre || !email || !evento) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Procesando...';
    btn.disabled = true;

    const ok = await registrarInscripcion(evento, nombre, email, phone, comments);

    btn.textContent = 'Solicitar plaza';
    btn.disabled = false;

    if (ok) {
      // ── EMAIL DE CONFIRMACIÓN AUTOMÁTICO ──────────────
      try {
        // Obtener el título del evento seleccionado
        const selectEl = document.getElementById('select-evento');
        const eventoTitulo = selectEl?.options[selectEl.selectedIndex]?.text || 'el evento';

        if (typeof emailjs !== 'undefined') {
          await emailjs.send('service_sfxfhke', 'template_5jjf7vs', {
            from_name: 'Administración Somos Hispanidad',
            from_email: 'contacto@somoshispanidad.es',
            subject: `Inscripción en ${eventoTitulo} recibida`,
            message: `Su inscripción en ${eventoTitulo} ha sido recibida, próximamente recibirá confirmación de su solicitud. Gracias por contactar con Somos Hispanidad`,
            to_email: email,
            to_name: nombre
          });
          console.log('✅ Email de confirmación enviado a', email);
        }
      } catch (emailErr) {
        // El email falla silenciosamente — la inscripción ya está guardada
        console.warn('⚠ Email de confirmación no enviado:', emailErr);
      }
      // ─────────────────────────────────────────────────

      const exito = document.getElementById('inscripcion-exito');
      if (exito) exito.style.display = 'block';
      form.style.display = 'none';
      window.scrollTo({ top: document.getElementById('inscripcion').offsetTop - 100, behavior: 'smooth' });
    } else {
      console.error('Fallo en registrarInscripcion');
      alert('Hubo un problema técnico al registrar tu inscripción. Por favor, inténtalo de nuevo más tarde o contacta con la administración.');
    }
  });
}


// ── INICIALIZAR AL CARGAR LA PÁGINA ──────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  if (document.getElementById('lista-eventos')) {
    await renderizarEventos('lista-eventos');
    await initFormularioInscripcion();
  }

  if (document.getElementById('eventos-preview')) {
    await renderizarEventos('eventos-preview', 2);
  }
});
