/*
 * =====================================================
 * SOMOS HISPANIDAD — Buscador Global en el Navegador
 * Archivo: src/js/buscador.js
 *
 * Buscador 100 % client-side conectado al menú de main.js:
 * - Búsqueda insensible a tildes y mayúsculas ("america" → "América")
 * - Soporte multipalabra ("justicia america" → "Justicia Real en la América Española")
 * - Indexa Contenidos, Eventos, Autores, De Interés y Secciones de la web
 * - Modal accesible (Portal en <body>, Escape, Tab trap, flechas, Ctrl/Cmd+K)
 * =====================================================
 */

(function () {
  'use strict';

  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos en memoria por pestaña
  const SUGERENCIAS_RAPIDAS = ['América', 'Escorial', 'Barómetro', 'Conquista', 'Justicia', 'Eventos'];

  let modalEl = null;
  let inputEl = null;
  let resultsEl = null;
  let statusEl = null;
  let clearBtnEl = null;
  let previouslyFocused = null;
  let cachedItems = null;
  let cachedAt = 0;
  let loadingPromise = null;
  let activeIndex = -1;
  let initialized = false;

  // ── NORMALIZACIÓN SIN TILDES NI MAYÚSCULAS ─────────────
  function normalizarTexto(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeUrl(url, allowDataPdf = true) {
    if (!url || url === '#') return '';
    const trimmed = String(url).replace(/[\u0000-\u001F\u007F]/g, '').trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();

    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('mailto:') ||
      lower.startsWith('#') ||
      (lower.startsWith('/') && !lower.startsWith('//')) ||
      lower.startsWith('assets/') ||
      lower.startsWith('src/') ||
      lower.startsWith('../')
    ) {
      return trimmed;
    }

    if (allowDataPdf && /^data:application\/pdf;base64,[A-Za-z0-9+/=\s]+$/i.test(trimmed)) {
      return trimmed;
    }
    return '';
  }

  // Resuelve rutas internas dependiendo de si estamos en raíz (index.html) o en /src/pages/
  function resolverRutaPagina(rutaDesdeRaiz) {
    if (!rutaDesdeRaiz) return '#';
    if (
      rutaDesdeRaiz.startsWith('http://') ||
      rutaDesdeRaiz.startsWith('https://') ||
      rutaDesdeRaiz.startsWith('mailto:') ||
      rutaDesdeRaiz.startsWith('data:')
    ) {
      return rutaDesdeRaiz;
    }

    const pathname = window.location.pathname || '';
    const isInsidePages = pathname.includes('/src/pages/') || pathname.includes('/src/admin/');

    if (!isInsidePages) {
      return rutaDesdeRaiz;
    }

    if (rutaDesdeRaiz === 'index.html' || rutaDesdeRaiz.startsWith('index.html#')) {
      return '../../' + rutaDesdeRaiz;
    }
    if (rutaDesdeRaiz.startsWith('src/pages/')) {
      return rutaDesdeRaiz.replace(/^src\/pages\//, '');
    }
    if (rutaDesdeRaiz.startsWith('assets/')) {
      return '../../' + rutaDesdeRaiz;
    }
    return rutaDesdeRaiz;
  }

  // Resalta coincidencias de forma segura preservando tildes y mayúsculas originales
  function resaltarCoincidencias(texto, query) {
    const original = String(texto || '');
    const tokens = Array.from(new Set(normalizarTexto(query).split(/\s+/).filter(Boolean))).slice(0, 10);
    if (!original || tokens.length === 0) return escapeHtml(original);

    // Mapeo carácter a carácter de texto normalizado -> índice original
    let norm = '';
    const map = [];
    for (let i = 0; i < original.length; i++) {
      const chNorm = original[i]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      for (let j = 0; j < chNorm.length; j++) {
        norm += chNorm[j];
        map.push(i);
      }
    }

    const ranges = [];
    tokens.forEach(token => {
      let startPos = 0;
      while (startPos < norm.length) {
        const idx = norm.indexOf(token, startPos);
        if (idx === -1) break;
        const origStart = map[idx];
        const origEnd = map[idx + token.length - 1] + 1;
        ranges.push([origStart, origEnd]);
        startPos = idx + token.length;
      }
    });

    if (ranges.length === 0) return escapeHtml(original);

    // Fusionar rangos solapados
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const prev = merged[merged.length - 1];
      if (ranges[i][0] <= prev[1]) {
        prev[1] = Math.max(prev[1], ranges[i][1]);
      } else {
        merged.push(ranges[i]);
      }
    }

    let html = '';
    let cursor = 0;
    merged.forEach(([s, e]) => {
      if (cursor < s) html += escapeHtml(original.slice(cursor, s));
      html += '<mark class="sh-search-mark">' + escapeHtml(original.slice(s, e)) + '</mark>';
      cursor = e;
    });
    if (cursor < original.length) html += escapeHtml(original.slice(cursor));
    return html;
  }

  function slugify(str) {
    return normalizarTexto(str).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // ── CATÁLOGO ESTÁTICO DE PÁGINAS Y SECCIONES ───────────
  function obtenerSeccionesEstaticas() {
    return [
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'Inicio — Somos Hispanidad',
        descripcion: 'Página principal, misión contra la Leyenda Negra, barómetro, visitas y actualidad.',
        url: 'index.html',
        etiquetas: ['inicio', 'portada', 'leyenda negra', 'hispanidad', 'mision']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'La Asociación — Quiénes Somos y Valores',
        descripcion: 'Historia, principios, junta y propósito cultural de Somos Hispanidad.',
        url: 'src/pages/asociacion.html',
        etiquetas: ['asociacion', 'quienes somos', 'valores', 'mision', 'torrelodones']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'Contenidos — Artículos, Actas, Barómetro y Conferencias',
        descripcion: 'Archivo completo de escritos, actas, barómetros, vídeos y conferencias.',
        url: 'src/pages/contenidos.html',
        etiquetas: ['contenidos', 'escritos', 'articulos', 'actas', 'barometro', 'videos', 'conferencias', 'pdf']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'Próximos Eventos y Agenda Cultural',
        descripcion: 'Consulta próximas conferencias, visitas culturales y formulario de inscripción.',
        url: 'src/pages/eventos.html',
        etiquetas: ['eventos', 'agenda', 'inscripcion', 'conferencias', 'visitas']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'Autores, Historiadores y Colaboradores',
        descripcion: 'Conoce a los ponentes, escritores e investigadores que colaboran con la asociación.',
        url: 'src/pages/autores.html',
        etiquetas: ['autores', 'historiadores', 'ponentes', 'investigadores', 'colaboradores']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Sección',
        titulo: 'Barómetro de la Hispanidad',
        descripcion: 'Estudio anual sobre la percepción social e histórica de la Hispanidad.',
        url: 'index.html#barometro',
        etiquetas: ['barometro', 'informe', 'estudio', 'encuesta', 'pdf']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Sección',
        titulo: 'Actos Culturales y Visitas (El Escorial)',
        descripcion: 'Visitas guiadas culturales, reseñas e historial de actos de la asociación.',
        url: 'index.html#actos-culturales',
        etiquetas: ['actos culturales', 'visitas', 'escorial', 'monasterio', 'museo']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Sección',
        titulo: 'De Interés — Lecturas, Reseñas, Páginas Amigas y Divulgadores',
        descripcion: 'Recursos recomendados, reseñas de libros, webs afines y redes sociales.',
        url: 'index.html#de-interes',
        etiquetas: ['de interes', 'lecturas recomendadas', 'resenas', 'paginas amigas', 'divulgadores', 'redes sociales', 'youtube', 'instagram']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'Contacto — Escríbenos o Colabora',
        descripcion: 'Formulario de contacto, correo electrónico y sede en Torrelodones (Madrid).',
        url: 'src/pages/contacto.html',
        etiquetas: ['contacto', 'email', 'correo', 'colaborar', 'torrelodones', 'madrid']
      },
      {
        categoria: 'Secciones y Páginas',
        tipo: 'Página',
        titulo: 'Política de Privacidad',
        descripcion: 'Información legal y protección de datos (RGPD) de Somos Hispanidad.',
        url: 'src/pages/privacidad.html',
        etiquetas: ['privacidad', 'legal', 'rgpd', 'datos']
      }
    ];
  }

  // ── CARGA E INDEXACIÓN DE DATOS ────────────────────────
  async function cargarIndice(forceRefresh = false) {
    const ahora = Date.now();
    if (!forceRefresh && cachedItems && (ahora - cachedAt) < CACHE_TTL_MS) {
      return cachedItems;
    }
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      const items = [];

      // 1. Contenidos
      let contenidos = [];
      try {
        if (typeof getContenidos === 'function') {
          contenidos = await getContenidos();
        } else if (typeof supabaseClient !== 'undefined') {
          const { data } = await supabaseClient
            .from('contents')
            .select('*, authors(name)')
            .eq('published', true)
            .order('created_at', { ascending: false });
          if (data) {
            contenidos = data.map(c => ({
              id: c.id,
              tipo: c.content_type || 'Contenido',
              titulo: c.title,
              autor: c.authors?.name || 'Somos Hispanidad',
              fecha: c.created_at
                ? new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
              descripcion: c.summary || '',
              url: typeof sanitizePdfUrl === 'function' ? (sanitizePdfUrl(c.youtube_url) || '#') : (c.youtube_url || '#'),
              etiquetas: c.tags || []
            }));
          }
        }
      } catch (err) {
        console.warn('⚠ Buscador (contenidos):', err.message);
      }

      contenidos.forEach(c => {
        if (!c || !c.titulo) return;
        const rawUrl = sanitizeUrl(c.url);
        const isBase64 = rawUrl.startsWith('data:');
        const isPdf = c.tipo === 'Folleto' || rawUrl.toLowerCase().includes('.pdf') || isBase64;
        const isYoutube = /youtu\.?be/.test(rawUrl);
        const fallbackPage = 'src/pages/contenidos.html#' + slugify(c.titulo);
        const resolvedUrl = rawUrl
          ? (typeof resolverRutaPdf === 'function' ? resolverRutaPdf(rawUrl) : resolverRutaPagina(rawUrl))
          : resolverRutaPagina(fallbackPage);

        items.push({
          categoria: 'Contenidos',
          tipo: c.tipo || 'Contenido',
          titulo: c.titulo,
          subtitulo: [c.fecha, c.tipo, c.autor].filter(Boolean).join(' · '),
          descripcion: c.descripcion || '',
          etiquetas: Array.isArray(c.etiquetas) ? c.etiquetas : [],
          url: resolvedUrl,
          rawUrl: rawUrl,
          esExterno: Boolean(rawUrl && !isBase64),
          esBase64: isBase64,
          badge: isPdf ? 'PDF' : isYoutube ? 'Vídeo' : 'Ver'
        });
      });

      // 2. Eventos
      let eventos = [];
      try {
        if (typeof getEventos === 'function') {
          eventos = await getEventos();
        }
      } catch (err) {
        console.warn('⚠ Buscador (eventos):', err.message);
      }

      eventos.forEach(ev => {
        if (!ev || !ev.titulo) return;
        const fechaStr = [ev.dia, ev.mes, ev.anio].filter(Boolean).join(' ');
        items.push({
          categoria: 'Eventos',
          tipo: ev.tipo || 'Evento',
          titulo: ev.titulo,
          subtitulo: [fechaStr, ev.lugar].filter(Boolean).join(' · '),
          descripcion: ev.descripcion || '',
          etiquetas: [ev.tipo, ev.lugar, ev.estado].filter(Boolean),
          url: resolverRutaPagina('src/pages/eventos.html'),
          esExterno: false,
          badge: ev.estado === 'abierto' ? 'Abierto' : 'Evento'
        });
      });

      // 3. Autores
      let autores = [];
      try {
        if (typeof getAutores === 'function') {
          autores = await getAutores();
        }
      } catch (err) {
        console.warn('⚠ Buscador (autores):', err.message);
      }

      autores.forEach(a => {
        if (!a || !a.nombre) return;
        items.push({
          categoria: 'Autores',
          tipo: 'Autor',
          titulo: a.nombre,
          subtitulo: [a.cargo, a.especialidad].filter(Boolean).join(' · '),
          descripcion: a.bio || '',
          etiquetas: [a.cargo, a.especialidad].filter(Boolean),
          url: resolverRutaPagina('src/pages/contenidos.html?autor=' + encodeURIComponent(a.nombre)),
          esExterno: false,
          badge: 'Publicaciones'
        });
      });

      // 4. Enlaces "De Interés" desde settings (si Supabase está disponible)
      try {
        if (typeof supabaseClient !== 'undefined') {
          const { data } = await supabaseClient
            .from('settings')
            .select('key, value')
            .in('key', ['lecturas_recomendadas', 'resenas_lecturas', 'paginas_amigas', 'divulgadores']);

          const labels = {
            lecturas_recomendadas: 'Lectura recomendada',
            resenas_lecturas: 'Reseña de lectura',
            paginas_amigas: 'Página amiga',
            divulgadores: 'Divulgador'
          };

          (data || []).forEach(row => {
            let parsed = [];
            try {
              const maybe = JSON.parse(row.value);
              if (Array.isArray(maybe)) parsed = maybe;
            } catch (e) {
              if (row.value && row.value.startsWith('http')) {
                parsed = [{ title: labels[row.key] || 'Enlace', url: row.value }];
              }
            }
            parsed.forEach(link => {
              const url = sanitizeUrl(link?.url, false);
              if (!link?.title || !url) return;
              items.push({
                categoria: 'De Interés',
                tipo: labels[row.key] || 'Recurso',
                titulo: link.title,
                subtitulo: labels[row.key] || 'De Interés',
                descripcion: '',
                etiquetas: [labels[row.key]],
                url: url,
                esExterno: true,
                badge: 'Enlace ↗'
              });
            });
          });
        }
      } catch (err) {
        console.warn('⚠ Buscador (de interés):', err.message);
      }

      // 5. Secciones y páginas estáticas
      obtenerSeccionesEstaticas().forEach(sec => {
        items.push({
          categoria: sec.categoria,
          tipo: sec.tipo,
          titulo: sec.titulo,
          subtitulo: sec.tipo,
          descripcion: sec.descripcion,
          etiquetas: sec.etiquetas,
          url: resolverRutaPagina(sec.url),
          esExterno: false,
          badge: 'Ir →'
        });
      });

      // Precalcular campo de búsqueda normalizado una sola vez
      items.forEach(item => {
        item._searchText = normalizarTexto([
          item.titulo,
          item.subtitulo,
          item.tipo,
          item.categoria,
          item.descripcion,
          ...(item.etiquetas || [])
        ].join(' '));
        item._titleNorm = normalizarTexto(item.titulo);
      });

      cachedItems = items;
      cachedAt = Date.now();
      loadingPromise = null;
      return cachedItems;
    })();

    return loadingPromise;
  }

  // ── FILTRADO Y RANKING ─────────────────────────────────
  function buscarEnIndice(items, query) {
    const queryNorm = normalizarTexto(query);
    if (!queryNorm) return [];

    const tokens = queryNorm.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const matches = [];
    items.forEach(item => {
      if (!tokens.every(t => item._searchText.includes(t))) return;

      // Prioridad: coincidencia exacta o en el título > resto de campos
      let score = 0;
      if (item._titleNorm === queryNorm) score += 100;
      else if (item._titleNorm.startsWith(queryNorm)) score += 60;
      else if (tokens.every(t => item._titleNorm.includes(t))) score += 40;
      else if (tokens.some(t => item._titleNorm.includes(t))) score += 20;

      if (item.categoria === 'Contenidos') score += 5;
      else if (item.categoria === 'Eventos') score += 4;
      else if (item.categoria === 'Autores') score += 3;

      matches.push({ item, score });
    });

    matches.sort((a, b) => b.score - a.score);
    return matches.map(m => m.item);
  }

  // ── RENDERIZADO DE RESULTADOS ──────────────────────────
  function renderizarEstadoInicial() {
    activeIndex = -1;
    if (statusEl) statusEl.textContent = 'Escribe para buscar en contenidos, eventos, autores y secciones.';
    if (!resultsEl) return;

    resultsEl.innerHTML = `
      <div class="sh-search-empty">
        <p class="sh-search-hint">Busca por título, autor, tema o etiqueta. No distingue tildes ni mayúsculas (por ejemplo, <em>america</em> encuentra <em>América</em>).</p>
        <div class="sh-search-chips" role="group" aria-label="Búsquedas sugeridas">
          ${SUGERENCIAS_RAPIDAS.map(s => `<button type="button" class="sh-search-chip" data-query="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        </div>
      </div>
    `;
  }

  function renderizarResultados(query, resultados) {
    activeIndex = -1;
    if (!resultsEl) return;

    if (resultados.length === 0) {
      if (statusEl) statusEl.textContent = `Sin resultados para "${query.trim()}".`;
      resultsEl.innerHTML = `
        <div class="sh-search-empty">
          <p class="sh-search-no-results">No se encontraron resultados para <strong>«${escapeHtml(query.trim())}»</strong>.</p>
          <p class="sh-search-hint">Prueba con otro término más amplio o con alguna de estas búsquedas:</p>
          <div class="sh-search-chips">
            ${SUGERENCIAS_RAPIDAS.map(s => `<button type="button" class="sh-search-chip" data-query="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
          </div>
        </div>
      `;
      return;
    }

    const totalMsg = resultados.length === 1
      ? '1 resultado encontrado'
      : `${resultados.length} resultados encontrados`;
    if (statusEl) statusEl.textContent = totalMsg;

    // Agrupar conservando orden de categorías
    const ordenCategorias = ['Contenidos', 'Eventos', 'Autores', 'De Interés', 'Secciones y Páginas'];
    const grupos = new Map();
    ordenCategorias.forEach(cat => grupos.set(cat, []));
    resultados.forEach(r => {
      if (!grupos.has(r.categoria)) grupos.set(r.categoria, []);
      grupos.get(r.categoria).push(r);
    });

    let html = `<div class="sh-search-count">${escapeHtml(totalMsg)}</div>`;
    let globalIdx = 0;

    grupos.forEach((items, categoria) => {
      if (items.length === 0) return;
      html += `<div class="sh-search-group">`;
      html += `<div class="sh-search-group-title">${escapeHtml(categoria)} <span>(${items.length})</span></div>`;
      items.forEach(item => {
        const href = item.esBase64 ? '#' : escapeHtml(item.url || '#');
        const targetAttrs = item.esExterno ? ' target="_blank" rel="noopener noreferrer"' : '';
        const base64Attr = item.esBase64 ? ` data-base64-url="${escapeHtml(item.rawUrl)}" data-base64-title="${escapeHtml(item.titulo)}"` : '';
        html += `
          <a href="${href}"${targetAttrs}${base64Attr} class="sh-search-item" data-result-index="${globalIdx}">
            <div class="sh-search-item-main">
              <div class="sh-search-item-title">${resaltarCoincidencias(item.titulo, query)}</div>
              ${item.subtitulo ? `<div class="sh-search-item-meta">${resaltarCoincidencias(item.subtitulo, query)}</div>` : ''}
              ${item.descripcion ? `<div class="sh-search-item-desc">${resaltarCoincidencias(item.descripcion, query)}</div>` : ''}
            </div>
            <span class="sh-search-item-badge">${escapeHtml(item.badge || 'Ver')}</span>
          </a>
        `;
        globalIdx++;
      });
      html += `</div>`;
    });

    resultsEl.innerHTML = html;
  }

  // ── CONSTRUCCIÓN DEL MODAL (PORTAL EN <body>) ──────────
  function asegurarModal() {
    if (modalEl) return;

    modalEl = document.createElement('div');
    modalEl.id = 'sh-search-modal';
    modalEl.className = 'sh-search-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'sh-search-title');
    modalEl.hidden = true;

    modalEl.innerHTML = `
      <div class="sh-search-backdrop" data-close-search></div>
      <div class="sh-search-dialog">
        <div class="sh-search-header">
          <span id="sh-search-title" class="sh-search-eyebrow">Buscador · Somos Hispanidad</span>
          <button type="button" class="sh-search-close" aria-label="Cerrar buscador" data-close-search>✕</button>
        </div>
        <form class="sh-search-form" role="search">
          <label for="sh-search-input" class="sh-sr-only">Buscar en Somos Hispanidad</label>
          <span class="sh-search-icon-in" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7.5"></circle>
              <path d="M20 20l-3.8-3.8"></path>
            </svg>
          </span>
          <input
            type="search"
            id="sh-search-input"
            class="sh-search-input"
            placeholder="Buscar artículos, autores, eventos, conferencias..."
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" id="sh-search-clear" class="sh-search-clear" aria-label="Limpiar búsqueda" hidden>Limpiar</button>
        </form>
        <div id="sh-search-status" class="sh-sr-only" aria-live="polite" aria-atomic="true"></div>
        <div id="sh-search-results" class="sh-search-results"></div>
        <div class="sh-search-footer">
          <span>↑↓ navegar · Enter abrir · Esc cerrar</span>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    inputEl = modalEl.querySelector('#sh-search-input');
    resultsEl = modalEl.querySelector('#sh-search-results');
    statusEl = modalEl.querySelector('#sh-search-status');
    clearBtnEl = modalEl.querySelector('#sh-search-clear');
    const formEl = modalEl.querySelector('.sh-search-form');
    if (formEl) {
      formEl.addEventListener('submit', function (e) { e.preventDefault(); });
    }

    // Cerrar al pulsar backdrop o botón cerrar
    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-close-search]')) {
        cerrarBuscador();
        return;
      }

      const chip = e.target.closest('.sh-search-chip');
      if (chip) {
        const q = chip.getAttribute('data-query') || '';
        inputEl.value = q;
        inputEl.focus();
        ejecutarBusqueda(q);
        return;
      }

      const itemLink = e.target.closest('.sh-search-item');
      if (itemLink) {
        const b64 = itemLink.getAttribute('data-base64-url');
        if (b64 && typeof abrirDocumentoPdf === 'function') {
          e.preventDefault();
          abrirDocumentoPdf(b64, itemLink.getAttribute('data-base64-title') || 'documento.pdf');
        }
        cerrarBuscador();
      }
    });

    if (clearBtnEl) {
      clearBtnEl.addEventListener('click', function () {
        inputEl.value = '';
        clearBtnEl.hidden = true;
        renderizarEstadoInicial();
        inputEl.focus();
      });
    }

    inputEl.addEventListener('input', function () {
      ejecutarBusqueda(inputEl.value);
    });

    // Navegación por teclado y trampa de foco
    modalEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrarBuscador();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = Array.from(resultsEl.querySelectorAll('.sh-search-item'));
        if (items.length === 0) return;
        e.preventDefault();

        if (e.key === 'ArrowDown') {
          activeIndex = (activeIndex + 1) % items.length;
        } else {
          activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        }

        items.forEach((el, idx) => el.classList.toggle('is-active', idx === activeIndex));
        items[activeIndex].scrollIntoView({ block: 'nearest' });
        return;
      }

      if (e.key === 'Enter' && document.activeElement === inputEl) {
        const items = Array.from(resultsEl.querySelectorAll('.sh-search-item'));
        if (items.length > 0) {
          e.preventDefault();
          const target = items[activeIndex >= 0 ? activeIndex : 0];
          target.click();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusables = Array.from(
          modalEl.querySelectorAll('button:not([hidden]), input:not([disabled]), a[href]')
        ).filter(el => el.offsetParent !== null);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  async function ejecutarBusqueda(rawQuery) {
    const q = String(rawQuery || '');
    if (clearBtnEl) clearBtnEl.hidden = q.trim().length === 0;

    if (!q.trim()) {
      renderizarEstadoInicial();
      return;
    }

    if (!cachedItems) {
      if (resultsEl) {
        resultsEl.innerHTML = '<div class="sh-search-loading">Buscando en el archivo de Somos Hispanidad…</div>';
      }
    }

    const items = await cargarIndice();
    // Si el usuario siguió escribiendo mientras cargaba, usar el valor actual del input
    const currentQuery = inputEl ? inputEl.value : q;
    if (!currentQuery.trim()) {
      renderizarEstadoInicial();
      return;
    }

    const resultados = buscarEnIndice(items, currentQuery);
    renderizarResultados(currentQuery, resultados);
  }

  // ── APERTURA Y CIERRE ──────────────────────────────────
  async function abrirBuscador(initialQuery = '') {
    asegurarModal();
    previouslyFocused = document.activeElement;

    modalEl.hidden = false;
    // Forzar reflow para transición suave
    void modalEl.offsetWidth;
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (initialQuery) {
      inputEl.value = initialQuery;
      ejecutarBusqueda(initialQuery);
    } else if (inputEl.value.trim()) {
      ejecutarBusqueda(inputEl.value);
    } else {
      renderizarEstadoInicial();
      // Precargar índice en segundo plano para respuesta instantánea al teclear
      cargarIndice().catch(() => {});
    }

    setTimeout(() => {
      if (inputEl) inputEl.focus();
    }, 30);
  }

  function cerrarBuscador() {
    if (!modalEl || modalEl.hidden) return;
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (modalEl && !modalEl.classList.contains('open')) {
        modalEl.hidden = true;
      }
    }, 180);

    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  }

  // ── INYECCIÓN EN LA BARRA DE NAVEGACIÓN ────────────────
  function crearBotonLupa() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'nav-search-btn';
    btn.className = 'nav-search-btn';
    btn.setAttribute('aria-label', 'Buscar en la web');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-controls', 'sh-search-modal');
    btn.setAttribute('title', 'Buscar en toda la web');
    btn.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7.5"></circle>
        <path d="M20 20l-3.8-3.8"></path>
      </svg>
    `;
    btn.addEventListener('click', function () {
      abrirBuscador();
    });
    return btn;
  }

  function conectarAlMenu() {
    const navbar = document.getElementById('navbar');
    if (navbar && !document.getElementById('nav-search-btn')) {
      const hamburger = document.getElementById('hamburger');
      const searchBtn = crearBotonLupa();

      if (hamburger && hamburger.parentNode === navbar) {
        let actions = navbar.querySelector('.nav-actions');
        if (!actions) {
          actions = document.createElement('div');
          actions.className = 'nav-actions';
          navbar.insertBefore(actions, hamburger);
          actions.appendChild(searchBtn);
          actions.appendChild(hamburger);
        } else {
          actions.insertBefore(searchBtn, hamburger);
        }
      } else {
        navbar.appendChild(searchBtn);
      }
    }

    // Acceso en el menú móvil desplegable
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && !document.getElementById('mobile-search-btn')) {
      const mobileBtn = document.createElement('button');
      mobileBtn.type = 'button';
      mobileBtn.id = 'mobile-search-btn';
      mobileBtn.className = 'mobile-search-trigger';
      mobileBtn.innerHTML = '<span>Buscar en la web</span><span aria-hidden="true">⌕</span>';
      mobileBtn.addEventListener('click', function () {
        if (typeof closeMobile === 'function') closeMobile();
        abrirBuscador();
      });
      mobileMenu.insertBefore(mobileBtn, mobileMenu.firstChild);
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;

    conectarAlMenu();
    asegurarModal();

    // Atajo global Ctrl+K / Cmd+K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        abrirBuscador();
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.SomosBuscador = {
      init,
      open: abrirBuscador,
      close: cerrarBuscador,
      normalizarTexto
    };
  }
})();
