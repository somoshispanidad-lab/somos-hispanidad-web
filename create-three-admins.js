/**
 * =====================================================
 * SOMOS HISPANIDAD — Script de creación de administradores
 * Archivo: create-three-admins.js
 *
 * Crea los 3 nuevos usuarios administradores en Supabase Auth.
 * REQUISITO: Desactivar "Confirm email" en Supabase Dashboard
 * antes de ejecutar (Authentication → Settings → Email).
 *
 * Uso: node create-three-admins.js
 * =====================================================
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── NUEVOS ADMINISTRADORES ────────────────────────────
const nuevosAdmins = [
  { email: 'chemillorente@gmail.com',  nombre: 'Chemi Llorente'   },
  { email: 'adelaida.pm@gmail.com',    nombre: 'Adelaida Porras'   },
  { email: 'muygines@gmail.com',       nombre: 'Ginés'             },
];

const PASSWORD_COMPARTIDA = 'Torre26**';

// ── FUNCIÓN DE CREACIÓN ───────────────────────────────
async function crearAdmin({ email, nombre }) {
  console.log(`\n📧 Procesando: ${nombre} <${email}>`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: PASSWORD_COMPARTIDA,
  });

  if (error) {
    // Si el usuario ya existe, Supabase devuelve un error específico
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('user already registered')) {
      console.log(`  ⚠️  El usuario ya existía en Supabase Auth. Sin cambios.`);
    } else {
      console.error(`  ❌ Error al crear usuario: ${error.message}`);
    }
    return false;
  }

  // Supabase devuelve identities vacío si el usuario ya existe (sin error)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    console.log(`  ⚠️  El usuario ya existía (identities vacío). Sin cambios.`);
    return false;
  }

  console.log(`  ✅ Usuario creado. ID: ${data.user?.id}`);

  // Si la confirmación de email está desactivada, el usuario puede hacer
  // login inmediatamente. Si no, recibirá un email de confirmación.
  if (data.user?.email_confirmed_at) {
    console.log(`  ✓  Email confirmado automáticamente (sin confirmación requerida).`);
  } else {
    console.log(`  ℹ️  Email pendiente de confirmación (revisar configuración de Supabase).`);
  }

  return true;
}

// ── MAIN ─────────────────────────────────────────────
async function main() {
  console.log('============================================');
  console.log(' SOMOS HISPANIDAD — Alta de Administradores');
  console.log('============================================');
  console.log(`Proyecto: ${SUPABASE_URL}`);
  console.log(`Usuarios a procesar: ${nuevosAdmins.length}`);

  let creados = 0;
  let existentes = 0;
  let errores = 0;

  for (const admin of nuevosAdmins) {
    const ok = await crearAdmin(admin);
    if (ok) creados++;
    else existentes++;
  }

  console.log('\n============================================');
  console.log(' RESUMEN');
  console.log('============================================');
  console.log(`  ✅ Usuarios creados:          ${creados}`);
  console.log(`  ⚠️  Ya existían (sin cambio):  ${existentes}`);
  console.log(`  ❌ Errores:                    ${errores}`);
  console.log('\n🔐 Contraseña asignada: Torre26**');
  console.log('🌐 Panel de admin: https://somoshispanidad.es/src/admin/admin.html');
  console.log('\nTodos los usuarios creados pueden acceder inmediatamente');
  console.log('si la confirmación de email está desactivada en Supabase.');
  console.log('============================================\n');
}

main().catch(console.error);
