-- ══════════════════════════════════════════════════════════
-- SOMOS HISPANIDAD — Esquema de Base de Datos (Supabase)
-- Versión Idempotente (Segura para re-ejecutar)
-- ══════════════════════════════════════════════════════════

-- 1. TABLAS (CREACIÓN SI NO EXISTEN)
CREATE TABLE IF NOT EXISTS authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'escrito',
  summary TEXT,
  body TEXT,
  image_url TEXT,
  youtube_url TEXT,
  tags TEXT[],
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  event_type TEXT DEFAULT 'Evento',
  image_url TEXT,
  registration_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supporters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  consent BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTUALIZACIÓN DE COLUMNAS (SI YA EXISTÍAN LAS TABLAS)
-- Añadir columnas nuevas de forma segura
DO $$ 
BEGIN 
    -- Autores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='authors' AND column_name='cargo') THEN
        ALTER TABLE authors ADD COLUMN cargo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='authors' AND column_name='published') THEN
        ALTER TABLE authors ADD COLUMN published BOOLEAN DEFAULT true;
    END IF;

    -- Eventos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='published') THEN
        ALTER TABLE events ADD COLUMN published BOOLEAN DEFAULT true;
    END IF;
END $$;


-- 3. SEGURIDAD: Row Level Security (RLS)
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS (ELIMINAR SI EXISTEN Y RE-CREAR)
-- Lectura pública
DROP POLICY IF EXISTS "Lectura pública authors" ON authors;
CREATE POLICY "Lectura pública authors" ON authors FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Lectura pública contents" ON contents;
CREATE POLICY "Lectura pública contents" ON contents FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Lectura pública events" ON events;
CREATE POLICY "Lectura pública events" ON events FOR SELECT USING (published = true);

-- Inserción pública
DROP POLICY IF EXISTS "Insertar inscripciones" ON event_registrations;
CREATE POLICY "Insertar inscripciones" ON event_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Insertar supporters" ON supporters;
CREATE POLICY "Insertar supporters" ON supporters FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Insertar mensajes" ON contact_messages;
CREATE POLICY "Insertar mensajes" ON contact_messages FOR INSERT WITH CHECK (true);

-- Acceso total Admin (Authenticated con email restringido)
DROP POLICY IF EXISTS "Admin ALL Authors" ON authors;
CREATE POLICY "Admin ALL Authors" ON authors TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

DROP POLICY IF EXISTS "Admin ALL Contents" ON contents;
CREATE POLICY "Admin ALL Contents" ON contents TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

DROP POLICY IF EXISTS "Admin ALL Events" ON events;
CREATE POLICY "Admin ALL Events" ON events TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

DROP POLICY IF EXISTS "Admin ALL Registrations" ON event_registrations;
CREATE POLICY "Admin ALL Registrations" ON event_registrations TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

DROP POLICY IF EXISTS "Admin ALL Supporters" ON supporters;
CREATE POLICY "Admin ALL Supporters" ON supporters TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

DROP POLICY IF EXISTS "Admin ALL Messages" ON contact_messages;
CREATE POLICY "Admin ALL Messages" ON contact_messages TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

DROP POLICY IF EXISTS "Lectura pública settings" ON settings;
CREATE POLICY "Lectura pública settings" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin ALL Settings" ON settings;
CREATE POLICY "Admin ALL Settings" ON settings TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 5. DATOS DE EJEMPLO (Opcional, solo si están vacíos)
INSERT INTO authors (name, cargo, bio, published) 
SELECT 'César Pérez Guevara', 'Historiador', 'Especialista en la historia del derecho en la América colonial.', true
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE name = 'César Pérez Guevara');

INSERT INTO authors (name, cargo, bio, published) 
SELECT 'José J. Laorden', 'Investigador', 'Especialista en alianzas entre indígenas y españoles.', true
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE name = 'José J. Laorden');

INSERT INTO contents (title, content_type, summary, published, author_id)
SELECT 'Justicia Real en la América Española', 'conferencia', 'Resumen de la conferencia sobre el sistema jurídico colonial.', true, (SELECT id FROM authors LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contents WHERE title = 'Justicia Real en la América Española');

INSERT INTO events (title, description, event_date, location, event_type, published)
SELECT 'Visita al Museo de América', 'Recorrido por el legado hispánico.', '2026-06-20 10:00:00', 'Madrid', 'Visita Cultural', true
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Visita al Museo de América');

INSERT INTO settings (key, value)
SELECT 'lecturas_recomendadas_url', 'https://protocolodesantapola.es/'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'lecturas_recomendadas_url');

INSERT INTO settings (key, value)
SELECT 'divulgadores_url', 'https://www.youtube.com/@SomosHispanidadTorrelodones'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'divulgadores_url');


-- 6. TABLA DE TRACKING DE VISITAS REALES (ESTADÍSTICAS)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  referrer TEXT,
  country TEXT DEFAULT 'España',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insertar visitas" ON page_views;
CREATE POLICY "Insertar visitas" ON page_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin ALL Visits" ON page_views;
CREATE POLICY "Admin ALL Visits" ON page_views TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));


-- 7. TABLA DE SESIONES ACTIVAS DE ADMINISTRADOR (PREVENCIÓN DE INICIOS DE SESIÓN SIMULTÁNEOS)
CREATE TABLE IF NOT EXISTS active_admin_sessions (
  session_id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE active_admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en sesiones" ON active_admin_sessions;
CREATE POLICY "Permitir todo a usuarios autenticados en sesiones" ON active_admin_sessions TO authenticated 
USING (true) WITH CHECK (true);
