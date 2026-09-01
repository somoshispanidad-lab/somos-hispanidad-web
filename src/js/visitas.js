/*
 * =====================================================
 * SOMOS HISPANIDAD — Visitas Culturales
 * Archivo: src/js/visitas.js
 *
 * Orden cronológico:
 *   1. Visitas FUTURAS (≥ hoy) — ASC: la más próxima primero
 *   2. Visitas PASADAS (< hoy)  — DESC: la más reciente primero
 *
 * La tarjeta estática del Escorial (en index.html) se mantiene
 * siempre al final como elemento independiente.
 * =====================================================
 */

let historialOffset = 0;
const HISTORIAL_LIMIT = 3;

// Formato de fecha legible: "20 de junio de 2026"
function formatearFecha(isoDate) {
  if (!isoDate) return '';
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const d = new Date(isoDate);
  return `${d.getUTCDate()} de ${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

// Genera el HTML de una tarjeta de visita
function renderTarjetaVisita(v, esFutura) {
  let buttonsHtml = '';
  if (v.pdf_url) {
    buttonsHtml += `<div style="margin-top: 25px;"><a href="${v.pdf_url}" target="_blank" class="btn-primary" style="font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Leer Reseña de la Visita →</a></div>`;
  }
  if (v.video_url) {
    buttonsHtml += `<div style="margin-top: 20px;"><a href="${v.video_url}" target="_blank" class="btn-primary" style="font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Ver Vídeo del Acto →</a></div>`;
  }

  const fallbackUrl = 'assets/images/escorial.jpg';
  const imgUrl = v.cover_image_url || fallbackUrl;

  const imgTag = `
    <img src="${imgUrl}" alt="${v.title}" class="acto-image" loading="lazy"
      onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
    <img src="${fallbackUrl}" alt="${v.title}" class="acto-image" style="display:none;" loading="lazy"
      onerror="this.outerHTML='<div style=&quot;width:100%;min-height:200px;background:var(--cream-dark);display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-family:Lato,sans-serif;font-size:0.85rem;&quot;>Imagen no disponible</div>'">
  `;

  const badgeHtml = esFutura
    ? `<div class="acto-badge-proxima">✦ Próxima Visita</div>`
    : '';

  const fechaHtml = v.visit_date
    ? `<p class="acto-fecha">${formatearFecha(v.visit_date)}</p>`
    : '';

  return `
    <div class="reveal" style="opacity: 1; transform: none;">
      <div class="acto-card${esFutura ? ' acto-card--proxima' : ''}">
        <div style="position: relative;">
          ${badgeHtml}
          ${imgTag}
        </div>
        <div class="acto-content">
          ${fechaHtml}
          <h3 class="acto-title">${v.title}</h3>
          <p class="acto-text">${v.synopsis || ''}</p>
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
}

// Separador visual entre futuras y pasadas
function renderSeparadorHistorial() {
  return `
    <div class="acto-historial-sep">
      <div class="acto-historial-sep-line"></div>
      <span class="acto-historial-sep-label">Historial de Visitas</span>
      <div class="acto-historial-sep-line"></div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const container    = document.getElementById('visitas-container');
  const paginationDiv = document.getElementById('visitas-pagination');
  const btnLoadMore  = document.getElementById('btn-load-more-visitas');

  if (!container) return;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString();

  // ── 1. VISITAS FUTURAS (próximas primero) ────────────────
  async function loadVisitasFuturas() {
    try {
      const { data, error } = await supabaseClient
        .from('cultural_visits')
        .select('*')
        .eq('published', true)
        .gte('visit_date', hoyISO)
        .order('visit_date', { ascending: true }); // más próxima, primero

      if (error) throw error;

      if (data && data.length > 0) {
        const html = data.map(v => renderTarjetaVisita(v, true)).join('');
        container.insertAdjacentHTML('beforeend', html);
      }
    } catch (err) {
      console.error('Error cargando visitas futuras:', err);
    }
  }

  // ── 2. VISITAS PASADAS con paginación ───────────────────
  async function loadHistorial() {
    try {
      if (btnLoadMore) {
        btnLoadMore.textContent = 'Cargando...';
        btnLoadMore.disabled = true;
      }

      const { data, error } = await supabaseClient
        .from('cultural_visits')
        .select('*')
        .eq('published', true)
        .lt('visit_date', hoyISO)
        .order('visit_date', { ascending: false }) // más reciente del pasado, primero
        .range(historialOffset, historialOffset + HISTORIAL_LIMIT - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Separador solo antes del primer lote del historial
        if (historialOffset === 0) {
          container.insertAdjacentHTML('beforeend', renderSeparadorHistorial());
        }

        const html = data.map(v => renderTarjetaVisita(v, false)).join('');
        container.insertAdjacentHTML('beforeend', html);
        historialOffset += data.length;

        // Gestión del botón de paginación
        if (data.length === HISTORIAL_LIMIT) {
          if (paginationDiv) paginationDiv.style.display = 'block';
          if (btnLoadMore) {
            btnLoadMore.textContent = 'Ver visitas anteriores';
            btnLoadMore.disabled = false;
          }
        } else {
          // No hay más visitas pasadas
          if (historialOffset > HISTORIAL_LIMIT) {
            if (paginationDiv) paginationDiv.style.display = 'block';
            if (btnLoadMore) {
              btnLoadMore.textContent = 'Has llegado al inicio del historial';
              btnLoadMore.disabled = true;
              btnLoadMore.style.opacity = '0.6';
              btnLoadMore.style.cursor = 'default';
            }
          } else {
            if (paginationDiv) paginationDiv.style.display = 'none';
          }
        }
      } else {
        // Sin historial en absoluto o ya llegamos al final
        if (historialOffset > 0) {
          if (paginationDiv) paginationDiv.style.display = 'block';
          if (btnLoadMore) {
            btnLoadMore.textContent = 'Has llegado al inicio del historial';
            btnLoadMore.disabled = true;
            btnLoadMore.style.opacity = '0.6';
            btnLoadMore.style.cursor = 'default';
          }
        } else {
          if (paginationDiv) paginationDiv.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Error cargando historial de visitas:', err);
      if (btnLoadMore) {
        btnLoadMore.textContent = 'Error al cargar';
        btnLoadMore.disabled = false;
      }
    }
  }

  // ── Carga inicial ─────────────────────────────────────
  await loadVisitasFuturas();
  await loadHistorial();

  // ── Botón "Ver más" del historial ─────────────────────
  if (btnLoadMore) {
    btnLoadMore.addEventListener('click', loadHistorial);
  }


  // ── PRÓXIMA VISITA EN BANNER ESCORIAL ────────────────
  async function loadNextVisit() {
    const btnNextVisit   = document.getElementById('btn-next-visit');
    const nextVisitInfo  = document.getElementById('next-visit-info');
    const nextVisitSynopsis = document.getElementById('next-visit-synopsis');

    if (!btnNextVisit && !nextVisitInfo) return;

    try {
      const { data, error } = await supabaseClient
        .from('cultural_visits')
        .select('*')
        .gte('visit_date', hoyISO)
        .order('visit_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const nextVisit = data[0];
        if (nextVisit.published) {
          if (btnNextVisit) btnNextVisit.style.display = 'inline-block';
          if (nextVisitInfo) nextVisitInfo.style.display = 'none';
        } else {
          if (btnNextVisit) btnNextVisit.style.display = 'none';
          if (nextVisitInfo && nextVisitSynopsis) {
            nextVisitSynopsis.textContent = nextVisit.synopsis || nextVisit.title;
            nextVisitInfo.style.display = 'block';
          }
        }
      } else {
        if (btnNextVisit) btnNextVisit.style.display = 'none';
        if (nextVisitInfo) nextVisitInfo.style.display = 'none';
      }
    } catch (err) {
      console.error('Error cargando próxima visita:', err);
    }
  }

  loadNextVisit();
});
