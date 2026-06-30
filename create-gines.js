/**
 * =====================================================
 * SOMOS HISPANIDAD — Reintento: crear muygines@gmail.com
 * Archivo: create-gines.js
 *
 * Script de reintento específico para muygines@gmail.com.
 * Ejecutar DESPUÉS de desactivar "Confirm email" en Supabase.
 *
 * Uso: node create-gines.js
 * =====================================================
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function crearGines() {
  const email = 'muygines@gmail.com';
  const password = 'Torre26**';

  console.log('============================================');
  console.log(' SOMOS HISPANIDAD — Reintento: Ginés');
  console.log('============================================');
  console.log(`📧 Procesando: Ginés <${email}>`);

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('user already registered')) {
      console.log('  ⚠️  El usuario ya existía. Sin cambios.');
    } else if (error.message.toLowerCase().includes('rate limit')) {
      console.error('  ❌ Sigue el rate limit. Espera 5-10 minutos y vuelve a intentar.');
      console.error('     Asegúrate de haber desactivado "Confirm email" en Supabase primero.');
    } else {
      console.error(`  ❌ Error: ${error.message}`);
    }
    return;
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    console.log('  ⚠️  El usuario ya existía (identities vacío). Sin cambios.');
    return;
  }

  console.log(`  ✅ Usuario creado. ID: ${data.user?.id}`);

  if (data.user?.email_confirmed_at) {
    console.log('  ✓  Email confirmado automáticamente (confirmación desactivada ✔).');
  } else {
    console.log('  ℹ️  El usuario existe pero el email no está confirmado aún.');
    console.log('     Confírmalo manualmente en: https://supabase.com/dashboard/project/fzftntxrkagnvchhwehn/auth/users');
  }

  console.log('\n🔐 Contraseña: Torre26**');
  console.log('🌐 Panel admin: https://somoshispanidad.es/src/admin/admin.html');
  console.log('============================================\n');
}

crearGines().catch(console.error);
