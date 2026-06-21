-- ══════════════════════════════════════════════════════════
-- SOMOS HISPANIDAD — Migración para Restricción de Roles Admin
-- Ejecutar este script en el SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════

-- 1. Políticas para la tabla 'authors'
DROP POLICY IF EXISTS "Admin ALL Authors" ON authors;
CREATE POLICY "Admin ALL Authors" ON authors TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 2. Políticas para la tabla 'contents'
DROP POLICY IF EXISTS "Admin ALL Contents" ON contents;
CREATE POLICY "Admin ALL Contents" ON contents TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 3. Políticas para la tabla 'events'
DROP POLICY IF EXISTS "Admin ALL Events" ON events;
CREATE POLICY "Admin ALL Events" ON events TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 4. Políticas para la tabla 'event_registrations'
DROP POLICY IF EXISTS "Admin ALL Registrations" ON event_registrations;
CREATE POLICY "Admin ALL Registrations" ON event_registrations TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 5. Políticas para la tabla 'supporters'
DROP POLICY IF EXISTS "Admin ALL Supporters" ON supporters;
CREATE POLICY "Admin ALL Supporters" ON supporters TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 6. Políticas para la tabla 'contact_messages'
DROP POLICY IF EXISTS "Admin ALL Messages" ON contact_messages;
CREATE POLICY "Admin ALL Messages" ON contact_messages TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 7. Políticas para la tabla 'settings'
DROP POLICY IF EXISTS "Admin ALL Settings" ON settings;
CREATE POLICY "Admin ALL Settings" ON settings TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 8. Políticas para la tabla 'page_views' (Estadísticas)
DROP POLICY IF EXISTS "Admin ALL Visits" ON page_views;
CREATE POLICY "Admin ALL Visits" ON page_views TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));

-- 9. Creación y políticas de la tabla 'active_admin_sessions' (Prevención de inicios de sesión simultáneos)
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

-- 10. Políticas para la tabla 'cultural_visits'
DROP POLICY IF EXISTS "Admin ALL Cultural Visits" ON cultural_visits;
CREATE POLICY "Admin ALL Cultural Visits" ON cultural_visits TO authenticated 
USING (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('javier@iaparaseniors.org', 'somoshispanidad@gmail.com', 'adelaida.pm@gmail.com', 'muygines@gmail.com', 'chemillorente@gmail.com'));
