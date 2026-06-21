const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fzftntxrkagnvchhwehn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZnRudHhya2FnbnZjaGh3ZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzQyMzEsImV4cCI6MjA5NDA1MDIzMX0.AEdBRj7UE8HV5T7ENUNB0PpvzW5CsXJTUIp9w6HqvIQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('--- EVENTS ---');
  const { data: events, error: errEvents } = await supabase.from('events').select('*');
  console.log(JSON.stringify(events, null, 2), errEvents);

  console.log('--- CONTENTS ---');
  const { data: contents, error: errContents } = await supabase.from('contents').select('*');
  console.log(JSON.stringify(contents, null, 2), errContents);

  console.log('--- SETTINGS ---');
  const { data: settings, error: errSettings } = await supabase.from('settings').select('*');
  console.log(JSON.stringify(settings, null, 2), errSettings);
}

run();
