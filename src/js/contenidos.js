/*
 * =====================================================
 * SOMOS HISPANIDAD — Datos y lógica de Contenidos
 * Archivo: src/js/contenidos.js
 *
 * Contiene los datos simulados de artículos, vídeos
 * y charlas, y las funciones para mostrarlos.
 * =====================================================
 */

// ── DATOS SIMULADOS DE CONTENIDOS ────────────────────────
const CONTENIDOS_SIMULADOS = [
  {
    id: 1,
    tipo: "Escrito",
    titulo: "Justicia Real en la América Española",
    autor: "César Pérez Guevara",
    fecha: "21 Abr 2026",
    created_at: "2026-04-21T10:00:00Z",
    imagen: null,
    imagen_texto: "ESCRITO",
    descripcion: "Un análisis riguroso del sistema judicial que España desplegó en el Nuevo Mundo.",
    url: "https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Escritos/Hispanoamerica%20y%20una%20justicia%20real%20olvidada.pdf",
    etiquetas: ["Justicia", "América", "Imperio"]
  },
  {
    id: 2,
    tipo: "Vídeo",
    titulo: "El papel de los indígenas en la conquista de América",
    autor: "José J. Laorden",
    fecha: "8 Abr 2026",
    created_at: "2026-04-08T10:00:00Z",
    imagen: null,
    imagen_texto: "VÍDEO",
    descripcion: "Revisión histórica del papel activo de los pueblos mesoamericanos como aliados.",
    url: "https://youtu.be/afx1w-wiLCg",
    etiquetas: ["Indígenas", "Conquista", "Mesoamérica"]
  },
  {
    id: 3,
    tipo: "Barómetro",
    titulo: "Barómetro de la Hispanidad 2026 — Informe Completo",
    autor: "Equipo Investigador",
    fecha: "18 Mar 2026",
    created_at: "2026-03-18T10:00:00Z",
    imagen: null,
    imagen_texto: "BARÓMETRO",
    descripcion: "Resultados completos del estudio anual sobre la percepción de la Hispanidad.",
    url: "https://fzftntxrkagnvchhwehn.supabase.co/storage/v1/object/public/Documentos/Barometro-versiones/BAROMETRO.pdf",
    etiquetas: ["Barómetro", "Investigación", "Identidad"]
  }
];

// ── DATOS SIMULADOS DE AUTORES ────────────────────────────
const AUTORES_SIMULADOS = [
  {
    id: 1,
    nombre: "César Pérez Guevara",
    cargo: "Historiador y Escritor",
    especialidad: "Sistema jurídico colonial español",
    bio: "Especialista en la historia del derecho en la América colonial. Autor de «Justicia Real en la América Española».",
    imagen: null
  },
  {
    id: 2,
    nombre: "José J. Laorden",
    cargo: "Conferenciante e Investigador",
    especialidad: "Conquista de América y pueblos indígenas",
    bio: "Investigador independiente especializado en el estudio de las alianzas entre pueblos indígenas y españoles durante la conquista.",
    imagen: null
  },
  {
    id: 3,
    nombre: "Francisco Massó",
    cargo: "Analista político y escritor",
    especialidad: "Revisionismo histórico y geopolítica hispana",
    bio: "Analista y ensayista especializado en el estudio del revisionismo histórico y la narrativa política en Iberoamérica.",
    imagen: null
  },
  {
    id: 4,
    nombre: "Redacción Somos Hispanidad",
    cargo: "Equipo Editorial",
    especialidad: "Divulgación histórica y cultural",
    bio: "El equipo de redacción de Somos Hispanidad está formado por historiadores, periodistas y colaboradores comprometidos con la divulgación de la verdad histórica.",
    imagen: null
  }
];


// ── FUNCIÓN: RENDERIZAR TARJETAS DE CONTENIDO ─────────────
function normalizarTexto(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function actualizarBannerAutor(contenedor, filtroAutor, filtroTipo) {
  const existing = document.getElementById('autor-filter-banner');
  if (existing) existing.remove();
  if (!filtroAutor || !contenedor || !contenedor.parentNode) return;

  const banner = document.createElement('div');
  banner.id = 'autor-filter-banner';
  banner.style.cssText = 'display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top:24px; padding:12px 18px; background:var(--cream); border:1px solid var(--sepia-light);';

  const label = document.createElement('span');
  label.style.cssText = "font-family:'Lato',sans-serif; font-size:0.8rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--sepia-dark);";
  label.textContent = `Mostrando publicaciones de: ${filtroAutor}`;

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'filtro-btn';
  clearBtn.textContent = 'Ver todos los autores ✕';
  clearBtn.addEventListener('click', function() {
    const url = new URL(window.location.href);
    url.searchParams.delete('autor');
    window.history.replaceState({}, '', url.toString());
    initFiltros('');
    renderizarContenidos('lista-contenidos', 0, filtroTipo, '');
  });

  banner.appendChild(label);
  banner.appendChild(clearBtn);
  contenedor.parentNode.insertBefore(banner, contenedor);
}

/**
 * Genera tarjetas de contenido en el contenedor indicado.
 * @param {string} contenedorId - Id del elemento HTML
 * @param {number} limite - Cuántos mostrar (0 = todos)
 * @param {string} filtroTipo - Filtrar por tipo ("Escrito", "Vídeo", etc.) o vacío para todos
 * @param {string} filtroAutor - Filtrar por nombre de autor o vacío para todos
 */
async function renderizarContenidos(contenedorId, limite = 0, filtroTipo = '', filtroAutor = '') {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  let lista = await getContenidos();

  // Ordenar explícitamente de más reciente a más lejana por created_at
  lista.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });

  if (filtroTipo) {
    lista = lista.filter(c => c.tipo === filtroTipo);
  } else {
    // Por defecto en la lista general de contenidos.html, excluir Folletos para que pertenezcan a la Agenda de Eventos y De Interés
    lista = lista.filter(c => c.tipo !== 'Folleto');
  }

  if (filtroAutor) {
    const autorNorm = normalizarTexto(filtroAutor);
    lista = lista.filter(c => normalizarTexto(c.autor) === autorNorm);
  }

  if (contenedorId === 'lista-contenidos') {
    actualizarBannerAutor(contenedor, filtroAutor, filtroTipo);
  }

  if (limite > 0) {
    lista = lista.slice(0, limite);
  }

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="body-text">No hay contenidos disponibles en este momento.</p>';
    return;
  }

  contenedor.innerHTML = lista.map(c => {
    // Auto-generar miniatura de YouTube si no hay imagen pero hay URL de YouTube
    let imgSrc = c.imagen;
    if (!imgSrc && c.url) {
      const ytMatch = c.url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
      );
      if (ytMatch) {
        imgSrc = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }

    const isFolleto = c.tipo === 'Folleto';
    const isPdf = isFolleto || (c.url && c.url.toLowerCase().includes('.pdf'));
    const placeholderText = c.imagen_texto || c.tipo.toUpperCase();
    const pdfLabel = isFolleto
      ? 'DOCUMENTO PDF'
      : `${(c.tipo === 'Escrito' ? 'ARTÍCULO' : c.tipo).toUpperCase()} · PDF`;
    const placeholderHtml = isPdf
      ? `<div class="post-thumb-placeholder" style="background: linear-gradient(135deg, #2c1a0e 0%, #4a2e1b 100%); color: #e2c08d; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:180px;">
           <span style="font-size:2.2rem;">📄</span>
           <span style="font-family:'Cinzel',serif; font-size:0.75rem; letter-spacing:0.15em; font-weight:600;">${pdfLabel}</span>
         </div>`
      : `<div class="post-thumb-placeholder">${placeholderText}</div>`;

    const ctaTexto = c.tipo === 'Vídeo'
      ? 'Ver vídeo'
      : isFolleto
        ? 'Ver Folleto (PDF)'
        : (c.tipo === 'Escrito' || c.tipo === 'Artículo')
          ? (isPdf ? 'Leer artículo (PDF)' : 'Leer artículo')
          : isPdf
            ? 'Ver documento (PDF)'
            : 'Ver contenido';

    return `
    <article class="post-card reveal" id="${c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}">
      ${imgSrc
        ? `<img src="${imgSrc}" alt="${c.titulo}" class="post-thumb" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           ${placeholderHtml}`
        : placeholderHtml
      }
      <div class="post-body">
        <p class="post-meta">${c.fecha} · ${c.tipo} · ${c.autor}</p>
        <h3 class="post-title">${c.titulo}</h3>
        <p style="font-family:'Cormorant Garamond',serif; font-size:0.95rem; color:var(--ink-soft); line-height:1.7; margin-bottom:16px;">${c.descripcion}</p>
        ${c.url && c.url !== '#' ? `
        <a href="${typeof resolverRutaPdf === 'function' ? resolverRutaPdf(c.url) : c.url}" class="post-link" target="_blank" rel="noopener">
          ${ctaTexto} →
        </a>` : ''}
      </div>
    </article>
  `}).join('');

  activarReveal();
}


// ── FUNCIÓN: RENDERIZAR AUTORES ───────────────────────────
async function renderizarAutores(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const autores = await getAutores();

  contenedor.innerHTML = autores.map(a => `
    <div class="post-card reveal">
      <div class="post-thumb-placeholder" style="aspect-ratio:1/1;">
        ${a.imagen
          ? `<img src="${a.imagen}" alt="${a.nombre}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <span style="font-size:2rem; display:none; align-items:center; justify-content:center; width:100%; height:100%;">👤</span>`
          : '<span style="font-size:2rem; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">👤</span>'
        }
      </div>
      <div class="post-body">
        <p class="post-meta">${a.especialidad}</p>
        <h3 class="post-title">${a.nombre}</h3>
        <p style="font-family:'Lato',serif; font-size:0.75rem; color:var(--gold); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:10px;">${a.cargo}</p>
        <p style="font-family:'Cormorant Garamond',serif; font-size:1rem; color:var(--ink-soft); line-height:1.7; margin-bottom:16px;">${a.bio}</p>
        <a href="contenidos.html?autor=${encodeURIComponent(a.nombre)}" class="post-link" style="margin-top:auto;">Ver publicaciones →</a>
      </div>
    </div>
  `).join('');

  activarReveal();
}


// ── FUNCIÓN: FILTROS DE CONTENIDO ─────────────────────────
function initFiltros(filtroAutor = '') {
  const botones = document.querySelectorAll('[data-filtro]');
  botones.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function() {
      document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tipo = this.getAttribute('data-filtro');
      renderizarContenidos('lista-contenidos', 0, tipo === 'todos' ? '' : tipo, filtroAutor);
    });
  });
}


// ── INICIALIZAR AL CARGAR LA PÁGINA ──────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  if (document.getElementById('lista-contenidos')) {
    const params = new URLSearchParams(window.location.search);
    const filtroAutor = params.get('autor') || '';
    await renderizarContenidos('lista-contenidos', 0, '', filtroAutor);
    initFiltros(filtroAutor);
  }

  if (document.getElementById('lista-autores')) {
    await renderizarAutores('lista-autores');
  }

  // Preview en inicio: solo 3 contenidos
  if (document.getElementById('contenidos-preview')) {
    await renderizarContenidos('contenidos-preview', 3);
  }

  // Actualizar enlace del Barómetro dinámicamente si existe en Supabase
  const btnBarometro = document.getElementById('btn-barometro');
  if (btnBarometro) {
    const contenidos = await getContenidos();
    // Buscar la versión más reciente del Barómetro (soporta con y sin tilde)
    const barometroData = contenidos.find(c => 
      c.titulo.toLowerCase().includes('barómetro') || 
      c.titulo.toLowerCase().includes('barometro')
    );
    if (barometroData && barometroData.url && barometroData.url !== '#') {
      btnBarometro.href = barometroData.url;
    }
  }
});
