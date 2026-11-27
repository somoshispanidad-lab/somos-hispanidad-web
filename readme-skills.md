# 🧰 Skills del Asistente — Catálogo de Habilidades Reutilizables

> Repositorio de skills guardadas en la base de conocimiento del asistente IA.
> Cada skill es un prompt estructurado que puede invocarse en cualquier proyecto.

---

## Cómo usar una skill

Para activar una skill en cualquier conversación, escribe:
> *"Ejecuta el skill [nombre]"* o *"Usa el modo [nombre]"*

---

## 📋 Catálogo de Skills

---

### 1. 🚀 SúperLanding (Dark Mode Premium)
**Identificador:** `skill_superlanding`
**Cuándo usarla:** Cuando quieras crear una landing page nueva desde cero con un diseño premium moderno en modo oscuro.

**Qué hace:**
- Solicita 3 inputs: información del negocio, sector/estilo y color principal.
- Genera automáticamente todas las imágenes necesarias (logo, hero, servicios) antes del código.
- Produce una landing completa con glassmorphism, animaciones 3D, flip cards de servicios, partículas y CTAs con glow.
- Incluye sistema de diseño completo: tipografía, colores, animaciones, hover states, responsive.

**Output:** `index.html` + `styles.css` + `script.js` + `README.md` + imágenes generadas.

**Activación:** *"Usa el skill SúperLanding para [nombre del proyecto]"*

---

### 2. 🔄 Renovando mi Web / Landing Migration Engine
**Identificador:** `skill_renovando_mi_web` / `skill_renovar_mi_web`
**Cuándo usarla:** Cuando tienes una web existente y quieres transformarla en una landing moderna y optimizada para conversión.

**Qué hace:**
- Lee y analiza la URL de la web actual (o capturas/texto aportado).
- Propone 3 modos de migración: Conservadora / Equilibrada / Agresiva.
- Sigue un flujo de 7 pasos secuenciales: Análisis → Copy → Arquitectura → Assets → Imágenes → Implementación → Entrega.
- Genera SEO completo (OG tags, canonical, favicon, tracking).
- Admite entrega One-page o Multipage.

**Output:** Proyecto web migrado completo + `README.md` con instrucciones de personalización.

**Activación:** *"Ejecuta el skill Renovando mi Web con la URL [url]"*

---

### 3. 🏗️ Web Migración (SúperLanding Dark Mode)
**Identificador:** `skill_web_migracion` / `skill_migracion_superlanding`
**Cuándo usarla:** Variante del skill anterior enfocada en migrar webs existentes específicamente a un diseño SúperLanding Dark Mode. Extrae textos e imágenes de la web original.

**Qué hace:**
- Extrae contenido real de la URL aportada.
- Adapta el diseño SúperLanding (glassmorphism, neons, contadores) al branding original.
- Mantiene identidad de marca mientras moderniza el diseño.

**Output:** Landing Dark Mode con assets y copy de la web original.

**Activación:** *"Migra la web [url] a SúperLanding Dark Mode"*

---

### 4. ✅ Modo Producción (QA + Fix)
**Identificador:** `skill_modo_produccion`
**Cuándo usarla:** Justo antes de publicar o enseñar una web/app. Detecta y corrige problemas de calidad.

**Qué hace:**
- Revisa 4 dimensiones con un checklist fijo:
  - **A) Funciona y se ve:** imágenes, rutas, tipografías.
  - **B) Responsive:** mobile-first, scroll horizontal, legibilidad.
  - **C) Copy y UX:** titulares, CTAs, sin placeholders.
  - **D) Accesibilidad mínima:** contraste, alt en imágenes, headings.
- Genera un diagnóstico priorizado de 5-10 problemas.
- Propone y aplica hasta 8 correcciones.

**Output:** Lista de problemas encontrados + correcciones aplicadas en el código.

**Activación:** *"Ejecuta Modo Producción"* o *"Ejecuta Tarea X: Modo Producción"*

---

### 5. 🖥️ Panel de Control con Supabase
**Identificador:** `skill_panel_control`
**Cuándo usarla:** Cuando quieras añadir un panel de administración privado a cualquier web que use Supabase como backend.

**Qué hace:**
- Genera un panel de control completo con:
  - Login seguro con Supabase Auth.
  - Paneles CRUD configurables (contenidos, eventos, autores, simpatizantes, mensajes).
  - Campo de visibilidad `published` por registro.
  - Panel de Marketing integrado con EmailJS (envío de prueba + envío masivo).
  - Sidebar de navegación, topbar con usuario activo y cierre de sesión.
- Se adapta a las tablas del proyecto (configurable).
- Incluye SQL idempotente para el esquema de base de datos.

**Output:** `admin.html` + `admin.js` + `admin.css` + `supabase-schema.sql`.

**Activación:** *"Ejecuta el skill Panel de Control para [nombre del proyecto]"*

---

### 6. 🏛️ Arquitecto de Software
**Identificador:** `skill_arquitecto_software`
**Ubicación activa:** `.agents/skills/arquitecto-software/SKILL.md`
**Cuándo usarla:** Cuando necesites separar entornos (Producción vs. Test/Evolución), reorganizar carpetas, auditar la estructura del proyecto o tomar decisiones técnicas seguras sin riesgo de romper la web publicada.

**Qué hace:**
- Analiza el estado del proyecto en modo solo lectura antes de tocar nada.
- Diseña planes de separación de código, migración o limpieza protegiendo el entorno de Producción.
- Explica las decisiones de forma breve, clara y sin tecnicismos, pidiendo siempre tu aprobación ("OK") antes de modificar archivos.

**Output:** Diagnóstico claro + ejecución controlada de cambios arquitectónicos.

**Activación:** *"Usa el skill Arquitecto de Software"* o *"Actúa como Arquitecto de Software"*

---

## 🗂️ Tabla Resumen

| Skill | Caso de uso | Output principal |
|---|---|---|
| 🚀 SúperLanding | Crear landing nueva desde cero | index.html + assets generados |
| 🔄 Renovando mi Web | Migrar web existente a landing moderna | Proyecto migrado completo |
| 🏗️ Web Migración | Migrar web a Dark Mode SúperLanding | Landing dark con branding original |
| ✅ Modo Producción | QA antes de publicar | Checklist + correcciones aplicadas |
| 🖥️ Panel de Control | Añadir admin panel a web con Supabase | admin.html + admin.js + SQL |
| 🏛️ Arquitecto de Software | Separar entornos, organizar carpetas y decisiones técnicas | Plan seguro + separación controlada |

---

## 📌 Notas

- Las skills están guardadas en: `/Users/javiermanuelrodriguezrodriguez/.gemini/antigravity/knowledge/`
- Puedes solicitar al asistente que cree nuevas skills en cualquier momento.
- Las skills son **independientes del proyecto**: funcionan en cualquier repositorio.
- Se recomienda ejecutar siempre **Modo Producción** como último paso antes de publicar.
