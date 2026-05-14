<h1 align="center">next-auth-hybrid</h1>

<p align="center">
  Frontend de autenticación completo construido con Next.js 16 App Router — server actions, 2FA, OAuth y cabeceras de seguridad listas para producción.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=flat-square" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP_Top_10-auditado-4CAF50?style=flat-square" />
  <img src="https://img.shields.io/badge/Licencia-MIT-yellow?style=flat-square" />
</p>

<p align="center">
  <a href="./README.en.md">🇬🇧 English version</a>
</p>

---

## Descripción general

`next-auth-hybrid` es el frontend complementario de [`nest-auth-hybrid`](https://github.com/KamerrEzz/nest-auth-hybrid). Proporciona una interfaz de autenticación construida sobre el **Next.js App Router** con React Server Components, Server Actions y middleware de rutas — sin almacenamiento de tokens en el cliente, sin atajos de seguridad.

---

## Funcionalidades

### Autenticación
- **Registro / Login** — Server Actions validadas con estados de error tipados y redirección en el servidor al completar correctamente
- **Autenticación de dos factores** — flujo de entrada de código TOTP (compatible con Google Authenticator), uso de códigos de respaldo
- **OAuth** — login con un clic mediante Google y Discord a través del proxy del backend
- **Gestión de sesiones** — listar sesiones activas, revocar dispositivos de forma individual o en bloque

### Seguridad
- **Middleware de rutas** — `src/middleware.ts` protege cada ruta `/dashboard/*` antes del render; las peticiones no autenticadas redirigen a `/login?from=<ruta>`
- **Cabeceras de seguridad HTTP** — `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (HSTS con preload) y una `Content-Security-Policy` completa — todas aplicadas en `next.config.ts`
- **URL del backend nunca pública** — la variable de entorno `BACKEND_URL` (sin prefijo `NEXT_PUBLIC_`) solo se lee en el servidor; el cliente nunca ve la dirección interna del backend
- **Reenvío de cookies** — las cabeceras `Set-Cookie` del backend se reenvían al navegador mediante un parser tipado que gestiona correctamente el padding `=` en valores JWT en base64
- **Mensajes de error genéricos** — el login siempre devuelve "Credenciales inválidas" independientemente de si el email existe, previniendo la enumeración de usuarios
- **Preparación CSRF** — el token CSRF se carga al renderizar la página y se adjunta a cada petición mutante mediante el interceptor de axios

### Experiencia de desarrollo
- **React Query** con valores por defecto sensatos (1 min stale, 5 min gc, sin refetch al recuperar el foco)
- **React Query Devtools** cargado solo en desarrollo (mediante `require()` condicional) — sin impacto en el bundle de producción
- **React Hook Form** + validación Zod en todos los formularios
- **shadcn/ui** con Tailwind CSS v4

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, shadcn/ui, Tailwind CSS 4 |
| Estado del servidor | @tanstack/react-query 5 |
| Formularios | react-hook-form + Zod |
| Cliente HTTP | axios (cliente) + fetch nativo (servidor) |
| Notificaciones | Sonner |
| Iconos | Lucide React |
| Tests | Vitest + Testing Library |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (app)/              # Rutas protegidas (gestionadas por middleware)
│   │   ├── dashboard/      # Página principal autenticada
│   │   ├── loading.tsx     # Indicador de carga
│   │   └── error.tsx       # Boundary de errores
│   ├── (public)/           # Rutas no autenticadas
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx
│   └── providers.tsx       # QueryClient + Toaster
├── features/
│   ├── auth/
│   │   ├── actions/        # Server Actions: login, register, verifyOtp
│   │   └── components/     # LoginForm, RegisterForm, LogoutButton, etc.
│   └── notes/
│       ├── components/     # NotesPanel
│       └── hooks/          # useNotes (TOTP vía cabecera X-TOTP-Code)
├── components/             # UI compartida (Navbar, Sidebar, componentes shadcn)
├── lib/
│   ├── api.ts              # Instancia axios con interceptor CSRF
│   └── env.ts              # Validación de entorno en tiempo de ejecución (Zod)
└── middleware.ts            # Protección de rutas
```

---

## Inicio rápido

### Requisitos previos
- Node.js >= 20
- Una instancia en ejecución de [nest-auth-hybrid](https://github.com/KamerrEzz/nest-auth-hybrid)

### 1. Clonar e instalar

```bash
git clone https://github.com/KamerrEzz/next-auth-hybrid.git
cd next-auth-hybrid
npm install
```

### 2. Configurar el entorno

```bash
cp .env.example .env.local
```

```env
# URL interna del backend — solo en servidor, nunca expuesta al navegador
BACKEND_URL=http://localhost:3000

NODE_ENV=development
```

### 3. Ejecutar

```bash
npm run dev       # Desarrollo (http://localhost:3001)
npm run build     # Build de producción
npm run start     # Servidor de producción
npm test          # Tests unitarios con Vitest
```

---

## Flujo de autenticación

```
Navegador               Next.js (servidor)          Backend NestJS
   |                          |                            |
   |-- POST /login ---------->|                            |
   |  (Server Action)         |-- POST /auth/login ------->|
   |                          |                            |-- valida credenciales
   |                          |<-- 200 + Set-Cookie -------|
   |                          |    (sessionId httpOnly)    |
   |<-- redirect /dashboard --|                            |
   |                          |                            |
   |-- GET /dashboard ------->|                            |
   |  (middleware comprueba    |-- GET /auth/me ----------->|
   |   cookie sessionId)      |<-- 200 { user } -----------|
   |<-- renderiza dashboard --|                            |

   -- Flujo 2FA -----------------------------------------------
   |-- POST /login ---------->|-- POST /auth/login ------->|
   |                          |<-- 200 { requiresOtp,      |
   |<-- muestra form OTP -----|         tempToken }         |
   |-- POST /verify-otp ----->|-- POST /auth/verify-otp -->|
   |  (totpCode + tempToken)  |<-- 200 + Set-Cookie -------|
   |<-- redirect /dashboard --|                            |
```

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `BACKEND_URL` | Sí | URL interna de la API NestJS (solo servidor) |
| `NODE_ENV` | Sí | `development`, `production` o `test` |

> `BACKEND_URL` no tiene prefijo `NEXT_PUBLIC_` intencionalmente — solo se consume en el servidor (rewrites, Server Actions, RSC) y nunca debe aparecer en el bundle del cliente.

---

## Cabeceras de seguridad

Cada respuesta incluye las siguientes cabeceras (configuradas en `next.config.ts`):

| Cabecera | Valor |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |

---

## Licencia

MIT © [Kamerr Ezz](https://github.com/KamerrEzz)
