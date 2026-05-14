<h1 align="center">next-auth-hybrid</h1>

<p align="center">
  Full-featured authentication frontend built with Next.js 16 App Router — server actions, 2FA, OAuth and production-ready security headers.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=flat-square" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP_Top_10-audited-4CAF50?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

---

## Overview

`next-auth-hybrid` is the frontend counterpart to [`nest-auth-hybrid`](https://github.com/KamerrEzz/nest-auth-hybrid). It provides a polished authentication UI built on the **Next.js App Router** with React Server Components, Server Actions and route middleware — no client-side token storage, no security shortcuts.

---

## Features

### Authentication
- **Register / Login** — validated Server Actions with typed error states and server-side redirect on success
- **Two-Factor Authentication** — TOTP code entry flow (Google Authenticator compatible), backup code usage
- **OAuth** — Google and Discord one-click login via the backend proxy
- **Session management** — list active sessions, revoke individual or all-other devices

### Security
- **Route middleware** — `src/middleware.ts` protects every `/dashboard/*` route before render; unauthenticated requests redirect to `/login?from=<path>`
- **HTTP security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (HSTS with preload) and a full `Content-Security-Policy` — all applied in `next.config.ts`
- **Backend URL never public** — `BACKEND_URL` env var (no `NEXT_PUBLIC_` prefix) is only read server-side; the client never sees the internal backend address
- **Cookie forwarding** — `Set-Cookie` headers from the backend are forwarded to the browser through a typed parser that handles base64 `=` padding in JWT values correctly
- **Generic error messages** — login always returns "Credenciales inválidas" regardless of whether the email exists, preventing user enumeration
- **CSRF priming** — CSRF token loaded at page render and attached to every mutating request via the axios interceptor

### Developer experience
- **React Query** with sensible defaults (1 min stale, 5 min gc, no window-focus refetch)
- **React Query Devtools** loaded only in development (conditional `require()`) — zero production bundle impact
- **React Hook Form** + Zod validation on all forms
- **shadcn/ui** component library with Tailwind CSS v4

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, shadcn/ui, Tailwind CSS 4 |
| Server state | @tanstack/react-query 5 |
| Forms | react-hook-form + Zod |
| HTTP client | axios (client) + native fetch (server) |
| Notifications | Sonner |
| Icons | Lucide React |
| Tests | Vitest + Testing Library |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (middleware-gated)
│   │   └── dashboard/      # Main authenticated page
│   ├── (public)/           # Unauthenticated routes
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
│       └── hooks/          # useNotes (TOTP via X-TOTP-Code header)
├── components/             # Shared UI (Navbar, Sidebar, shadcn components)
├── lib/
│   ├── api.ts              # Axios instance with CSRF interceptor
│   └── env.ts              # Runtime env validation (Zod)
└── middleware.ts            # Route protection
```

---

## Quick Start

### Prerequisites
- Node.js >= 20
- A running instance of [nest-auth-hybrid](https://github.com/KamerrEzz/nest-auth-hybrid)

### 1. Clone and install

```bash
git clone https://github.com/KamerrEzz/next-auth-hybrid.git
cd next-auth-hybrid
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

```env
# Internal backend URL — server-only, never exposed to the browser
BACKEND_URL=http://localhost:3000

NODE_ENV=development
```

### 3. Run

```bash
npm run dev       # Development (http://localhost:3001)
npm run build     # Production build
npm run start     # Production server
npm test          # Vitest unit tests
```

---

## Authentication Flow

```
Browser                  Next.js (server)            NestJS Backend
   |                          |                            |
   |-- POST /login ---------->|                            |
   |  (Server Action)         |-- POST /auth/login ------->|
   |                          |                            |-- validate credentials
   |                          |<-- 200 + Set-Cookie -------|
   |                          |    (sessionId httpOnly)    |
   |<-- redirect /dashboard --|                            |
   |                          |                            |
   |-- GET /dashboard ------->|                            |
   |  (middleware checks       |-- GET /auth/me ----------->|
   |   sessionId cookie)      |<-- 200 { user } -----------|
   |<-- render dashboard -----|                            |

   -- 2FA flow -----------------------------------------------
   |-- POST /login ---------->|-- POST /auth/login ------->|
   |                          |<-- 200 { requiresOtp,      |
   |<-- show OTP form --------|         tempToken }         |
   |-- POST /verify-otp ----->|-- POST /auth/verify-otp -->|
   |  (totpCode + tempToken)  |<-- 200 + Set-Cookie -------|
   |<-- redirect /dashboard --|                            |
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | Internal URL of the NestJS API (server-only) |
| `NODE_ENV` | Yes | `development` or `production` or `test` |

> `BACKEND_URL` intentionally has **no** `NEXT_PUBLIC_` prefix — it is only consumed server-side (rewrites, Server Actions, RSC) and must never appear in the client bundle.

---

## Security Headers

Every response includes the following headers (configured in `next.config.ts`):

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |

---

## License

MIT © [Kamerr Ezz](https://github.com/KamerrEzz)
