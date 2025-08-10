# 🚤 NavBoat — Análisis del Proyecto

> Documento amigable con iconos para entender rápidamente la arquitectura, tecnologías y cómo trabajar con este repo.

---

## 🧰 Stack Tecnológico

- ⚛️ React 18 + 🔷 TypeScript
- ⚡ Vite 5 (dev server en `:8080`)
- 🌬️ Tailwind CSS 3 + ✨ tailwindcss-animate
- 🧩 shadcn/ui + 🎛️ Radix UI (componentes accesibles)
- 🧭 React Router DOM (ruteo SPA)
- 🔁 TanStack React Query (capa de data fetching/cache)
- ✅ Zod + 📝 React Hook Form (validación y formularios)
- 📊 Recharts (gráficos)
- 🎠 Embla Carousel (carrusel)
- 🔔 Sonner + ☕ Toaster (notificaciones)
- 🌗 next-themes (temas/light-dark)
- 🗂️ Alias `@` a `src/` (Vite)

Archivos clave:
- `package.json` — scripts y dependencias
- `vite.config.ts` — plugins (React SWC, lovable-tagger), server `8080`, alias `@`
- `tailwind.config.ts` — tema extendido (colores CSS vars, sombras, anims)
- `index.html` — metadatos y punto de entrada `#root`

---

## 🗺️ Rutas (SPA)
Fuente: `src/App.tsx`

- `/` → `Index`
- `/profile` → `Profile`
- `/login` → `Login`
- `/register` → `Register`
- `/register-step2` → `RegisterStep2`
- `/auth/success` → `AuthSuccess`
- `/list-your-boat` → `ListYourBoat`
- `*` → `NotFound`

Providers globales:
- `QueryClientProvider` (React Query)
- `TooltipProvider` (Radix)
- `Toaster` + `Sonner` (notificaciones)

---

## 🗂️ Estructura del proyecto

- `src/main.tsx` — monta `<App />` y carga `index.css`
- `src/App.tsx` — router, providers y toasters
- `src/pages/`
  - `Index.tsx` — home/landing
  - `Login.tsx`, `Register.tsx`, `RegisterStep2.tsx`, `AuthSuccess.tsx`
  - `Profile.tsx`, `ListYourBoat.tsx`, `NotFound.tsx`
- `src/components/`
  - `Header.tsx`, `Footer.tsx`, `HeroSection.tsx`
  - `FeaturedBoats.tsx` (listado destacado)
  - `ApiConnectionTest.tsx` (prueba de conectividad API)
  - `components/ui/` (biblioteca UI basada en shadcn/Radix)
- `src/stores/slices/`
  - `basicSlice.ts` — utilidades de API: registro, login, update, OAuth popups
- `src/lib/` — helpers (p.ej. `api` y constantes)
- `src/types/` — tipados compartidos (p.ej. `types/api`)

---

## 🔐 Integración con API y Auth

- Archivo `.env.example` define `VITE_API_URL` (requerido). Crea `.env` con:
  ```env
  VITE_API_URL=https://tu-backend.example.com
  ```
- `basicSlice.ts` usa `API_BASE_URL` (`src/lib/api`) para:
  - `testConnection()` — GET raíz
  - `createUser(userData)` — POST `/api/users/register`
  - `updateUser(userId, data)` — PUT `/api/users/:id`
  - `loginUser(credentials)` — POST `/api/users/login`
  - `loginWithGoogle()` y `loginWithFacebook()` — OAuth via popup, guarda `authToken` en `localStorage` y redirige a `/`.

Notas:
- Asegura CORS y el flujo postMessage entre popup y app si el backend corre en otro dominio.
- Considera centralizar el `authToken` en React Query o contexto si se usa ampliamente.

---

## 🎨 Diseño y Temas

- Tailwind con tema extendido (colores CSS variables: `--primary`, `--accent`, `--sidebar-*`, etc.)
- Sombras personalizadas (`--shadow-*`) y fondos con gradientes (`--gradient-*`).
- Animaciones predefinidas: `accordion-up/down`, `wave`, `float`, `shimmer`.
- Componentes shadcn/ui + Radix UI para UI accesible y consistente.

---

## 🧪 Componentes destacados

- `HeroSection` — bloque hero con estilos y animaciones
- `Header`/`Footer` — navegación y pie de página
- `FeaturedBoats` — listado/recuadros de barcos destacados
- `ApiConnectionTest` — verificación de conexión a la API

Sugerencias:
- Añadir `skeletons` o `fallbacks` con React Query durante cargas.
- Reutilizar variantes con `class-variance-authority` y `tailwind-merge` (ya incluidas).

---

## 🧵 Scripts disponibles
Fuente: `package.json`

- ▶️ `npm run dev` — iniciar Vite (modo desarrollo)
- 🏗️ `npm run build` — build producción
- 🧪 `npm run build:dev` — build en modo development
- ✅ `npm run lint` — ESLint
- 👀 `npm run preview` — servir build localmente

Servidor de desarrollo: `http://localhost:8080`

---

## ⚙️ Configuración relevante

- `vite.config.ts`
  - Plugin `@vitejs/plugin-react-swc`
  - `lovable-tagger` en development
  - `server: { host: "::", port: 8080 }`
  - `alias '@': path.resolve('./src')`
- `tailwind.config.ts`
  - `darkMode: ["class"]`
  - `content: ["./src/**/*.{ts,tsx}", ...]`
  - Extensiones de tema (colores, sombras, radios, animaciones)

---

## 🚀 Cómo ejecutar localmente

1) Instala dependencias
```bash
npm i
```
2) Copia `.env.example` a `.env` y define `VITE_API_URL`
```bash
cp .env.example .env
# En Windows PowerShell
# Copy-Item .env.example .env
```
3) Ejecuta el servidor
```bash
npm run dev
```
4) Abre `http://localhost:8080`

Build de producción:
```bash
npm run build && npm run preview
```

---

## 🌐 Despliegue sugerido

- Plataformas compatibles: Vercel, Netlify, Render, Fly.io, GitHub Pages (con adaptaciones)
- Build command: `npm run build`
- Directorio de salida: `dist/`
- Variables de entorno: `VITE_API_URL`

Recomendaciones:
- Configurar `SPA fallback` a `index.html` para rutas del router.
- Habilitar HTTPS y revisar CORS del backend.

---

## ✅ Checklist de calidad (rápida)

- [ ] `.env` con `VITE_API_URL` configurado
- [ ] Flujos de registro/login funcionando contra backend
- [ ] Manejo de errores y toasts en formularios
- [ ] Estados de carga con React Query
- [ ] SEO básico en `index.html` (ya incluye meta/OG/Twitter)
- [ ] Accesibilidad en componentes Radix/shadcn

---

## 🧭 Próximos pasos sugeridos

- 🔐 Centralizar auth (contexto o React Query + persistencia segura)
- 🧱 Crear capa de API con `fetch` envuelto (reintentos, timeouts, auth header)
- 🧩 Unificar diseño con tokens/temas y `cn()` helpers
- 🧪 Añadir pruebas unitarias básicas (p. ej. vitest)
- 📈 Métricas de UX (LCP/CLS) y logging de errores
- 🗃️ Mejorar tipados en `types/api` y respuestas del backend

---

## ℹ️ Notas del repositorio

- Este proyecto proviene de plantilla Lovable (ver `README.md`) con ajustes para NavBoat.
- UI y copy orientados a alquiler de barcos/yates.

Si quieres que agregue capturas, un mapa de navegación visual o un diagrama de arquitectura, dímelo y lo integro aquí. 🌊

---

## 🛠️ Backend (SailShare API)

Fuente: `D:/repos/boat/-sail-share-react-back/`

- 🧱 Node.js + Express 4
- 🍃 MongoDB (Mongoose)
- 🔐 Auth con Passport (Google OAuth 2.0, Facebook) + JWT
- 🌍 CORS habilitado
- 🛠️ Nodemon en dev

Scripts (`package.json`):
- ▶️ `npm run dev` — nodemon `src/server.js`
- 🚀 `npm start` — node `src/server.js`

Config principal: `src/server.js`
- Puerto: `PORT` (por defecto `5000`)
- Healthcheck: `GET /` → `{ message: 'SailShare API funcionando', status: 'OK' }`
- Middlewares: `cors()`, `express.json()`, log básico por request, `passport.initialize()`
- Conexión MongoDB: `mongoose.connect(process.env.MONGODB_URI)`

### 🔑 Variables de entorno (`.env.example`)
```
MONGODB_URI=...
PORT=5000
NODE_ENV=development
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
SESSION_SECRET=...
CLIENT_URL=http://localhost:8080
```

### 📚 Estructura backend

- `src/server.js` — bootstrap de servidor, conexión Mongo, rutas y middlewares
- `src/routes/`
  - `authRoutes.js` — `/api/auth/*`
  - `userRoutes.js` — `/api/users/*`
- `src/controllers/`
  - `authController.js` — handlers OAuth, JWT y endpoints `/auth`
  - `userController.js` — registro, login, CRUD básico de usuarios
- `src/models/`
  - `User.js` — esquema de usuario (campos como `firstName`, `lastName`, `email`, `password`, `googleId`, `facebookId`, `isVerified`)
- `src/config/`
  - `passport.js` — estrategias Google y Facebook

### 🧭 Endpoints principales (resumen)

- Salud
  - `GET /` → OK

- Barcos (placeholders)
  - `GET /api/boats` → listado (placeholder)
  - `GET /api/boats/:id` → detalle (placeholder)

- Usuarios (`/api/users`)
  - `POST /register` — registrar usuario
  - `POST /login` — login usuario
  - `GET /` — obtener todos
  - `GET /:id` — obtener por id
  - `PUT /:id` — actualizar por id

- Auth (`/api/auth`)
  - `GET /google` → inicia OAuth Google
  - `GET /google/callback` → genera JWT y redirige a `${CLIENT_URL}/auth/success?token=...&provider=google`
  - `GET /facebook` → inicia OAuth Facebook
  - `GET /facebook/callback` → genera JWT y redirige a `${CLIENT_URL}/auth/success?token=...&provider=facebook`
  - `POST /logout` → logout lógico (cliente elimina token)
  - `GET /me` → pendiente de middleware JWT (actualmente 401 placeholder)

Notas de seguridad:
- Usa `JWT_SECRET` robusto
- Implementa middleware JWT y protégelo en rutas que correspondan (p. ej. `/auth/me`)
- Valida orígenes CORS según ambientes

---

## 🔗 Integración Frontend ↔ Backend

- Base URL frontend (`.env`): `VITE_API_URL=http://localhost:5000`
- Flujos OAuth:
  1) Front abre popup a `GET {API_BASE_URL}/api/auth/{google|facebook}`
  2) Backend autentica y redirige a `CLIENT_URL/auth/success?token=...&provider=...`
  3) Página `src/pages/AuthSuccess.tsx` publica el `token` al `window.opener` (postMessage) y cierra el popup
  4) Front recibe el mensaje en `loginWithGoogle()`/`loginWithFacebook()` (`src/stores/slices/basicSlice.ts`), guarda `authToken` y redirige a `/`

Recomendaciones de integración:
- CORS: permitir `http://localhost:8080` en dev
- Alinear `CLIENT_URL` del backend con la URL del front (dev/producción)
- Centralizar el token (contexto/React Query) y manejar expiración/refresh si aplica

---

## 🧪 Cómo ejecutar backend localmente

```bash
# En D:/repos/boat/-sail-share-react-back
npm i
cp .env.example .env
# Define MONGODB_URI, CLIENT_URL, JWT_SECRET, Google/Facebook keys
npm run dev
# Servirá en http://localhost:5000
```

Prueba rápida desde el front:
- `GET /` con `ApiConnectionTest.tsx` o `testConnection()` debe devolver `status: OK`
- Flujos `/api/users/register` y `/api/users/login` desde formularios del front
