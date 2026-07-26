-- ══════════════════════════════════════════════════════════
-- SOMOS HISPANIDAD — Habilitar permisos RLS en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard/project/fzftntxrkagnvchhwehn/sql)
-- ══════════════════════════════════════════════════════════

-- 1. Asegurar que el bucket 'Documentos' existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('Documentos', 'Documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir lectura pública de archivos en el bucket 'Documentos'
DROP POLICY IF EXISTS "Permitir lectura publica de Documentos" ON storage.objects;
CREATE POLICY "Permitir lectura publica de Documentos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Documentos');

-- 3. Permitir inserción (upload) de archivos en el bucket 'Documentos' para todos (o authenticated / public)
DROP POLICY IF EXISTS "Permitir subida en Documentos" ON storage.objects;
CREATE POLICY "Permitir subida en Documentos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'Documentos');

-- 4. Permitir actualización (upsert/modificación) de archivos en el bucket 'Documentos'
DROP POLICY IF EXISTS "Permitir actualizacion en Documentos" ON storage.objects;
CREATE POLICY "Permitir actualizacion en Documentos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'Documentos');
