/*
 * =====================================================
 * SOMOS HISPANIDAD — Cliente Supabase
 * Archivo: src/js/supabaseClient.js
 *
 * Conexión ACTIVA con Supabase.
 * Tablas: authors, contents, events, event_registrations,
 *         supporters, contact_messages
 * =====================================================
 */

// ── Credenciales de Supabase ──────────────────────────────
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';

// ── Inicializar el cliente ────────────────────────────────
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase conectado:', SUPABASE_URL);


// ═══════════════════════════════════════════════════════════
// LECTURA (GET)
// ═══════════════════════════════════════════════════════════

/**
 * Obtener eventos desde la tabla "events"
 * Fallback a EVENTOS_SIMULADOS si la tabla está vacía o hay error
 */
async function getEventos() {
  try {
    const { data, error } = await supabaseClient
      .from('events')
      .select('*')
      .eq('published', true)
      .order('event_date', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return data.map(ev => {
        const d = new Date(ev.event_date);
        return {
          id: ev.id,
          titulo: ev.title,
          fecha: ev.event_date,
          dia: String(d.getDate()).padStart(2, '0'),
          mes: meses[d.getMonth()],
          anio: String(d.getFullYear()),
          lugar: ev.location || '',
          tipo: ev.event_type || 'Evento',
          descripcion: ev.description || '',
          url_inscripcion: ev.registration_open ? '#inscripcion' : '#contacto',
          estado: ev.registration_open ? 'abierto' : 'proximo',
          image_url: ev.image_url
        };
      });
    }

    console.info('ℹ Tabla "events" vacía → datos simulados');
    return typeof EVENTOS_SIMULADOS !== 'undefined' ? EVENTOS_SIMULADOS : [];
  } catch (err) {
    console.warn('⚠ Supabase (events):', err.message, '→ datos simulados');
    return typeof EVENTOS_SIMULADOS !== 'undefined' ? EVENTOS_SIMULADOS : [];
  }
}

/**
 * Obtener contenidos publicados desde la tabla "contents"
 * Incluye el nombre del autor mediante join con "authors"
 */
async function getContenidos() {
  try {
    const { data, error } = await supabaseClient
      .from('contents')
      .select('*, authors(name)')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(c => ({
        id: c.id,
        tipo: c.content_type === 'escrito' || c.content_type === 'Escrito' ? 'Escrito'
            : c.content_type === 'acta' || c.content_type === 'Acta' ? 'Acta'
            : c.content_type === 'barometro' || c.content_type === 'Barómetro' ? 'Barómetro'
            : c.content_type === 'vídeo' || c.content_type === 'Vídeo' ? 'Vídeo'
            : c.content_type === 'conferencia' || c.content_type === 'Conferencia' ? 'Conferencia'
            : c.content_type,
        titulo: c.title,
        autor: c.authors?.name || 'Somos Hispanidad',
        fecha: c.created_at
          ? new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        imagen: c.image_url || null,
        imagen_texto: c.image_url ? null : (c.content_type || 'CONTENIDO').toUpperCase(),
        descripcion: c.summary || '',
        url: c.youtube_url || '#',
        etiquetas: c.tags || []
      }));
    }

    console.info('ℹ Tabla "contents" vacía → datos simulados');
    return typeof CONTENIDOS_SIMULADOS !== 'undefined' ? CONTENIDOS_SIMULADOS : [];
  } catch (err) {
    console.warn('⚠ Supabase (contents):', err.message, '→ datos simulados');
    return typeof CONTENIDOS_SIMULADOS !== 'undefined' ? CONTENIDOS_SIMULADOS : [];
  }
}

/**
 * Obtener autores desde la tabla "authors"
 */
async function getAutores() {
  try {
    const { data, error } = await supabaseClient
      .from('authors')
      .select('*')
      .eq('published', true)
      .order('name', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(a => ({
        id: a.id,
        nombre: a.name,
        cargo: 'Colaborador',
        especialidad: '',
        bio: a.bio || '',
        imagen: a.photo_url || null
      }));
    }

    console.info('ℹ Tabla "authors" vacía → datos simulados');
    return typeof AUTORES_SIMULADOS !== 'undefined' ? AUTORES_SIMULADOS : [];
  } catch (err) {
    console.warn('⚠ Supabase (authors):', err.message, '→ datos simulados');
    return typeof AUTORES_SIMULADOS !== 'undefined' ? AUTORES_SIMULADOS : [];
  }
}


// ═══════════════════════════════════════════════════════════
// ESCRITURA (INSERT)
// ═══════════════════════════════════════════════════════════

/**
 * Guardar mensaje de contacto en "contact_messages"
 */
async function guardarMensaje(nombre, email, asunto, mensaje) {
  try {
    const { error } = await supabaseClient
      .from('contact_messages')
      .insert([{ name: nombre, email, subject: asunto, message: mensaje }]);

    if (error) throw error;
    console.log('✅ Mensaje guardado en Supabase');
    return true;
  } catch (err) {
    console.error('❌ Error guardando mensaje:', err.message);
    return false;
  }
}

/**
 * Registrar inscripción a evento en "event_registrations"
 */
async function registrarInscripcion(event_id, nombre, email, phone, comments) {
  try {
    const { error } = await supabaseClient
      .from('event_registrations')
      .insert([{ event_id, name: nombre, email, phone: phone || null, comments: comments || null }]);

    if (error) {
      console.error('❌ Error de Supabase al registrar:', error);
      throw error;
    }
    console.log('✅ Inscripción registrada en Supabase');
    return true;
  } catch (err) {
    console.error('❌ Error registrando inscripción:', err.message, err);
    return false;
  }
}

/**
 * Registrar simpatizante/suscriptor en "supporters"
 */
async function registrarSimpatizante(nombre, email, source) {
  try {
    const { error } = await supabaseClient
      .from('supporters')
      .insert([{ name: nombre, email, consent: true, source: source || 'web' }]);

    if (error) throw error;
    console.log('✅ Simpatizante registrado en Supabase');
    return true;
  } catch (err) {
    console.error('❌ Error registrando simpatizante:', err.message);
    return false;
  }
}

/**
 * Obtener todos los ajustes desde la tabla "settings"
 */
async function getSettings() {
  try {
    const { data, error } = await supabaseClient
      .from('settings')
      .select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('❌ Error obteniendo settings:', err.message);
    return [];
  }
}

/**
 * Guardar o actualizar un ajuste en la tabla "settings"
 */
async function saveSetting(key, value) {
  try {
    const { error } = await supabaseClient
      .from('settings')
      .upsert({ key, value, updated_at: new Date() });
    if (error) throw error;
    console.log(`✅ Ajuste ${key} guardado con éxito`);
    return true;
  } catch (err) {
    console.error(`❌ Error guardando ajuste ${key}:`, err.message);
    return false;
  }
}
