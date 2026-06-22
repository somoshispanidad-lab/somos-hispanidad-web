/*
 * =====================================================
 * SOMOS HISPANIDAD — JavaScript del Panel de Admin
 * Archivo: src/admin/admin.js
 *
 * Gestiona la navegación entre paneles del admin.
 * En el futuro incluirá autenticación con Supabase.
 * =====================================================
 */

document.addEventListener('DOMContentLoaded', async function () {
  
  let editingId = null;
  let heartbeatInterval = null;

  // Generar o recuperar session_id único para la pestaña actual
  let mySessionId = sessionStorage.getItem('admin_session_id');
  if (!mySessionId) {
    mySessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('admin_session_id', mySessionId);
  }

  // ── DETECTAR FUERZA DE CIERRE DE SESIÓN ──────────────
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('force_logout') === 'true') {
    console.log('🧹 Forzando el cierre de todas las sesiones activas...');
    try {
      if (mySessionId) {
        await supabaseClient.from('active_admin_sessions').delete().eq('session_id', mySessionId);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      await supabaseClient.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      // Eliminar el Service Worker registrado inmediatamente para evitar interceptación errónea de caché antigua
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('🗑️ SW antiguo desregistrado con éxito.');
        }
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('✅ Sesiones locales y remotas totalmente limpias.');
    } catch (e) {
      console.error('Error al forzar el cierre de sesión:', e);
    }
  }

  const loginWrapper = document.getElementById('login-wrapper');
  const recoveryWrapper = document.getElementById('recovery-wrapper');
  const updatePasswordWrapper = document.getElementById('update-password-wrapper');
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  
  const loginForm = document.getElementById('admin-login-form');
  const recoveryForm = document.getElementById('admin-recovery-form');
  const updatePasswordForm = document.getElementById('admin-update-password-form');
  
  const loginError = document.getElementById('login-error');
  const btnLogout = document.querySelector('.admin-topbar-actions .admin-btn-outline');
  const adminUserSpan = document.querySelector('.admin-user');

  // ── AUTENTICACIÓN CON SUPABASE ─────────────────────
  let isRecoveryMode = false;

  async function checkAuth() {
    if (isRecoveryMode) return; // No hacer checkAuth normal si estamos en modo recuperación
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const allowedAdmins = [
        'javier@iaparaseniors.org',
        'somoshispanidad@gmail.com',
        'adelaida.pm@gmail.com',
        'muygines@gmail.com',
        'chemillorente@gmail.com'
      ];
      
      if (!allowedAdmins.includes(session.user.email)) {
        console.warn('Acceso denegado: el correo no está en la lista de administradores autorizados:', session.user.email);
        loginError.textContent = 'Acceso denegado: este correo no tiene permisos de administrador.';
        loginError.style.display = 'block';
        await supabaseClient.auth.signOut();
        return;
      }

      // Comprobar si hay otro administrador activo conectado (latido en los últimos 45 segundos)
      const threshold = new Date(Date.now() - 45000).toISOString();
      const { data: activeSessions, error: sessionErr } = await supabaseClient
        .from('active_admin_sessions')
        .select('*')
        .neq('session_id', mySessionId)
        .gt('last_heartbeat', threshold);

      if (sessionErr) {
        console.error('Error al comprobar sesiones activas:', sessionErr.message);
      } else if (activeSessions && activeSessions.length > 0) {
        console.warn('Acceso denegado: ya hay otro administrador conectado:', activeSessions[0].user_email);
        loginError.textContent = 'Acceso denegado: Administrador ya conectado.';
        loginError.style.display = 'block';
        
        // Limpiamos el heartbeat y cerramos sesión
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        await supabaseClient.auth.signOut();
        return;
      }

      // Registrar o actualizar nuestra sesión
      const { error: upsertErr } = await supabaseClient
        .from('active_admin_sessions')
        .upsert({
          session_id: mySessionId,
          user_email: session.user.email,
          last_heartbeat: new Date().toISOString()
        });

      if (upsertErr) {
        console.error('Error al registrar sesión activa:', upsertErr.message);
      }

      // Iniciar el latido de sesión (heartbeat) cada 15 segundos
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(async () => {
          const { error } = await supabaseClient
            .from('active_admin_sessions')
            .upsert({
              session_id: mySessionId,
              user_email: session.user.email,
              last_heartbeat: new Date().toISOString()
            });
          if (error) {
            console.error('Error enviando latido de sesión:', error.message);
          }
        }, 15000);
      }

      // Mostrar dashboard
      loginWrapper.style.display = 'none';
      recoveryWrapper.style.display = 'none';
      updatePasswordWrapper.style.display = 'none';
      dashboardWrapper.style.display = 'flex';
      adminUserSpan.textContent = session.user.email;
      // Cargar datos
      loadAllData();
    } else {
      // Mostrar login
      loginWrapper.style.display = 'flex';
      recoveryWrapper.style.display = 'none';
      updatePasswordWrapper.style.display = 'none';
      dashboardWrapper.style.display = 'none';
    }
  }

  // Listener del formulario de login
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      loginError.style.display = 'none';

      const btn = loginForm.querySelector('button');
      btn.textContent = 'Accediendo...';
      btn.disabled = true;

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      
      btn.textContent = 'Acceder';
      btn.disabled = false;

      if (error) {
        loginError.textContent = error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message;
        loginError.style.display = 'block';
      } else {
        await checkAuth();
      }
    });
  }

  // Links de Recuperación
  document.getElementById('link-forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginWrapper.style.display = 'none';
    recoveryWrapper.style.display = 'flex';
  });

  document.getElementById('link-back-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    recoveryWrapper.style.display = 'none';
    loginWrapper.style.display = 'flex';
  });

  // Formulario de Recuperación
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('recovery-email').value;
      const msg = document.getElementById('recovery-msg');
      const btn = recoveryForm.querySelector('button');
      
      msg.style.display = 'none';
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });

      btn.textContent = 'Enviar enlace';
      btn.disabled = false;

      msg.style.display = 'block';
      if (error) {
        msg.style.color = 'red';
        msg.textContent = 'Error: ' + error.message;
      } else {
        msg.style.color = 'green';
        msg.textContent = '¡Enlace enviado! Revisa tu bandeja de entrada.';
      }
    });
  }

  // Formulario de Nueva Contraseña
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const password = document.getElementById('update-password-input').value;
      const msg = document.getElementById('update-msg');
      const btn = updatePasswordForm.querySelector('button');

      msg.style.display = 'none';
      btn.textContent = 'Actualizando...';
      btn.disabled = true;

      const { error } = await supabaseClient.auth.updateUser({ password: password });

      btn.textContent = 'Actualizar contraseña';
      btn.disabled = false;

      msg.style.display = 'block';
      if (error) {
        msg.style.color = 'red';
        msg.textContent = 'Error: ' + error.message;
      } else {
        msg.style.color = 'green';
        msg.textContent = '¡Contraseña actualizada! Volviendo al inicio...';
        setTimeout(() => {
          isRecoveryMode = false;
          checkAuth();
        }, 2000);
      }
    });
  }

  // Listener para cerrar sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', async function(e) {
      e.preventDefault();
      
      // Limpiar sesión activa en base de datos
      if (mySessionId) {
        try {
          await supabaseClient.from('active_admin_sessions').delete().eq('session_id', mySessionId);
        } catch (err) {
          console.error('Error al eliminar sesión de la base de datos:', err);
        }
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      await supabaseClient.auth.signOut();
      await checkAuth();
    });
  }

  // Verificar estado inicial
  await checkAuth();

  // Escuchar cambios de auth
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    if (event === 'PASSWORD_RECOVERY') {
      isRecoveryMode = true;
      loginWrapper.style.display = 'none';
      dashboardWrapper.style.display = 'none';
      recoveryWrapper.style.display = 'none';
      updatePasswordWrapper.style.display = 'flex';
    } else if (event === 'SIGNED_OUT') {
      // Aseguramos limpieza al cerrar sesión
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      if (!isRecoveryMode) checkAuth();
    } else if (event === 'SIGNED_IN') {
      if (!isRecoveryMode) checkAuth();
    }
  });

  // ── NAVEGACIÓN ENTRE PANELES ──────────────────────
  const navLinks = document.querySelectorAll('.admin-nav-link[data-panel]');
  const panels   = document.querySelectorAll('.admin-panel');
  const panelTitle = document.getElementById('panel-title');

  const titulos = {
    eventos: 'Gestión de Eventos',
    contenidos: 'Gestión de Contenidos',
    autores: 'Gestión de Autores',
    simpatizantes: 'Simpatizantes',
    mensajes: 'Mensajes Recibidos',
    marketing: 'Marketing & Comunicaciones',
    estadisticas: 'Estadísticas Web (Vercel)',
    ajustes: 'Configuración General',
    manual: 'Manual de Uso del Panel'
  };

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const panelId = this.getAttribute('data-panel');

      // Actualizar clases activas del menú
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      // Mostrar el panel correspondiente
      panels.forEach(p => p.classList.remove('active'));
      const panelEl = document.getElementById('panel-' + panelId);
      if (panelEl) {
        panelEl.classList.add('active');
        if (panelId === 'estadisticas') {
          loadRealStatistics();
        }
      }

      // Actualizar el título del topbar
      if (panelTitle && titulos[panelId]) {
        panelTitle.textContent = titulos[panelId];
      }
    });
  });

  // ── LÓGICA DE FORMULARIO DE AJUSTES (LISTAS DE ENLACES) ──
  let listLecturas = [];
  let listPaginas = [];
  let listDivulgadores = [];

  function renderAdminLinkList(containerId, list, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = '<div style="color:#8a7a6a; font-size:0.85rem; padding:8px;">No hay enlaces en esta sección.</div>';
      return;
    }
    container.innerHTML = list.map((item, index) => `
      <div class="admin-link-item" style="display:flex; justify-content:space-between; align-items:center; background:#f9f6f0; border:1px solid #e8e0d0; padding:8px 12px; margin-bottom:8px; border-radius:4px;">
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:12px; text-align:left;">
          <strong style="color:var(--sepia-deep); font-size:0.85rem;">${item.title}</strong>
          <span style="font-size:0.75rem; color:#8a7a6a; display:block;">${item.url}</span>
        </div>
        <button type="button" class="admin-btn-sm red delete-link-btn" data-type="${type}" data-index="${index}" style="padding:2px 8px; font-size:0.6rem;">Eliminar</button>
      </div>
    `).join('');
  }

  async function autoSaveSetting(key, list, statusBadgeId) {
    const badge = document.getElementById(statusBadgeId);
    if (badge) {
      badge.textContent = '💾 Guardando...';
      badge.style.display = 'inline-block';
      badge.style.opacity = '1';
      badge.style.background = '#fff3e0';
      badge.style.color = '#e65100';
    }
    
    const ok = await saveSetting(key, JSON.stringify(list));
    
    if (badge) {
      if (ok) {
        badge.textContent = '✓ Guardado';
        badge.style.background = '#e8f5e9';
        badge.style.color = '#2e7d32';
        setTimeout(() => {
          badge.style.opacity = '0';
          setTimeout(() => {
            badge.style.display = 'none';
            badge.style.opacity = '1';
          }, 300);
        }, 1500);
      } else {
        badge.textContent = '✗ Error';
        badge.style.background = '#ffebee';
        badge.style.color = '#c62828';
      }
    }
  }

  // Listener Añadir Lectura
  document.getElementById('btn-add-lectura')?.addEventListener('click', async () => {
    const titleInput = document.getElementById('add-lectura-title');
    const urlInput = document.getElementById('add-lectura-url');
    const title = titleInput.value.trim();
    let url = urlInput.value.trim();
    if (!title || !url) return alert('Por favor, introduce el nombre y la URL.');
    if (!url.startsWith('http')) {
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else {
        return alert('La URL debe empezar por http:// o https://');
      }
    }
    listLecturas.push({ title, url });
    titleInput.value = '';
    urlInput.value = '';
    renderAdminLinkList('admin-list-lecturas', listLecturas, 'lecturas');
    await autoSaveSetting('lecturas_recomendadas', listLecturas, 'save-status-lecturas');
  });

  // Listener Añadir Página Amiga
  document.getElementById('btn-add-pagina')?.addEventListener('click', async () => {
    const titleInput = document.getElementById('add-pagina-title');
    const urlInput = document.getElementById('add-pagina-url');
    const title = titleInput.value.trim();
    let url = urlInput.value.trim();
    if (!title || !url) return alert('Por favor, introduce el nombre y la URL.');
    if (!url.startsWith('http')) {
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else {
        return alert('La URL debe empezar por http:// o https://');
      }
    }
    listPaginas.push({ title, url });
    titleInput.value = '';
    urlInput.value = '';
    renderAdminLinkList('admin-list-paginas', listPaginas, 'paginas');
    await autoSaveSetting('paginas_amigas', listPaginas, 'save-status-paginas');
  });

  // Listener Añadir Divulgador
  document.getElementById('btn-add-divulgador')?.addEventListener('click', async () => {
    const titleInput = document.getElementById('add-divulgador-title');
    const urlInput = document.getElementById('add-divulgador-url');
    const title = titleInput.value.trim();
    let url = urlInput.value.trim();
    if (!title || !url) return alert('Por favor, introduce el nombre y la URL.');
    if (!url.startsWith('http')) {
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else {
        return alert('La URL debe empezar por http:// o https://');
      }
    }
    listDivulgadores.push({ title, url });
    titleInput.value = '';
    urlInput.value = '';
    renderAdminLinkList('admin-list-divulgadores', listDivulgadores, 'divulgadores');
    await autoSaveSetting('divulgadores', listDivulgadores, 'save-status-divulgadores');
  });

  // Event Delegation para Borrar enlaces
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-link-btn')) {
      const type = e.target.getAttribute('data-type');
      const index = parseInt(e.target.getAttribute('data-index'));
      
      if (type === 'lecturas') {
        listLecturas.splice(index, 1);
        renderAdminLinkList('admin-list-lecturas', listLecturas, 'lecturas');
        await autoSaveSetting('lecturas_recomendadas', listLecturas, 'save-status-lecturas');
      } else if (type === 'paginas') {
        listPaginas.splice(index, 1);
        renderAdminLinkList('admin-list-paginas', listPaginas, 'paginas');
        await autoSaveSetting('paginas_amigas', listPaginas, 'save-status-paginas');
      } else if (type === 'divulgadores') {
        listDivulgadores.splice(index, 1);
        renderAdminLinkList('admin-list-divulgadores', listDivulgadores, 'divulgadores');
        await autoSaveSetting('divulgadores', listDivulgadores, 'save-status-divulgadores');
      }
    }
  });

  // Enviar con Enter en los inputs
  const setupEnterKey = (titleId, urlId, btnId) => {
    const handler = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById(btnId)?.click();
      }
    };
    document.getElementById(titleId)?.addEventListener('keydown', handler);
    document.getElementById(urlId)?.addEventListener('keydown', handler);
  };
  setupEnterKey('add-lectura-title', 'add-lectura-url', 'btn-add-lectura');
  setupEnterKey('add-pagina-title', 'add-pagina-url', 'btn-add-pagina');
  setupEnterKey('add-divulgador-title', 'add-divulgador-url', 'btn-add-divulgador');

  const btnGuardarAjustes = document.getElementById('btn-guardar-ajustes');
  if (btnGuardarAjustes) {
    btnGuardarAjustes.addEventListener('click', async function () {
      const msgEl = document.getElementById('ajustes-save-msg');
      btnGuardarAjustes.textContent = 'Guardando...';
      btnGuardarAjustes.disabled = true;
      msgEl.style.display = 'none';
      
      try {
        const ok1 = await saveSetting('lecturas_recomendadas', JSON.stringify(listLecturas));
        const ok2 = await saveSetting('paginas_amigas', JSON.stringify(listPaginas));
        const ok3 = await saveSetting('divulgadores', JSON.stringify(listDivulgadores));
        
        btnGuardarAjustes.textContent = '💾 Guardar todos los ajustes';
        btnGuardarAjustes.disabled = false;
        
        msgEl.style.display = 'block';
        if (ok1 && ok2 && ok3) {
          msgEl.style.background = '#e8f5e9';
          msgEl.style.color = '#2e7d32';
          msgEl.textContent = '✦ Ajustes guardados correctamente y aplicados en toda la web.';
        } else {
          msgEl.style.background = '#ffebee';
          msgEl.style.color = '#c62828';
          msgEl.textContent = 'Error guardando algunos ajustes en Supabase.';
        }
      } catch (err) {
        btnGuardarAjustes.textContent = '💾 Guardar todos los ajustes';
        btnGuardarAjustes.disabled = false;
        msgEl.style.display = 'block';
        msgEl.style.background = '#ffebee';
        msgEl.style.color = '#c62828';
        msgEl.textContent = 'Error: ' + err.message;
      }
    });
  }

  // ── RESETEAR ESTADÍSTICAS ──────────────────────────
  const btnResetStats = document.getElementById('btn-reset-stats');
  if (btnResetStats) {
    btnResetStats.addEventListener('click', async function () {
      if (!confirm('⚠️ ¿Estás completamente seguro de que deseas restablecer y borrar a 0 todas las estadísticas de visitas reales? Esta acción no se puede deshacer.')) return;
      
      btnResetStats.textContent = 'Borrando...';
      btnResetStats.disabled = true;
      
      const { error } = await supabaseClient
        .from('page_views')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Borra todo
        
      btnResetStats.textContent = '⚠️ Restablecer Datos';
      btnResetStats.disabled = false;
      
      if (error) {
        alert('Error al restablecer las estadísticas: ' + error.message);
      } else {
        alert('✦ Estadísticas restablecidas correctamente a 0.');
        await loadRealStatistics();
      }
    });
  }

  // ── BOTONES DE ACCIÓN (simulados) ────────────────
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('admin-btn-sm') && e.target.textContent.trim() === 'Eliminar') {
      if (!confirm('¿Seguro que deseas eliminar este elemento?')) return;
      const fila = e.target.closest('tr');
      if (fila) fila.style.opacity = '0.4';
      // En el futuro: llamada a Supabase para eliminar
    }
  });


  // ── CARGA DE DATOS DESDE SUPABASE ──────────────────
  async function loadAllData() {
    console.log('🔄 Iniciando carga de datos...');
    const { data: { session } } = await supabaseClient.auth.getSession();
    console.log('🔑 Sesión activa:', session ? session.user.email : 'NINGUNA');

    // Cargar cada sección de forma independiente para que un error no bloquee todo
    try { await loadEvents(); } catch(e) { console.error('Error eventos:', e); }
    try { await loadContents(); } catch(e) { console.error('Error contenidos:', e); }
    try { await loadAuthors(); } catch(e) { console.error('Error autores:', e); }
    try { await loadSupporters(); } catch(e) { console.error('Error simpatizantes:', e); }
    try { await loadMessages(); } catch(e) { console.error('Error mensajes:', e); }
    try { await loadSettings(); } catch(e) { console.error('Error settings:', e); }
    try { await loadRealStatistics(); } catch(e) { console.error('Error real stats:', e); }
    try { await loadVisitas(); } catch(e) { console.error('Error visitas:', e); }
  }

  async function loadVisitas() {
    const { data, error } = await supabaseClient.from('cultural_visits').select('*').order('visit_date', { ascending: false });
    const tbody = document.querySelector('#panel-visitas tbody');
    if (error) {
      console.error('Error Supabase (Visitas):', error);
      return tbody.innerHTML = `<tr><td colspan="4" style="color:red; padding:20px;">Error cargando visitas: ${error.message}</td></tr>`;
    }
    if (!data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;">No hay visitas registradas.</td></tr>';
    
    tbody.innerHTML = data.map(v => {
      const d = new Date(v.visit_date).toLocaleDateString('es-ES');
      const badgePub = v.published ? '<span class="admin-badge green">Visible</span>' : '<span class="admin-badge red" style="background:#fee2e2; color:#b91c1c;">Oculto</span>';
      return `
        <tr>
          <td>${d}</td>
          <td><strong>${v.title}</strong></td>
          <td>${badgePub}</td>
          <td>
            <button class="admin-btn-sm" onclick="editVisita('${v.id}')">Editar</button>
            <button class="admin-btn-sm red" onclick="deleteVisita('${v.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadEvents() {
    const { data, error } = await supabaseClient.from('events').select('*').order('event_date', { ascending: false });
    const tbody = document.querySelector('#panel-eventos tbody');
    if (error) {
      console.error('Error Supabase (Events):', error);
      return tbody.innerHTML = `<tr><td colspan="7" style="color:red; padding:20px;">Error cargando eventos: ${error.message}</td></tr>`;
    }
    if (!data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;">No hay eventos registrados.</td></tr>';
    
    tbody.innerHTML = data.map(ev => {
      const d = new Date(ev.event_date).toLocaleDateString('es-ES');
      const badgeReg = ev.registration_open ? '<span class="admin-badge green">Abierto</span>' : '<span class="admin-badge yellow">Cerrado</span>';
      const badgePub = ev.published ? '<span class="admin-badge green">Visible</span>' : '<span class="admin-badge red" style="background:#fee2e2; color:#b91c1c;">Oculto</span>';
      const evTitleEsc = (ev.title || '').replace(/'/g, "\\'");
      return `<tr>
        <td data-label="Fecha">${d}</td>
        <td data-label="Título">${ev.title}</td>
        <td data-label="Tipo">${ev.event_type}</td>
        <td data-label="Lugar">${ev.location}</td>
        <td data-label="Estado">${badgePub} ${badgeReg}</td>
        <td data-label="Inscritos">
          <button class="admin-btn-sm inscritos-btn" data-id="${ev.id}" data-titulo="${evTitleEsc}" style="background:#e0f2fe; color:#0369a1; border-color:#7dd3fc;">
            👥 Ver inscritos
          </button>
        </td>
        <td data-label="Acciones">
          <button class="admin-btn-sm edit-btn" data-table="events" data-id="${ev.id}">Editar</button>
          <button class="admin-btn-sm red delete-btn" data-table="events" data-id="${ev.id}">Eliminar</button>
        </td>
      </tr>`;
    }).join('');
  }

  async function loadContents() {
    const tbody = document.querySelector('#panel-contenidos tbody');
    if (!tbody) return;

    const { data, error } = await supabaseClient
      .from('contents')
      .select('*, authors(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error Supabase (Contents):', error);
      tbody.innerHTML = `<tr><td colspan="6" style="color:red; padding:20px;">Error: ${error.message}</td></tr>`;
      return;
    }
    
    console.log('📦 Contenidos recibidos:', data);
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; color:#666;">La tabla "contents" está vacía o no tienes permisos de lectura.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(c => {
      const d = new Date(c.created_at).toLocaleDateString('es-ES');
      const autor = c.authors?.name || '-';
      const statusBadge = c.published 
        ? '<span class="admin-badge green">Visible</span>' 
        : '<span class="admin-badge red" style="background:#fee2e2; color:#b91c1c;">Oculto</span>';
      
      return `<tr>
        <td data-label="Fecha">${d}</td>
        <td data-label="Título">${c.title}</td>
        <td data-label="Tipo">${c.content_type}</td>
        <td data-label="Autor">${autor}</td>
        <td data-label="Estado">${statusBadge}</td>
        <td data-label="Acciones">
          <button class="admin-btn-sm edit-btn" data-table="contents" data-id="${c.id}">Editar</button> 
          <button class="admin-btn-sm red delete-btn" data-table="contents" data-id="${c.id}">Eliminar</button>
        </td>
      </tr>`;
    }).join('');
  }

  async function loadAuthors() {
    const { data, error } = await supabaseClient.from('authors').select('*').order('name');
    const tbody = document.querySelector('#panel-autores tbody');
    if (error) {
      console.error('Error Supabase (Authors):', error);
      return tbody.innerHTML = '<tr><td colspan="4" style="color:red; padding:20px;">Error cargando autores</td></tr>';
    }
    if (!data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;">No hay autores registrados.</td></tr>';
    
    tbody.innerHTML = data.map(a => {
      const badgePub = a.published ? '<span class="admin-badge green">Visible</span>' : '<span class="admin-badge red" style="background:#fee2e2; color:#b91c1c;">Oculto</span>';
      return `<tr><td data-label="Nombre">${a.name}</td><td data-label="Cargo">${a.cargo || '-'}</td><td data-label="Estado">${badgePub}</td><td data-label="Acciones"><button class="admin-btn-sm edit-btn" data-table="authors" data-id="${a.id}">Editar</button> <button class="admin-btn-sm red delete-btn" data-table="authors" data-id="${a.id}">Eliminar</button></td></tr>`;
    }).join('');
  }

  async function loadSupporters() {
    const { data, error } = await supabaseClient.from('supporters').select('*').order('created_at', { ascending: false });
    const tbody = document.querySelector('#panel-simpatizantes tbody');
    if (error || !data) return tbody.innerHTML = '<tr><td colspan="5">Error cargando simpatizantes</td></tr>';
    if (data.length === 0) return tbody.innerHTML = '<tr><td colspan="5">No hay simpatizantes registrados</td></tr>';
    
    tbody.innerHTML = data.map(s => {
      const d = new Date(s.created_at).toLocaleDateString('es-ES');
      return `<tr><td data-label="Nombre">${s.name}</td><td data-label="Correo">${s.email}</td><td data-label="Origen">${s.source || '-'}</td><td data-label="Fecha">${d}</td><td data-label="Acciones"><button class="admin-btn-sm red delete-btn" data-table="supporters" data-id="${s.id}">Eliminar</button></td></tr>`;
    }).join('');
  }

  async function loadMessages() {
    const { data, error } = await supabaseClient.from('contact_messages').select('*').order('created_at', { ascending: false });
    const tbody = document.querySelector('#panel-mensajes tbody');
    if (error || !data) return tbody.innerHTML = '<tr><td colspan="6">Error cargando mensajes</td></tr>';
    if (data.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No hay mensajes</td></tr>';
    
    tbody.innerHTML = data.map(m => {
      const d = new Date(m.created_at).toLocaleDateString('es-ES');
      return `<tr><td data-label="Fecha">${d}</td><td data-label="Nombre">${m.name}</td><td data-label="Correo">${m.email}</td><td data-label="Asunto">${m.subject || '-'}</td><td data-label="Estado"><span class="admin-badge yellow">Nuevo</span></td><td data-label="Acciones"><button class="admin-btn-sm delete-btn" data-table="contact_messages" data-id="${m.id}">Borrar</button></td></tr>`;
    }).join('');
  }

  async function loadSettings() {
    console.log('⚙️ Cargando ajustes de la sección De Interés...');
    const settings = await getSettings();
    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    
    const parseLinks = (val, fallbackTitle, fallbackUrl) => {
      if (!val) {
        return fallbackUrl ? [{ title: fallbackTitle, url: fallbackUrl }] : [];
      }
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Si no es JSON pero es una URL simple, la migramos
        if (val.startsWith('http')) {
          return [{ title: fallbackTitle, url: val }];
        }
      }
      return [];
    };
    
    // Migrar o cargar lecturas recomendadas
    listLecturas = parseLinks(settingsMap['lecturas_recomendadas'], 'Protocolo de Santa Pola', settingsMap['lecturas_recomendadas_url'] || 'https://protocolodesantapola.es/');
    // Migrar o cargar páginas amigas
    listPaginas = parseLinks(settingsMap['paginas_amigas'], 'Protocolo de Santa Pola', 'https://protocolodesantapola.es/');
    // Migrar o cargar divulgadores
    listDivulgadores = parseLinks(settingsMap['divulgadores'], 'Somos Hispanidad Torrelodones', settingsMap['divulgadores_url'] || 'https://www.youtube.com/@SomosHispanidadTorrelodones');
    
    renderAdminLinkList('admin-list-lecturas', listLecturas, 'lecturas');
    renderAdminLinkList('admin-list-paginas', listPaginas, 'paginas');
    renderAdminLinkList('admin-list-divulgadores', listDivulgadores, 'divulgadores');
  }

  async function loadRealStatistics() {
    console.log('📊 Cargando estadísticas reales desde Supabase...');
    const { data: views, error } = await supabaseClient
      .from('page_views')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error Supabase (page_views):', error);
      return;
    }
    
    const pageviewsVal = document.getElementById('real-stats-pageviews');
    const uniquePagesVal = document.getElementById('real-stats-unique-pages');
    const referrersVal = document.getElementById('real-stats-referrers');
    const countriesVal = document.getElementById('real-stats-countries-count');
    
    if (!views || views.length === 0) {
      if (pageviewsVal) pageviewsVal.textContent = '0';
      if (uniquePagesVal) uniquePagesVal.textContent = '0';
      if (referrersVal) referrersVal.textContent = '0';
      if (countriesVal) countriesVal.textContent = '0';
      
      document.getElementById('tbody-stats-channels').innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px; color:#999;">No hay visitas registradas aún.</td></tr>';
      document.getElementById('tbody-stats-pages').innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px; color:#999;">No hay visitas registradas aún.</td></tr>';
      document.getElementById('tbody-stats-countries').innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px; color:#999;">No hay visitas registradas aún.</td></tr>';
      return;
    }
    
    // 1. Totales
    const totalViews = views.length;
    const uniquePages = new Set(views.map(v => v.page_path));
    const uniqueReferrers = new Set(views.map(v => v.referrer || 'Directo'));
    const uniqueCountries = new Set(views.map(v => v.country || 'España'));
    
    if (pageviewsVal) pageviewsVal.textContent = totalViews.toLocaleString();
    if (uniquePagesVal) uniquePagesVal.textContent = uniquePages.size.toString();
    if (referrersVal) referrersVal.textContent = uniqueReferrers.size.toString();
    if (countriesVal) countriesVal.textContent = uniqueCountries.size.toString();
    
    // 2. Agregaciones
    const channelCounts = {};
    const pageCounts = {};
    const countryCounts = {};
    
    views.forEach(v => {
      const ref = v.referrer || 'Directo';
      channelCounts[ref] = (channelCounts[ref] || 0) + 1;
      
      const path = v.page_path || '/';
      pageCounts[path] = (pageCounts[path] || 0) + 1;
      
      const country = v.country || 'España';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    
    // Canales
    const sortedChannels = Object.entries(channelCounts).sort((a,b) => b[1] - a[1]);
    document.getElementById('tbody-stats-channels').innerHTML = sortedChannels.map(([ref, count]) => {
      return `<tr><td><strong>${ref}</strong></td><td>${count} visitas</td></tr>`;
    }).join('');
    
    // Páginas
    const sortedPages = Object.entries(pageCounts).sort((a,b) => b[1] - a[1]);
    document.getElementById('tbody-stats-pages').innerHTML = sortedPages.map(([path, count]) => {
      const displayPath = path.replace('/src/pages/', '/');
      return `<tr><td><code>${displayPath}</code></td><td>${count} vistas</td></tr>`;
    }).join('');
    
    // Países
    const sortedCountries = Object.entries(countryCounts).sort((a,b) => b[1] - a[1]);
    document.getElementById('tbody-stats-countries').innerHTML = sortedCountries.map(([country, count]) => {
      return `<tr><td>🌍 <strong>${country}</strong></td><td>${count} visitas</td></tr>`;
    }).join('');
  }

  // ── ELIMINAR ELEMENTOS ───────────────────────────
  document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-btn')) {
      if (!confirm('¿Seguro que deseas eliminar este elemento de forma permanente?')) return;
      const table = e.target.getAttribute('data-table');
      const id = e.target.getAttribute('data-id');
      const fila = e.target.closest('tr');
      if (fila) fila.style.opacity = '0.4';
      
      const { error } = await supabaseClient.from(table).delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
        if (fila) fila.style.opacity = '1';
      } else {
        if (fila) fila.remove();
      }
    }
  });

  // ── EDITAR ELEMENTOS ─────────────────────────────
  document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('edit-btn')) {
      const table = e.target.getAttribute('data-table');
      editingId = e.target.getAttribute('data-id');

      // 1. Obtener datos actuales
      const { data, error } = await supabaseClient.from(table).select('*').eq('id', editingId).single();
      
      if (error || !data) return alert('Error al cargar datos: ' + error.message);

      if (table === 'contents') {
        // Abrir modal contenidos en modo edición
        document.getElementById('cont-titulo').value = data.title;
        document.getElementById('cont-tipo').value = data.content_type;
        document.getElementById('cont-url').value = data.youtube_url || '';
        document.getElementById('cont-imagen').value = data.image_url || '';
        document.getElementById('cont-resumen').value = data.summary || '';
        document.getElementById('cont-publicado').checked = data.published;
        
        // Cargar autores y seleccionar el correcto
        const selectAutor = document.getElementById('cont-autor');
        const { data: authors } = await supabaseClient.from('authors').select('id, name').order('name');
        if (authors) {
          selectAutor.innerHTML = '<option value="">Selecciona un autor (opcional)</option>' + 
            authors.map(a => `<option value="${a.id}" ${a.id === data.author_id ? 'selected' : ''}>${a.name}</option>`).join('');
        }
        
        document.querySelector('#modal-contenido h2').textContent = 'Editar Contenido';
        document.getElementById('modal-contenido').style.display = 'flex';
      } 
      else if (table === 'events') {
        // Abrir modal eventos en modo edición
        document.getElementById('ev-titulo').value = data.title;
        
        // Formatear fecha para datetime-local (YYYY-MM-DDThh:mm)
        if (data.event_date) {
          const d = new Date(data.event_date);
          const offset = d.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
          document.getElementById('ev-fecha').value = localISOTime;
        }
        
        document.getElementById('ev-lugar').value = data.location || '';
        document.getElementById('ev-tipo').value = data.event_type;
        document.getElementById('ev-imagen').value = data.image_url || '';
        document.getElementById('ev-descripcion').value = data.description || '';
        document.getElementById('ev-registro').checked = data.registration_open;
        document.getElementById('ev-publicado').checked = data.published;

        document.querySelector('#modal-evento h2').textContent = 'Editar Evento';
        document.getElementById('modal-evento').style.display = 'flex';
      }
      else if (table === 'authors') {
        // Abrir modal autores en modo edición
        document.getElementById('aut-nombre').value = data.name;
        document.getElementById('aut-foto').value = data.photo_url || '';
        document.getElementById('aut-bio').value = data.bio || '';
        document.getElementById('aut-publicado').checked = data.published;

        document.querySelector('#modal-autor h2').textContent = 'Editar Autor';
        document.getElementById('modal-autor').style.display = 'flex';
      }
    }
  });

  // ── MODAL NUEVO CONTENIDO ──────────────────────────
  const btnNuevoContenido = document.getElementById('btn-nuevo-contenido');
  const modalContenido = document.getElementById('modal-contenido');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal-contenido');
  const formContenido = document.getElementById('form-nuevo-contenido');

  // ---- File upload UI elements ----
  const fileInput = document.getElementById('cont-archivo');
  const btnSelectFile = document.getElementById('btn-seleccionar-archivo');
  const fileNameSpan = document.getElementById('archivo-nombre');

  // Open file picker
  btnSelectFile?.addEventListener('click', () => fileInput?.click());

  // Handle file selection & upload
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // 500 KB limit
    const MAX_SIZE = 500 * 1024;
    if (file.size > MAX_SIZE) {
      alert('El archivo supera el límite máximo de 500 KB.');
      fileInput.value = '';
      return;
    }
    fileNameSpan.textContent = file.name;
    btnSelectFile.textContent = 'Subiendo…';
    btnSelectFile.disabled = true;
    try {
      const publicUrl = await uploadFileToSupabase(file);
      // Fill the URL field automatically
      document.getElementById('cont-url').value = publicUrl;
    } catch (err) {
      console.error(err);
      alert('Error al subir el archivo: ' + err.message);
    } finally {
      btnSelectFile.textContent = '📁 Seleccionar archivo';
      btnSelectFile.disabled = false;
    }
  });

  async function uploadFileToSupabase(file) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/\s+/g, '_');
    const path = `${timestamp}_${safeName}`;
    const { data, error } = await supabaseClient.storage
      .from('Documentos')
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { publicURL, error: urlErr } = supabaseClient.storage
      .from('Documentos')
      .getPublicUrl(path);
    if (urlErr) throw urlErr;
    return publicURL;
  }

  if (btnNuevoContenido && modalContenido) {
    btnNuevoContenido.addEventListener('click', async () => {
      editingId = null; // Modo creación
      document.querySelector('#modal-contenido h2').textContent = 'Añadir Nuevo Contenido';
      formContenido.reset();

      // Cargar autores en el select
      const selectAutor = document.getElementById('cont-autor');
      const { data } = await supabaseClient.from('authors').select('id, name').order('name');
      if (data) {
        selectAutor.innerHTML = '<option value="">Selecciona un autor (opcional)</option>' + 
          data.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      }
      modalContenido.style.display = 'flex';
    });

    btnCerrarModal.addEventListener('click', () => {
      modalContenido.style.display = 'none';
      formContenido.reset();
    });

    formContenido.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Ensure any selected file has been uploaded (if cont-url still empty)
      if (fileInput?.files.length > 0 && !document.getElementById('cont-url').value) {
        const file = fileInput.files[0];
        const MAX_SIZE = 500 * 1024;
        if (file.size > MAX_SIZE) {
          alert('El archivo supera el límite máximo de 500 KB.');
          return;
        }
        try {
          const publicUrl = await uploadFileToSupabase(file);
          document.getElementById('cont-url').value = publicUrl;
        } catch (err) {
          console.error(err);
          alert('Error al subir el archivo: ' + err.message);
          return;
        }
      }

      const title = document.getElementById('cont-titulo').value;
      const content_type = document.getElementById('cont-tipo').value;
      const author_id = document.getElementById('cont-autor').value || null;
      const youtube_url = document.getElementById('cont-url').value;
      const image_url = document.getElementById('cont-imagen').value || null;
      const summary = document.getElementById('cont-resumen').value;
      const published = document.getElementById('cont-publicado').checked;

      const btnSubmit = formContenido.querySelector('button[type="submit"]');
      btnSubmit.textContent = 'Guardando...';
      btnSubmit.disabled = true;

      const payload = {
        title, content_type, author_id, youtube_url, image_url, summary, published
      };

      let result;
      if (editingId) {
        result = await supabaseClient.from('contents').update(payload).eq('id', editingId);
      } else {
        result = await supabaseClient.from('contents').insert([payload]);
      }

      const { error } = result;

      btnSubmit.textContent = 'Guardar Contenido';
      btnSubmit.disabled = false;

      if (error) {
        alert('Error guardando contenido: ' + error.message);
      } else {
        modalContenido.style.display = 'none';
        formContenido.reset();
        loadContents(); // Recargar la tabla
      }
    });
  }

  // ── MODAL NUEVA VISITA ─────────────────────────────
  const btnNuevaVisita = document.getElementById('btn-nueva-visita');
  const modalVisita = document.getElementById('modal-visita');
  const btnCerrarModalVisita = document.getElementById('btn-cerrar-modal-visita');
  const formVisita = document.getElementById('form-nueva-visita');
  const inputArchivoVisita = document.getElementById('vis-archivo-imagen');
  const btnSeleccionarImgVisita = document.getElementById('btn-seleccionar-img-visita');
  const visitaImgNombre = document.getElementById('visita-img-nombre');

  if (btnSeleccionarImgVisita && inputArchivoVisita) {
    btnSeleccionarImgVisita.addEventListener('click', () => {
      inputArchivoVisita.click();
    });
    inputArchivoVisita.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        visitaImgNombre.textContent = e.target.files[0].name;
      } else {
        visitaImgNombre.textContent = '';
      }
    });
  }

  if (btnNuevaVisita && modalVisita) {
    btnNuevaVisita.addEventListener('click', () => {
      editingId = null;
      document.querySelector('#modal-visita h2').textContent = 'Añadir Nueva Visita';
      formVisita.reset();
      if (visitaImgNombre) visitaImgNombre.textContent = '';
      modalVisita.style.display = 'flex';
    });

    btnCerrarModalVisita.addEventListener('click', () => {
      modalVisita.style.display = 'none';
      formVisita.reset();
      if (visitaImgNombre) visitaImgNombre.textContent = '';
    });

    formVisita.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('vis-titulo').value;
      const visit_date = document.getElementById('vis-fecha').value;
      const synopsis = document.getElementById('vis-sinopsis').value;
      let cover_image_url = document.getElementById('vis-imagen').value;
      const video_url = document.getElementById('vis-video').value;
      const pdf_url = document.getElementById('vis-pdf').value;
      const published = document.getElementById('vis-publicado').checked;

      const btnSubmit = formVisita.querySelector('button[type="submit"]');
      btnSubmit.textContent = 'Guardando...';
      btnSubmit.disabled = true;

      try {
        if (inputArchivoVisita && inputArchivoVisita.files && inputArchivoVisita.files[0]) {
          btnSubmit.textContent = 'Subiendo imagen...';
          cover_image_url = await uploadFileToSupabase(inputArchivoVisita.files[0]);
        }
      } catch (err) {
        alert("Error subiendo la imagen: " + err.message);
        btnSubmit.textContent = 'Guardar Visita';
        btnSubmit.disabled = false;
        return;
      }

      const payload = { title, visit_date, synopsis, cover_image_url, video_url, pdf_url, published };

      let result;
      if (editingId) {
        result = await supabaseClient.from('cultural_visits').update(payload).eq('id', editingId);
      } else {
        result = await supabaseClient.from('cultural_visits').insert([payload]);
      }

      btnSubmit.textContent = 'Guardar Visita';
      btnSubmit.disabled = false;

      if (result.error) {
        alert('Error guardando visita: ' + result.error.message);
      } else {
        modalVisita.style.display = 'none';
        formVisita.reset();
        if (visitaImgNombre) visitaImgNombre.textContent = '';
        loadVisitas();
      }
    });
  }

  window.editVisita = async function(id) {
    editingId = id;
    const { data, error } = await supabaseClient.from('cultural_visits').select('*').eq('id', id).single();
    if (data) {
      document.getElementById('vis-titulo').value = data.title;
      document.getElementById('vis-fecha').value = data.visit_date ? data.visit_date.substring(0,10) : '';
      document.getElementById('vis-sinopsis').value = data.synopsis || '';
      document.getElementById('vis-imagen').value = data.cover_image_url || '';
      if (visitaImgNombre) visitaImgNombre.textContent = '';
      if (inputArchivoVisita) inputArchivoVisita.value = '';
      document.getElementById('vis-video').value = data.video_url || '';
      document.getElementById('vis-pdf').value = data.pdf_url || '';
      document.getElementById('vis-publicado').checked = data.published;

      document.querySelector('#modal-visita h2').textContent = 'Editar Visita';
      document.getElementById('modal-visita').style.display = 'flex';
    }
  };

  window.deleteVisita = async function(id) {
    if (confirm('¿Seguro que deseas eliminar esta visita?')) {
      const { error } = await supabaseClient.from('cultural_visits').delete().eq('id', id);
      if (!error) loadVisitas();
      else alert('Error: ' + error.message);
    }
  };

  // ── MODAL NUEVO EVENTO ─────────────────────────────
  const btnNuevoEvento = document.getElementById('btn-nuevo-evento');
  const modalEvento = document.getElementById('modal-evento');
  const btnCerrarModalEvento = document.getElementById('btn-cerrar-modal-evento');
  const formEvento = document.getElementById('form-nuevo-evento');

  if (btnNuevoEvento && modalEvento) {
    btnNuevoEvento.addEventListener('click', () => {
      editingId = null; // Modo creación
      document.querySelector('#modal-evento h2').textContent = 'Añadir Nuevo Evento';
      formEvento.reset();
      modalEvento.style.display = 'flex';
    });

    btnCerrarModalEvento.addEventListener('click', () => {
      modalEvento.style.display = 'none';
      formEvento.reset();
    });

    formEvento.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('ev-titulo').value;
      const event_date = document.getElementById('ev-fecha').value;
      const location = document.getElementById('ev-lugar').value;
      const event_type = document.getElementById('ev-tipo').value;
      const image_url = document.getElementById('ev-imagen').value;
      const description = document.getElementById('ev-descripcion').value;
      const registration_open = document.getElementById('ev-registro').checked;
      const published = document.getElementById('ev-publicado').checked;

      const btnSubmit = formEvento.querySelector('button[type="submit"]');
      btnSubmit.textContent = 'Guardando...';
      btnSubmit.disabled = true;

      const payload = {
        title, event_date, location, event_type, image_url, description, registration_open, published
      };

      let result;
      if (editingId) {
        result = await supabaseClient.from('events').update(payload).eq('id', editingId);
      } else {
        result = await supabaseClient.from('events').insert([payload]);
      }

      const { error } = result;

      btnSubmit.textContent = 'Guardar Evento';
      btnSubmit.disabled = false;

      if (error) {
        alert('Error guardando evento: ' + error.message);
      } else {
        modalEvento.style.display = 'none';
        formEvento.reset();
        loadEvents(); // Recargar la tabla
      }
    });
  }

  // ── MODAL NUEVO AUTOR ─────────────────────────────
  const btnNuevoAutor = document.getElementById('btn-nuevo-autor');
  const modalAutor = document.getElementById('modal-autor');
  const btnCerrarModalAutor = document.getElementById('btn-cerrar-modal-autor');
  const formAutor = document.getElementById('form-nuevo-autor');

  if (btnNuevoAutor && modalAutor) {
    btnNuevoAutor.addEventListener('click', () => {
      editingId = null;
      document.querySelector('#modal-autor h2').textContent = 'Añadir Nuevo Autor';
      formAutor.reset();
      modalAutor.style.display = 'flex';
    });

    btnCerrarModalAutor.addEventListener('click', () => {
      modalAutor.style.display = 'none';
      formAutor.reset();
    });

    formAutor.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('aut-nombre').value;
      const photo_url = document.getElementById('aut-foto').value;
      const bio = document.getElementById('aut-bio').value;

      const published = document.getElementById('aut-publicado').checked;

      const btnSubmit = formAutor.querySelector('button[type="submit"]');
      btnSubmit.textContent = 'Guardando...';
      btnSubmit.disabled = true;

      const payload = { name, photo_url, bio, published };

      let result;
      if (editingId) {
        result = await supabaseClient.from('authors').update(payload).eq('id', editingId);
      } else {
        result = await supabaseClient.from('authors').insert([payload]);
      }

      const { error } = result;
      btnSubmit.textContent = 'Guardar Autor';
      btnSubmit.disabled = false;

      if (error) {
        alert('Error guardando autor: ' + error.message);
      } else {
        modalAutor.style.display = 'none';
        formAutor.reset();
        loadAuthors(); // Recargar tabla
      }
    });
  }

  // ── MODAL CARGA MASIVA ─────────────────────────────
  const btnCargaMasiva = document.getElementById('btn-carga-masiva');
  const modalCargaMasiva = document.getElementById('modal-carga-masiva');
  const btnCerrarCarga = document.getElementById('btn-cerrar-modal-carga');
  const btnProcesarCarga = document.getElementById('btn-procesar-carga');
  const btnCancelarCarga = document.getElementById('btn-cancelar-carga');
  const bulkDataArea = document.getElementById('bulk-data');

  if (btnCargaMasiva && modalCargaMasiva) {
    btnCargaMasiva.addEventListener('click', () => {
      modalCargaMasiva.style.display = 'flex';
      bulkDataArea.value = '';
    });

    [btnCerrarCarga, btnCancelarCarga].forEach(btn => {
      btn?.addEventListener('click', () => modalCargaMasiva.style.display = 'none');
    });

    btnProcesarCarga.addEventListener('click', async () => {
      const rawText = bulkDataArea.value.trim();
      if (!rawText) return alert('Por favor, pega algunos datos.');

      btnProcesarCarga.textContent = 'Procesando...';
      btnProcesarCarga.disabled = true;

      // 1. Obtener mapeo de autores para convertir nombres en IDs
      const { data: authors } = await supabaseClient.from('authors').select('id, name');
      const authorMap = {};
      authors.forEach(a => authorMap[a.name.toLowerCase().trim()] = a.id);

      // 2. Parsear líneas
      const lines = rawText.split('\n');
      const contentsToInsert = [];
      let errors = [];

      lines.forEach((line, index) => {
        if (!line.trim()) return;

        // Intentar separar por punto y coma o tabulación
        const parts = line.includes(';') ? line.split(';') : line.split('\t');
        
        if (parts.length < 3) {
          errors.push(`Línea ${index + 1}: Formato incorrecto.`);
          return;
        }

        const authorName = parts[0]?.trim().toLowerCase();
        const title = parts[1]?.trim();
        const type = parts[2]?.trim().toLowerCase();
        const url = parts[3]?.trim() || '';
        const summary = parts[4]?.trim() || '';

        const authorId = authorMap[authorName];
        if (!authorId) {
          errors.push(`Línea ${index + 1}: Autor "${parts[0]}" no encontrado.`);
          return;
        }

        contentsToInsert.push({
          author_id: authorId,
          title: title,
          content_type: type === 'video' ? 'vídeo' : type, // Normalizar tilde
          youtube_url: url,
          summary: summary,
          published: true
        });
      });

      if (contentsToInsert.length > 0) {
        const { error } = await supabaseClient.from('contents').insert(contentsToInsert);
        if (error) {
          alert('Error en la inserción: ' + error.message);
        } else {
          alert(`¡Éxito! Se han importado ${contentsToInsert.length} contenidos.`);
          modalCargaMasiva.style.display = 'none';
          loadContents();
        }
      }

      if (errors.length > 0) {
        alert('Algunas líneas fallaron:\n' + errors.join('\n'));
      }

      btnProcesarCarga.textContent = 'Importar ahora';
      btnProcesarCarga.disabled = false;
    });
  }

  // ── EXPORTAR SIMPATIZANTES A CSV ──────────────────
  const btnExportar = document.getElementById('btn-exportar-simpatizantes');
  if (btnExportar) {
    btnExportar.addEventListener('click', async () => {
      // 1. Obtener todos los simpatizantes
      const { data, error } = await supabaseClient.from('supporters').select('*').order('name');
      
      if (error) return alert('Error al obtener datos: ' + error.message);
      if (!data || data.length === 0) return alert('No hay datos para exportar.');

      // 2. Generar CSV
      const headers = ['Nombre', 'Email', 'Fuente', 'Fecha Registro'];
      const csvRows = [
        headers.join(','), // Cabecera
        ...data.map(s => [
          `"${s.name}"`,
          `"${s.email}"`,
          `"${s.source || 'web'}"`,
          `"${new Date(s.created_at).toLocaleDateString()}"`
        ].join(','))
      ];
      const csvString = csvRows.join('\n');

      // 3. Descargar archivo
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `simpatizantes_somos_hispanidad_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // ── PANEL MARKETING ─────────────────────────────────
  const panelMarketing = document.getElementById('panel-marketing');
  
  // Se activa cuando el usuario navega al panel de marketing
  document.querySelectorAll('.admin-nav-link[data-panel]').forEach(link => {
    link.addEventListener('click', function() {
      if (this.getAttribute('data-panel') === 'marketing') {
        initMarketing();
      }
    });
  });

  let simpatizantesCache = [];

  async function initMarketing() {
    // 1. Verificar estado EmailJS
    const dotEl = document.getElementById('mkt-status-dot');
    const txtEl = document.getElementById('mkt-status-text');
    if (dotEl && txtEl) {
      if (typeof emailjs !== 'undefined') {
        dotEl.style.background = '#22c55e';
        txtEl.textContent = 'EmailJS conectado y operativo.';
      } else {
        dotEl.style.background = '#ef4444';
        txtEl.textContent = 'EmailJS no disponible. Comprueba la conexión.';
      }
    }

    // 2. Cargar simpatizantes para el preview
    const preview = document.getElementById('mkt-lista-preview');
    const btnMasivo = document.getElementById('btn-enviar-masivo');
    
    const { data, error } = await supabaseClient
      .from('supporters')
      .select('name, email')
      .is('unsubscribed_at', null)
      .order('name');

    if (error || !data) {
      if (preview) preview.innerHTML = '<span style="color:red;">Error cargando simpatizantes: ' + (error?.message || 'desconocido') + '</span>';
      return;
    }

    simpatizantesCache = data;

    if (preview) {
      if (data.length === 0) {
        preview.innerHTML = '⚠️ No hay simpatizantes registrados en la base de datos.';
        return;
      }
      preview.innerHTML = `
        <strong>${data.length} simpatizantes activos:</strong><br>
        <span style="color:#5a4a3a;">${data.slice(0,5).map(s => s.name).join(', ')}${data.length > 5 ? ` y ${data.length - 5} más...` : ''}</span>
      `;
      if (btnMasivo) btnMasivo.disabled = false;
    }
  }

  // Botón enviar prueba
  const btnPrueba = document.getElementById('btn-enviar-prueba');
  if (btnPrueba) {
    btnPrueba.addEventListener('click', async () => {
      const asunto  = document.getElementById('mkt-asunto')?.value.trim();
      let cuerpo  = document.getElementById('mkt-cuerpo')?.value.trim();
      const hora = document.getElementById('mkt-hora')?.value.trim();
      const lugar = document.getElementById('mkt-lugar')?.value.trim();
      const ubicacion = document.getElementById('mkt-ubicacion')?.value.trim();
      
      let detalles = [];
      if (hora) detalles.push(`Hora: ${hora}`);
      if (lugar) detalles.push(`Lugar: ${lugar}`);
      if (ubicacion) detalles.push(`Ubicación: ${ubicacion}`);
      
      if (detalles.length > 0) {
        cuerpo = cuerpo + '\n\n---\nDetalles del evento:\n' + detalles.join('\n');
      }

      const firma   = document.getElementById('mkt-firma')?.value.trim() || 'Somos Hispanidad';
      const testEmail = document.getElementById('mkt-test-email')?.value.trim();
      const resultEl = document.getElementById('mkt-test-result');

      if (!asunto || !cuerpo) { alert('Completa el asunto y el cuerpo del mensaje antes de enviar la prueba.'); return; }
      if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) { alert('Introduce un email de prueba válido.'); return; }

      // Adjuntar la firma al final del cuerpo del mensaje
      const cuerpoConFirma = cuerpo + '\n\n' + firma;

      btnPrueba.disabled = true;
      btnPrueba.textContent = 'Enviando...';

      try {
        await emailjs.send('service_sfxfhke', 'template_5jjf7vs', {
          from_name: firma,
          from_email: 'contacto@somoshispanidad.es',
          subject: '[PRUEBA] ' + asunto,
          message: cuerpoConFirma,
          to_email: testEmail
        });
        if (resultEl) { resultEl.style.display = 'block'; resultEl.style.background = '#f0fdf4'; resultEl.style.color = '#166534'; resultEl.textContent = '✅ Email de prueba enviado a ' + testEmail; }
      } catch(err) {
        if (resultEl) { resultEl.style.display = 'block'; resultEl.style.background = '#fef2f2'; resultEl.style.color = '#991b1b'; resultEl.textContent = '❌ Error: ' + err.text; }
      }

      btnPrueba.disabled = false;
      btnPrueba.textContent = '📤 Enviar prueba';
    });
  }

  // Botón envío masivo
  const btnMasivo = document.getElementById('btn-enviar-masivo');
  if (btnMasivo) {
    btnMasivo.addEventListener('click', async () => {
      const asunto  = document.getElementById('mkt-asunto')?.value.trim();
      let cuerpo  = document.getElementById('mkt-cuerpo')?.value.trim();
      const hora = document.getElementById('mkt-hora')?.value.trim();
      const lugar = document.getElementById('mkt-lugar')?.value.trim();
      const ubicacion = document.getElementById('mkt-ubicacion')?.value.trim();
      
      let detalles = [];
      if (hora) detalles.push(`Hora: ${hora}`);
      if (lugar) detalles.push(`Lugar: ${lugar}`);
      if (ubicacion) detalles.push(`Ubicación: ${ubicacion}`);
      
      if (detalles.length > 0) {
        cuerpo = cuerpo + '\n\n---\nDetalles del evento:\n' + detalles.join('\n');
      }

      const firma   = document.getElementById('mkt-firma')?.value.trim() || 'Somos Hispanidad';
      const resultEl = document.getElementById('mkt-masivo-result');

      if (!asunto || !cuerpo) { alert('Completa el asunto y el cuerpo del mensaje.'); return; }
      if (simpatizantesCache.length === 0) { alert('No hay simpatizantes a quienes enviar.'); return; }

      // Adjuntar la firma al final del cuerpo del mensaje
      const cuerpoConFirma = cuerpo + '\n\n' + firma;

      if (!confirm(`¿Confirmas el envío masivo a ${simpatizantesCache.length} simpatizantes?\n\nAsunto: "${asunto}"\n\nEsta acción no se puede deshacer.`)) return;

      btnMasivo.disabled = true;
      btnMasivo.textContent = 'Enviando... (0/' + simpatizantesCache.length + ')';

      let enviados = 0, errores = 0;
      for (const s of simpatizantesCache) {
        try {
          await emailjs.send('service_sfxfhke', 'template_5jjf7vs', {
            from_name: firma,
            from_email: 'contacto@somoshispanidad.es',
            subject: asunto,
            message: cuerpoConFirma,
            to_email: s.email,
            to_name: s.name
          });
          enviados++;
        } catch(err) {
          errores++;
          console.error('Error enviando a ' + s.email, err);
        }
        btnMasivo.textContent = `Enviando... (${enviados + errores}/${simpatizantesCache.length})`;
        // Pausa de 300ms para no saturar la API de EmailJS
        await new Promise(r => setTimeout(r, 300));
      }

      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.style.background = errores === 0 ? '#f0fdf4' : '#fef2f2';
        resultEl.style.color = errores === 0 ? '#166534' : '#991b1b';
        resultEl.textContent = `✅ Enviados: ${enviados} | ❌ Errores: ${errores}`;
      }
      btnMasivo.disabled = false;
      btnMasivo.textContent = '🚀 Enviar a todos los simpatizantes';
    });
  }

  // ── INSCRITOS POR EVENTO ─────────────────────────────────

  let currentEventoId     = null;
  let currentEventoTitulo = null;
  let inscritosCache      = [];

  const modalInscritos       = document.getElementById('modal-inscritos');
  const btnCerrarInscritos   = document.getElementById('btn-cerrar-modal-inscritos');
  const tbodyInscritos       = document.getElementById('tbody-inscritos');
  const modalInscritosTitulo = document.getElementById('modal-inscritos-titulo');
  const modalInscritosCount  = document.getElementById('modal-inscritos-count');

  // Abrir modal al pulsar "Ver inscritos"
  document.addEventListener('click', async function(e) {
    const btn = e.target.closest('.inscritos-btn');
    if (!btn) return;

    currentEventoId     = btn.getAttribute('data-id');
    currentEventoTitulo = btn.getAttribute('data-titulo');

    if (modalInscritosTitulo) modalInscritosTitulo.textContent = `Inscritos — ${currentEventoTitulo}`;
    if (tbodyInscritos) tbodyInscritos.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Cargando...</td></tr>';
    if (modalInscritos) modalInscritos.style.display = 'flex';

    await loadInscritos(currentEventoId);
  });

  // Cerrar modal inscritos
  btnCerrarInscritos?.addEventListener('click', () => {
    if (modalInscritos) modalInscritos.style.display = 'none';
    currentEventoId = null;
    currentEventoTitulo = null;
    inscritosCache = [];
  });

  // Cargar lista de inscritos desde Supabase
  async function loadInscritos(eventId) {
    const { data, error } = await supabaseClient
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      if (tbodyInscritos) tbodyInscritos.innerHTML = `<tr><td colspan="6" style="color:red; padding:16px;">Error: ${error.message}</td></tr>`;
      return;
    }

    inscritosCache = data || [];

    if (modalInscritosCount) {
      modalInscritosCount.textContent = `${inscritosCache.length} inscrito${inscritosCache.length !== 1 ? 's' : ''}`;
    }

    if (inscritosCache.length === 0) {
      tbodyInscritos.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#5a4a3a;">No hay inscritos en este evento todavía.</td></tr>';
      return;
    }

    tbodyInscritos.innerHTML = inscritosCache.map(r => {
      const fecha = new Date(r.created_at).toLocaleDateString('es-ES');
      return `<tr>
        <td data-label="Nombre">${r.name || '-'}</td>
        <td data-label="Correo"><a href="mailto:${r.email}" style="color:#0369a1;">${r.email || '-'}</a></td>
        <td data-label="Teléfono">${r.phone || '-'}</td>
        <td data-label="Comentarios" style="max-width:180px; white-space:normal; font-size:0.83rem;">${r.comments || '-'}</td>
        <td data-label="Fecha">${fecha}</td>
        <td data-label="Acciones"><button class="admin-btn-sm red delete-btn" data-table="event_registrations" data-id="${r.id}">Borrar</button></td>
      </tr>`;
    }).join('');
  }

  // Exportar inscritos a CSV
  document.getElementById('btn-exportar-inscritos')?.addEventListener('click', () => {
    if (!inscritosCache || inscritosCache.length === 0) {
      alert('No hay inscritos que exportar.');
      return;
    }
    const headers = ['Nombre', 'Email', 'Teléfono', 'Comentarios', 'Fecha Registro'];
    const rows = inscritosCache.map(r => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.comments || '').replace(/"/g, '""')}"`,
      `"${new Date(r.created_at).toLocaleDateString('es-ES')}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (currentEventoTitulo || 'evento').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('href', url);
    link.setAttribute('download', `inscritos_${safeTitle}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ── AÑADIR INSCRITO MANUALMENTE ─────────────────────────

  const modalAddInscrito       = document.getElementById('modal-add-inscrito');
  const btnAbrirAddInscrito    = document.getElementById('btn-abrir-add-inscrito');
  const btnCerrarAddInscrito   = document.getElementById('btn-cerrar-modal-add-inscrito');
  const btnCancelarAddInscrito = document.getElementById('btn-cancelar-add-inscrito');
  const formAddInscrito        = document.getElementById('form-add-inscrito');
  const addInscritoTituloEl    = document.getElementById('add-inscrito-evento-titulo');
  const addInscritoMsg         = document.getElementById('add-inscrito-msg');

  // Abrir modal añadir inscrito
  btnAbrirAddInscrito?.addEventListener('click', () => {
    if (addInscritoTituloEl) addInscritoTituloEl.textContent = currentEventoTitulo || '';
    if (formAddInscrito) formAddInscrito.reset();
    if (addInscritoMsg) addInscritoMsg.style.display = 'none';
    if (modalAddInscrito) modalAddInscrito.style.display = 'flex';
  });

  // Cerrar modal añadir inscrito
  [btnCerrarAddInscrito, btnCancelarAddInscrito].forEach(btn => {
    btn?.addEventListener('click', () => {
      if (modalAddInscrito) modalAddInscrito.style.display = 'none';
      if (formAddInscrito) formAddInscrito.reset();
      if (addInscritoMsg) addInscritoMsg.style.display = 'none';
    });
  });

  // Guardar inscrito manual
  formAddInscrito?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre      = document.getElementById('add-insc-nombre')?.value.trim();
    const email       = document.getElementById('add-insc-email')?.value.trim();
    const telefono    = document.getElementById('add-insc-telefono')?.value.trim() || null;
    const comentarios = document.getElementById('add-insc-comentarios')?.value.trim() || null;

    if (!nombre || !email || !currentEventoId) {
      alert('Nombre y correo son obligatorios.');
      return;
    }

    const btnSubmit = document.getElementById('btn-submit-add-inscrito');
    if (btnSubmit) { btnSubmit.textContent = 'Guardando...'; btnSubmit.disabled = true; }
    if (addInscritoMsg) addInscritoMsg.style.display = 'none';

    // 1. Insertar en Supabase
    const { error } = await supabaseClient
      .from('event_registrations')
      .insert([{ event_id: currentEventoId, name: nombre, email, phone: telefono, comments: comentarios }]);

    if (btnSubmit) { btnSubmit.textContent = 'Guardar inscrito'; btnSubmit.disabled = false; }

    if (error) {
      if (addInscritoMsg) {
        addInscritoMsg.style.display = 'block';
        addInscritoMsg.style.background = '#fef2f2';
        addInscritoMsg.style.color = '#991b1b';
        addInscritoMsg.textContent = '❌ Error al guardar: ' + error.message;
      }
      return;
    }

    // 2. Enviar email de confirmación automático
    try {
      if (typeof emailjs !== 'undefined' && currentEventoTitulo) {
        await emailjs.send('service_sfxfhke', 'template_5jjf7vs', {
          from_name: 'Administración Somos Hispanidad',
          from_email: 'contacto@somoshispanidad.es',
          subject: `Inscripción en ${currentEventoTitulo} recibida`,
          message: `Su inscripción en ${currentEventoTitulo} ha sido recibida, próximamente recibirá confirmación de su solicitud. Gracias por contactar con Somos Hispanidad`,
          to_email: email,
          to_name: nombre
        });
        console.log('✅ Email de confirmación enviado a', email);
      }
    } catch (emailErr) {
      console.warn('⚠ Email de confirmación no enviado:', emailErr);
    }

    // 3. Mostrar éxito y refrescar lista
    if (addInscritoMsg) {
      addInscritoMsg.style.display = 'block';
      addInscritoMsg.style.background = '#f0fdf4';
      addInscritoMsg.style.color = '#166534';
      addInscritoMsg.textContent = `✅ ${nombre} añadido. Se ha enviado email de confirmación.`;
    }
    if (formAddInscrito) formAddInscrito.reset();

    setTimeout(() => {
      if (modalAddInscrito) modalAddInscrito.style.display = 'none';
      if (addInscritoMsg) addInscritoMsg.style.display = 'none';
      loadInscritos(currentEventoId);
    }, 1500);
  });
  // ── MODAL AÑADIR SIMPATIZANTE ──────────────────────────────────
  const btnAddSimpatizante = document.getElementById('btn-add-simpatizante');
  const modalAddSimpatizante = document.getElementById('modal-add-simpatizante');
  const btnCerrarModalAddSimp = document.getElementById('btn-cerrar-modal-add-simpatizante');
  const btnCancelarAddSimp = document.getElementById('btn-cancelar-add-simpatizante');
  const formAddSimpatizante = document.getElementById('form-add-simpatizante');
  const selectEventoSimp = document.getElementById('add-simp-evento');

  if (btnAddSimpatizante && modalAddSimpatizante) {
    btnAddSimpatizante.addEventListener('click', async () => {
      if (formAddSimpatizante) formAddSimpatizante.reset();
      const msg = document.getElementById('add-simp-msg');
      if (msg) msg.style.display = 'none';
      
      // Cargar eventos en el select
      try {
        const { data, error } = await supabaseClient.from('events').select('id, title').order('created_at', { ascending: false });
        if (!error && data && selectEventoSimp) {
          selectEventoSimp.innerHTML = '<option value="">— Sin evento vinculado —</option>' + 
            data.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
        }
      } catch(e) {}
      
      modalAddSimpatizante.style.display = 'flex';
    });
  }

  const cerrarModalAddSimp = () => { if (modalAddSimpatizante) modalAddSimpatizante.style.display = 'none'; };
  if (btnCerrarModalAddSimp) btnCerrarModalAddSimp.addEventListener('click', cerrarModalAddSimp);
  if (btnCancelarAddSimp) btnCancelarAddSimp.addEventListener('click', cerrarModalAddSimp);

  if (formAddSimpatizante) {
    formAddSimpatizante.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('add-simp-msg');
      const btn = document.getElementById('btn-submit-add-simpatizante');
      
      const nombre = document.getElementById('add-simp-nombre').value.trim();
      const email = document.getElementById('add-simp-email').value.trim();
      const telefono = document.getElementById('add-simp-telefono')?.value.trim() || '';
      const event_id = selectEventoSimp ? selectEventoSimp.value : '';
      const fuente = document.getElementById('add-simp-fuente')?.value.trim() || '';
      const eventTitle = (event_id && selectEventoSimp) ? selectEventoSimp.options[selectEventoSimp.selectedIndex].text : '';

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Guardando...';
      }
      if (msg) msg.style.display = 'none';

      try {
        // 1. Insertar en supporters
        const { data: existingSup } = await supabaseClient.from('supporters')
          .select('id').eq('email', email).maybeSingle();

        if (!existingSup) {
          const { error: supError } = await supabaseClient.from('supporters').insert([{
            name: nombre,
            email: email,
            consent: true,
            source: event_id ? `Evento: ${eventTitle}` : (fuente || 'Alta manual admin')
          }]);
          if (supError) throw new Error('Error al guardar en simpatizantes: ' + supError.message);
        }

        // 2. Si hay evento, insertar en event_registrations
        if (event_id) {
          const { data: existingReg } = await supabaseClient.from('event_registrations')
            .select('id').eq('event_id', event_id).eq('email', email).maybeSingle();

          if (!existingReg) {
            const { error: regError } = await supabaseClient.from('event_registrations').insert([{
              event_id: event_id,
              name: nombre,
              email: email,
              phone: telefono,
              comments: fuente || 'Alta manual desde admin'
            }]);
            if (regError) throw new Error('Guardado como simpatizante, pero falló al inscribir en evento: ' + regError.message);
          }
        }

        if (msg) {
          msg.textContent = '✅ Simpatizante añadido correctamente.';
          msg.style.color = '#15803d';
          msg.style.backgroundColor = '#dcfce7';
          msg.style.display = 'block';
        }

        setTimeout(() => {
          cerrarModalAddSimp();
          loadSupporters(); // recargar tabla
        }, 1500);

      } catch (err) {
        if (msg) {
          msg.textContent = '❌ ' + err.message;
          msg.style.color = '#b91c1c';
          msg.style.backgroundColor = '#fee2e2';
          msg.style.display = 'block';
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Guardar simpatizante';
        }
      }
    });
  }

});
