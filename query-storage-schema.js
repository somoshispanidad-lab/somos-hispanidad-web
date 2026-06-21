const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';

async function run() {
  console.log('Logging in...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'storage' }
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'javier@iaparaseniors.org',
    password: 'B3m3t3r10@'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }
  console.log('Login successful!');

  console.log('Querying storage.objects...');
  const { data: objects, error: objectsError } = await supabase
    .from('objects')
    .select('name, bucket_id, metadata')
    .like('name', 'Fotos/El Escorial/%');

  if (objectsError) {
    console.error('Error querying storage.objects:', objectsError);
  } else {
    console.log('Objects:');
    console.log(JSON.stringify(objects, null, 2));
  }

  console.log('Querying storage.buckets...');
  const { data: buckets, error: bucketsError } = await supabase
    .from('buckets')
    .select('*');

  if (bucketsError) {
    console.error('Error querying storage.buckets:', bucketsError);
  } else {
    console.log('Buckets:');
    console.log(JSON.stringify(buckets, null, 2));
  }
}

run();
