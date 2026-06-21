const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Logging in as javier@iaparaseniors.org...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'javier@iaparaseniors.org',
    password: 'B3m3t3r10@'
  });
  if (authError) {
    console.error('Login error:', authError);
    process.exit(1);
  }
  
  console.log('Listing files in Fotos/El Escorial...');
  const { data: filesData, error: filesError } = await supabase.storage.from('Documentos').list('Fotos/El Escorial', {
    limit: 100
  });

  if (filesError) {
    console.error('Error listing files:', filesError);
  } else {
    console.log('Files:');
    console.log(JSON.stringify(filesData, null, 2));
  }
  process.exit(0);
}

run();
