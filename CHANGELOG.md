# Changelog

Todas las novedades relevantes de este proyecto se documentan aquí. El
formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Sprint 0 — Auditoría de seguridad

#### Fixed

- **Cookies de sesión en los logs**: el dashboard imprimía la cabecera
  `Cookie` completa (incluyendo los tokens httpOnly) en `console.log` en
  cada render. Cualquier agregador de logs que recogiera stdout habría
  capturado credenciales válidas. Se eliminan también los `console.error`
  que volcaban el cuerpo de la respuesta del backend en caso de fallo.
- **Parser de `Set-Cookie` roto**: `setAuthCookies` partía cada cookie
  por `=` con `split('=')`, lo que truncaba valores que contuviesen `=`
  (típicos en JWT/refresh tokens base64) y dejaba el resto del valor
  parseado como atributo. Se sustituye por un parser tipado que divide
  solo en la primera aparición de `=` y valida los atributos
  (`samesite`, `max-age`, `expires`) antes de aplicarlos. Se elimina
  además el `any` en las opciones.

#### Added

- **Middleware de autenticación para `/dashboard`**: nuevo
  `src/middleware.ts` que redirige a `/login` cualquier petición a
  `/dashboard/:path*` sin cookie de sesión y preserva la ruta original
  en el parámetro `from`. Hasta ahora la protección dependía solo del
  RSC de `dashboard/page.tsx`, dejando expuestas las sub-rutas
  enlazadas desde el sidebar.

#### Changed

- **`NEXT_PUBLIC_API_BASE_URL` → `BACKEND_URL`**: la URL del backend se
  consumía únicamente desde código server (rewrites, server actions,
  RSC) pero se exponía al bundle del cliente por el prefijo
  `NEXT_PUBLIC_`. Se renombra a `BACKEND_URL` (sin prefijo) en
  `next.config.ts`, `src/lib/env.ts`, ambas server actions, las páginas
  de `/login` y `/register` y el RSC del dashboard.
- **`LogoutButton`**: el componente cliente ya no depende de un env var
  público. Llama a `/auth/logout` a través del rewrite existente de
  Next.js, manteniendo la URL del backend confinada al servidor.

### Sprint 1 — Endurecimiento

#### Added

- **Headers de seguridad HTTP**: `next.config.ts` emite en todas las rutas
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy`, `Strict-Transport-Security` con preload, y una
  `Content-Security-Policy` que permite inline styles (Tailwind/shadcn),
  Google Fonts y URLs `data:`/`blob:` para el QR de 2FA.

#### Fixed

- **User enumeration en login**: el error del backend (`"email not found"` vs
  `"wrong password"`) se reenviaba literalmente al cliente. Login retorna
  siempre `'Credenciales inválidas'`; register distingue solo 409 Conflict
  con un mensaje genérico.
- **TOTP en query string en notas**: `GET /notes?totpCode=...` quedaba en
  logs, historial y Referer. Se migra a la cabecera `X-TOTP-Code` en el
  hook `useNotes` y se sincroniza con el backend.
- **`window.location.href` en login**: el formulario esperaba `success:true`
  y redirigía desde el cliente con un `useEffect`. Se mueve `redirect('/dashboard')`
  a las server actions (`loginAction`, `verifyOtpAction`, `registerAction`)
  para que Next.js gestione la respuesta directamente. Se eliminan
  los imports de `useRouter` y `useEffect` del `LoginForm`.
- **Regex de contraseña incompleto**: `register.ts` usaba
  `/[A-Za-z\d@$!%*?&]/` sin `{8,}$`, que validaba con un solo carácter
  válido sin importar la longitud total. Se corrige a `{8,}$`.

### Sprint 2 — Limpieza y calidad

#### Removed

- **SVGs de create-next-app**: se eliminan `public/file.svg`, `globe.svg`,
  `next.svg`, `vercel.svg` y `window.svg`, que nunca fueron referenciados.
- **`src/app/(public)/page.tsx`**: página demo que duplicaba la pantalla de
  login usando axios con URLs hardcoded a `localhost`. Los usuarios ya
  disponen de `/login` y `/register` con server actions.
- **`src/components/logout-button.tsx`**: implementación duplicada que usaba
  la variable pública eliminada en Sprint 0. El componente canónico está en
  `src/features/auth/components/logout-button.tsx`.

#### Changed (deps)

- Eliminadas `zustand` (sin store definido) y `tailwindcss-animate`
  (no se importa directamente; las animaciones las cubre `tw-animate-css`).
- `@tanstack/react-query-devtools` movido a `devDependencies` y cargado
  mediante `require()` condicional en `providers.tsx`, evitando que los
  ~50 KB del panel lleguen al bundle de producción.

[Unreleased]: https://github.com/Kamerr/next-auth-hybrid/compare/main...HEAD
