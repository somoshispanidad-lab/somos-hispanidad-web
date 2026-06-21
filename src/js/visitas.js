document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('visitas-container');
  if (!container) return;

  try {
    const { data, error } = await supabaseClient
      .from('cultural_visits')
      .select('*')
      .eq('published', true)
      .order('visit_date', { ascending: false });

    if (error || !data || data.length === 0) {
      return; // Si no hay visitas nuevas publicadas, simplemente no dibuja nada
    }

    const html = data.map(v => {
      let buttonsHtml = '';
      if (v.video_url) {
        buttonsHtml += `<a href="${v.video_url}" target="_blank" class="btn-primary" style="font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; margin-right:15px; margin-bottom:15px;">Ver vídeo →</a>`;
      }
      if (v.pdf_url) {
        buttonsHtml += `<a href="${v.pdf_url}" target="_blank" class="btn-primary" style="font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; margin-bottom:15px;">Saber más →</a>`;
      }

      // Si no hay imagen de portada, se usa una por defecto para no romper el diseño
      const imgTag = v.cover_image_url 
        ? `<img src="${v.cover_image_url}" alt="${v.title}" class="acto-image">`
        : `<img src="assets/images/escorial.jpg" alt="${v.title}" class="acto-image">`;

      return `
        <div class="reveal" style="margin-top: 40px;">
          <div class="acto-card">
            ${imgTag}
            <div class="acto-content">
              <h3 class="acto-title">${v.title}</h3>
              <p class="acto-text">${v.synopsis || ''}</p>
              <div style="margin-top: 25px; display: flex; flex-wrap: wrap;">
                ${buttonsHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  } catch (err) {
    console.error("Error cargando visitas dinámicas:", err);
  }
});
