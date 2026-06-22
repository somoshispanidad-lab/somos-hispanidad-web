let visitasOffset = 0;
const VISITAS_LIMIT = 3;

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('visitas-container');
  const paginationDiv = document.getElementById('visitas-pagination');
  const btnLoadMore = document.getElementById('btn-load-more-visitas');
  
  if (!container) return;

  async function loadVisitas() {
    try {
      if (btnLoadMore) btnLoadMore.textContent = 'Cargando...';

      const { data, error } = await supabaseClient
        .from('cultural_visits')
        .select('*')
        .eq('published', true)
        .order('visit_date', { ascending: false })
        .range(visitasOffset, visitasOffset + VISITAS_LIMIT - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        const html = data.map(v => {
          let buttonsHtml = '';
          if (v.pdf_url) {
            buttonsHtml += `<div style="margin-top: 25px;"><a href="${v.pdf_url}" target="_blank" class="btn-primary" style="font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Leer Reseña de la Visita →</a></div>`;
          }
          if (v.video_url) {
            buttonsHtml += `<div style="margin-top: 20px;"><a href="${v.video_url}" target="_blank" class="btn-primary" style="font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Ver Vídeo del Acto →</a></div>`;
          }

          const imgTag = v.cover_image_url 
            ? `<img src="${v.cover_image_url}" alt="${v.title}" class="acto-image">`
            : `<img src="assets/images/escorial.jpg" alt="${v.title}" class="acto-image">`;

          return `
            <div class="reveal" style="margin-top: 40px; opacity: 1; transform: none;">
              <div class="acto-card">
                ${imgTag}
                <div class="acto-content">
                  <h3 class="acto-title">${v.title}</h3>
                  <p class="acto-text">${v.synopsis || ''}</p>
                  ${buttonsHtml}
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Se insertan debajo de las anteriores en lugar de borrarlas
        container.insertAdjacentHTML('beforeend', html);
        visitasOffset += data.length;

        // Mostrar botón sólo si supuestamente quedan más (es decir, devolvió el límite máximo de esta tirada)
        if (data.length === VISITAS_LIMIT && paginationDiv) {
          paginationDiv.style.display = 'block';
          if (btnLoadMore) btnLoadMore.textContent = 'Ver visitas más antiguas';
        } else if (paginationDiv) {
          if (visitasOffset > VISITAS_LIMIT) {
            paginationDiv.style.display = 'block';
            if (btnLoadMore) {
              btnLoadMore.textContent = 'Has llegado al final del historial';
              btnLoadMore.disabled = true;
              btnLoadMore.style.opacity = '0.6';
              btnLoadMore.style.cursor = 'default';
            }
          } else {
            paginationDiv.style.display = 'none';
          }
        }
      } else {
        if (paginationDiv) {
          if (visitasOffset > 0) {
            paginationDiv.style.display = 'block';
            if (btnLoadMore) {
              btnLoadMore.textContent = 'Has llegado al final del historial';
              btnLoadMore.disabled = true;
              btnLoadMore.style.opacity = '0.6';
              btnLoadMore.style.cursor = 'default';
            }
          } else {
            paginationDiv.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.error("Error cargando visitas dinámicas:", err);
      if (btnLoadMore) btnLoadMore.textContent = 'Error al cargar';
    }
  }

  // Carga inicial al entrar en la página
  loadVisitas();

  // Clic en "Ver más"
  if (btnLoadMore) {
    btnLoadMore.addEventListener('click', loadVisitas);
  }

  // ── PRÓXIMA VISITA EN BANNER ESCORIAL ──
  async function loadNextVisit() {
    const btnNextVisit = document.getElementById('btn-next-visit');
    const nextVisitInfo = document.getElementById('next-visit-info');
    const nextVisitSynopsis = document.getElementById('next-visit-synopsis');
    
    if (!btnNextVisit && !nextVisitInfo) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabaseClient
        .from('cultural_visits')
        .select('*')
        .gte('visit_date', today)
        .order('visit_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const nextVisit = data[0];
        if (nextVisit.published) {
          // Si está visible, botón normal
          if (btnNextVisit) btnNextVisit.style.display = 'inline-block';
          if (nextVisitInfo) nextVisitInfo.style.display = 'none';
        } else {
          // Si está oculta, mostrar sinopsis y "prevista"
          if (btnNextVisit) btnNextVisit.style.display = 'none';
          if (nextVisitInfo && nextVisitSynopsis) {
            nextVisitSynopsis.textContent = nextVisit.synopsis || nextVisit.title;
            nextVisitInfo.style.display = 'block';
          }
        }
      } else {
        // No hay próxima visita
        if (btnNextVisit) btnNextVisit.style.display = 'none';
        if (nextVisitInfo) nextVisitInfo.style.display = 'none';
      }
    } catch (err) {
      console.error("Error loading next visit:", err);
    }
  }

  loadNextVisit();
});
