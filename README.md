# Somos Hispanidad — Web Oficial

Asociación Cultural sin ánimo de lucro dedicada a divulgar el legado histórico, cultural y social de España en Hispanoamérica, combatiendo la narrativa de la Leyenda Negra.

---

## 📁 Estructura del proyecto

```
/
├── index.html              ← Página principal (landing)
├── package.json            ← Configuración del proyecto
├── vercel.json             ← Configuración para publicar en Vercel
├── .gitignore              ← Archivos que NO se suben a GitHub
├── README.md               ← Este archivo
│
├── /assets/
│   ├── /images/            ← Imágenes del proyecto (logos, fotos)
│   └── /documents/         ← PDFs y documentos descargables
│
└── /src/
    ├── /css/
    │   └── styles.css      ← Todos los estilos compartidos
    │
    ├── /js/
    │   ├── main.js         ← JavaScript general (nav, animaciones)
    │   ├── buscador.js     ← Buscador global 100 % en el navegador
    │   ├── supabaseClient.js ← Preparado para conectar con Supabase
    │   ├── eventos.js      ← Datos y lógica de eventos
    │   ├── contenidos.js   ← Datos y lógica de contenidos y autores
    │   └── contacto.js     ← Lógica del formulario de contacto
    │
    ├── /pages/
    │   ├── asociacion.html ← Quiénes somos, misión y valores
    │   ├── eventos.html    ← Agenda y formulario de inscripción
    │   ├── contenidos.html ← Artículos, vídeos y conferencias
    │   ├── autores.html    ← Ponentes e investigadores
    │   ├── contacto.html   ← Formulario de contacto
    │   └── privacidad.html ← Política de privacidad (RGPD)
    │
    └── /admin/
        ├── admin.html      ← Panel de administración (estructura inicial)
        ├── admin.css       ← Estilos del panel de admin
        └── admin.js        ← Lógica de navegación del panel
```

---

## 🚀 Cómo usar este proyecto

### Ver en local
La forma más sencilla es abrir `index.html` directamente en tu navegador.

Para una experiencia más completa con servidor local:
```bash
npm install
npm run dev
```
Esto abre la web en `http://localhost:3000`

### Subir a GitHub
```bash
git init
git add .
git commit -m "Primer commit — estructura inicial"
git remote add origin https://github.com/TU-USUARIO/somos-hispanidad.git
git push -u origin main
```

### Publicar en Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "New Project"
3. Selecciona tu repositorio de GitHub
4. Deja la configuración por defecto (detecta automáticamente que es una web estática)
5. Haz clic en "Deploy"

---

## 🔧 Cómo funciona la web

### Datos simulados
Mientras no tengamos Supabase conectado, los datos de **eventos**, **contenidos** y **autores** están escritos directamente en los archivos JavaScript:
- `src/js/eventos.js` → Variable `EVENTOS_SIMULADOS`
- `src/js/contenidos.js` → Variables `CONTENIDOS_SIMULADOS` y `AUTORES_SIMULADOS`

Para añadir un nuevo evento, edita la variable `EVENTOS_SIMULADOS` en `eventos.js`.

### Formularios
Los formularios de **contacto** e **inscripción** están preparados pero no envían datos reales. El mensaje se simula localmente. Cuando se conecte Supabase, solo habrá que activar las funciones ya comentadas en el código.

### Panel de administración
Accesible en `/src/admin/admin.html`. No tiene login real todavía. En el futuro, tendrá autenticación con Supabase Auth.

---

## 🗄️ Conectar con Supabase (fase siguiente)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia tu **Project URL** y tu **anon key** desde Settings → API
3. Abre `src/js/supabaseClient.js`
4. Rellena las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY`
5. Descomenta las líneas indicadas en el archivo

Tablas que habrá que crear en Supabase:
- `eventos` (id, titulo, fecha, lugar, tipo, descripcion, url_inscripcion, estado)
- `contenidos` (id, tipo, titulo, autor, fecha, imagen, descripcion, url, etiquetas)
- `autores` (id, nombre, cargo, especialidad, bio, imagen)
- `simpatizantes` (id, nombre, email, evento_id, fecha_registro)
- `mensajes` (id, nombre, email, asunto, mensaje, fecha, leido)

---

## 🎨 Identidad visual

| Elemento | Valor |
|---|---|
| Color principal | `#c9a84c` (dorado) |
| Fondo cálido | `#faf6f0` (warm-white) |
| Crema | `#f5efe6` |
| Tinta oscura | `#2c1a0e` |
| Sepia profundo | `#5c3d1e` |
| Tipografía títulos | Cinzel (serif) |
| Tipografía texto | Cormorant Garamond + Lato |

---

## 📞 Contacto

**Somos Hispanidad**  
28250 Torrelodones, Madrid, España  
contacto@somoshispanidad.es

---

*Proyecto iniciado en mayo de 2026. Estructura preparada para GitHub + Vercel + Supabase.*
