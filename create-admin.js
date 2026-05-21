const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdminUser() {
  const email = 'somoshispanidad@gmail.com';
  const password = 'Torrelodones2026**';

  console.log(`Intentando crear usuario: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Error creando usuario:', error.message);
  } else {
    console.log('Usuario creado exitosamente. Data:', data);
    if (data.user && data.user.identities && data.user.identities.length === 0) {
       console.log('El usuario ya existía o hubo un problema.');
    }
  }
}

createAdminUser();
