const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const admins = [
  { email: 'chemillorente@gmail.com', nombre: 'Chemi' },
  { email: 'adelaida.pm@gmail.com',   nombre: 'Adelaida' },
  { email: 'muygines@gmail.com',      nombre: 'Ginés' },
];
const PASSWORD = 'Torre26**';

async function verificar({ email, nombre }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) {
    console.log(`  ❌ ${nombre} <${email}>: ${error.message}`);
    return false;
  }
  console.log(`  ✅ ${nombre} <${email}>: login OK (uid: ${data.user.id.slice(0,8)}...)`);
  await supabase.auth.signOut();
  return true;
}

async function main() {
  console.log('============================================');
  console.log(' VERIFICACIÓN DE ACCESO — 3 ADMINISTRADORES');
  console.log('============================================');
  for (const admin of admins) {
    await verificar(admin);
  }
  console.log('============================================\n');
}
main().catch(console.error);
