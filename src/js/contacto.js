/*
 * =====================================================
 * SOMOS HISPANIDAD — Formulario de Contacto
 * Archivo: src/js/contacto.js
 *
 * Gestiona el formulario de contacto.
 * 1. Guarda el mensaje en Supabase (contact_messages)
 * 2. Envía notificación por email vía EmailJS
 * =====================================================
 */

document.addEventListener('DOMContentLoaded', function () {

  const form = document.getElementById('form-contacto');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre  = document.getElementById('contacto-nombre')?.value.trim();
    const email   = document.getElementById('contacto-email')?.value.trim();
    const asunto  = document.getElementById('contacto-asunto')?.value.trim();
    const mensaje = document.getElementById('contacto-mensaje')?.value.trim();

    // Validación básica
    if (!nombre || !email || !mensaje) {
      mostrarError('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    if (!validarEmail(email)) {
      mostrarError('El correo electrónico no tiene un formato válido.');
      return;
    }

    // Deshabilitar botón mientras se envía
    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Enviando...';
    }

    // 1. Guardar en Supabase
    let guardadoOk = false;
    try {
      guardadoOk = await guardarMensaje(nombre, email, asunto || 'Sin asunto', mensaje);
    } catch(err) {
      console.warn('Supabase no disponible, continuando con envío de email:', err);
    }

    // 2. Enviar notificación por email vía EmailJS (a la asociación)
    let emailOk = false;
    try {
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(
          'service_sfxfhke',    // Service ID
          'template_5jjf7vs',   // Template ID
          {
            from_name:  nombre,
            from_email: email,
            subject:    asunto || 'Sin asunto',
            message:    mensaje,
            to_email:   'contacto@somoshispanidad.es'
          }
        );
        emailOk = true;
      } else {
        console.warn('EmailJS no cargado');
      }
    } catch(err) {
      console.error('Error al enviar email con EmailJS:', err);
    }

    // 3. Enviar acuse de recibo automático al solicitante
    try {
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(
          'service_sfxfhke',
          'template_5jjf7vs',
          {
            from_name:  'Administración Somos Hispanidad',
            from_email: 'contacto@somoshispanidad.es',
            subject:    'Solicitud recibida',
            message:    'Su solicitud ha sido recibida, próximamente contactaremos con usted. Gracias por comunicarse con Somos Hispanidad',
            to_email:   email,
            to_name:    nombre
          }
        );
        console.log('✅ Acuse de recibo enviado a', email);
      }
    } catch(err) {
      // Fallo silencioso — el mensaje ya está guardado y notificado
      console.warn('⚠ Acuse de recibo no enviado:', err);
    }

    if (guardadoOk || emailOk) {
      mostrarExito();
    } else {
      mostrarError('No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos a contacto@somoshispanidad.es');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar Mensaje';
      }
    }
  });


  // ── Mostrar mensaje de éxito ──────────────────────────
  function mostrarExito() {
    form.style.display = 'none';
    const exito = document.getElementById('contacto-exito');
    if (exito) exito.style.display = 'block';
  }

  // ── Mostrar mensaje de error ──────────────────────────
  function mostrarError(msg) {
    let errorEl = document.getElementById('contacto-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'contacto-error';
      errorEl.className = 'supabase-notice';
      form.prepend(errorEl);
    }
    errorEl.innerHTML = `<strong>⚠ Atención:</strong> ${msg}`;
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Validar formato de email ──────────────────────────
  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

});
