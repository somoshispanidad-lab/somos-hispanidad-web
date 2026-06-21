const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'somoshispanidad@gmail.com',
    password: 'Torrelodones2026**'
  });
  if (authError) {
    console.error('Login error:', authError);
    return;
  }
  
  console.log('Listing folders in root...');
  const { data: rootFiles, error: rootError } = await supabase.storage.from('Documentos').list('', { limit: 100 });
  console.log('Root files:', rootFiles, rootError);

  console.log('Listing folders in Fotos...');
  const { data: fotosFiles, error: fotosError } = await supabase.storage.from('Documentos').list('Fotos', { limit: 100 });
  console.log('Fotos files:', fotosFiles, fotosError);
}

run();
