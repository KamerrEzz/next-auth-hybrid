# Guía de Producción — VaultAuth

Guía completa para desplegar el stack en un servidor real: configuración de entorno, reverse proxy (Nginx / Caddy), HTTPS, seguridad del servidor y gestión de dominios/subdominios.

---

## Arquitectura del stack

```
Internet
   │
   ▼
[Cloudflare / DNS]
   │
   ▼
[Nginx / Caddy]  ← reverse proxy + TLS termination
   ├── auth.tudominio.com  → Next.js  (puerto 3001)
   └── api.tudominio.com   → NestJS   (puerto 3000)
       ├── PostgreSQL (puerto 5432, solo interno)
       └── Redis      (puerto 6379, solo interno)
```

---

## Subdominio vs ruta única

Hay dos formas de exponer el frontend y el backend. Ambas son válidas; la elección depende del tamaño del proyecto y sus requisitos de escalabilidad.

### Comparación

| | Subdominios separados | Ruta única |
|---|---|---|
| **Ejemplo** | `vault.com` + `api.vault.com` | `vault.com` + `vault.com/api` |
| **CORS** | Obligatorio configurar | Sin CORS (mismo origen) |
| **Cookies** | Requiere `domain=.vault.com` en el backend | Funcionan sin configuración extra |
| **Servidores** | Pueden ser máquinas distintas | Mismo servidor (o proxy central) |
| **SSL** | Un cert por subdominio (o wildcard) | Un solo certificado |
| **Escalabilidad** | Backend y frontend escalan por separado | Escalan juntos |
| **Complejidad** | Mayor configuración inicial | Configuración más simple |
| **Recomendado para** | Proyectos medianos/grandes, múltiples clientes | Proyectos pequeños/medianos, servidor único |

---

### Opción A — Subdominios separados

```
vault.com      → Next.js  (puerto 3001)
api.vault.com  → NestJS   (puerto 3000)
```

**Variables de entorno:**

```env
# Backend
CORS_ORIGINS=https://vault.com
APP_URL=https://api.vault.com

# Frontend
BACKEND_URL=http://localhost:3000        # server-side (mismo servidor)
NEXT_PUBLIC_API_URL=https://api.vault.com
```

**⚠️ Cookies entre subdominios distintos:**
Las cookies HttpOnly del backend (`sessionId`) no aplican automáticamente al frontend en `vault.com` si fueron emitidas desde `api.vault.com`. Para resolverlo, el backend debe emitir las cookies con `domain=.vault.com` (el punto delante significa "aplica a todos los subdominios").

Busca la configuración de sesión/cookie en el backend y añade la propiedad `domain`:

```typescript
// src/config/ o donde se configura la cookie de sesión
cookie: {
  domain: '.vault.com',  // aplica a vault.com y api.vault.com
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
}
```

**Nginx:**

```nginx
# /etc/nginx/sites-available/vault.com
server {
    listen 443 ssl http2;
    server_name vault.com;
    # ssl_certificate ...
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# /etc/nginx/sites-available/api.vault.com
server {
    listen 443 ssl http2;
    server_name api.vault.com;
    # ssl_certificate ...
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy:**

```caddyfile
vault.com {
    reverse_proxy localhost:3001
}

api.vault.com {
    reverse_proxy localhost:3000
}
```

**DNS:**

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `@` (raíz) | `IP_DEL_SERVIDOR` |
| A | `api` | `IP_DEL_SERVIDOR` |

---

### Opción B — Ruta única (mismo origen)

```
vault.com      → Next.js  (puerto 3001)
vault.com/api  → NestJS   (puerto 3000)
```

La opción más simple: **un solo dominio, sin CORS, cookies sin ajustes especiales**. El proxy redirige todo lo que empieza por `/api` al backend y el resto al frontend.

**Variables de entorno:**

```env
# Backend — sin CORS_ORIGINS (todo viene del mismo origen)
CORS_ORIGINS=
APP_URL=https://vault.com

# Frontend
BACKEND_URL=http://localhost:3000      # server-side: Next.js llama al NestJS directo
NEXT_PUBLIC_API_URL=https://vault.com/api  # client-side: el browser llama a vault.com/api
```

**Nginx:**

```nginx
# /etc/nginx/sites-available/vault.com
server {
    listen 80;
    server_name vault.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vault.com;

    ssl_certificate     /etc/letsencrypt/live/vault.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;

    # API → NestJS (quita el prefijo /api antes de reenviar)
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Frontend → Next.js
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Caddy:**

```caddyfile
vault.com {
    # API → NestJS (strip /api prefix)
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy localhost:3000
    }

    # Frontend → Next.js
    handle {
        reverse_proxy localhost:3001
    }
}
```

**DNS:**

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `@` (raíz) | `IP_DEL_SERVIDOR` |

**Nota importante:** el `rewrite` / `strip_prefix` quita `/api` antes de llegar al backend, así que las rutas del NestJS siguen siendo `/auth/login`, no `/api/auth/login`. Si prefieres que el NestJS también maneje el prefijo, configura en `main.ts`:

```typescript
app.setGlobalPrefix('api');
```

Y elimina el `rewrite` de Nginx (o el `uri strip_prefix` de Caddy) para que el path llegue completo.

---

### ¿Cuándo elegir cada opción?

**Elige subdominios si:**
- El frontend y backend irán en servidores distintos en algún momento
- Tienes múltiples clientes consumiendo el mismo API (web + móvil + panel admin)
- Quieres escalar el backend de forma independiente
- El equipo trabaja por separado en cada servicio

**Elige ruta única si:**
- Es un proyecto personal, pequeño o mediano con un servidor
- Quieres la configuración más simple posible
- No planeas separar los servicios en el corto plazo
- Las cookies y la ausencia de CORS simplificados son prioridad

---

## ¿Cuándo usar VaultAuth como proyecto completo?

VaultAuth no es solo un microfrontend de autenticación. Es un sistema completo listo para ser la base de tu producto:

- Registro e inicio de sesión con email/contraseña
- OAuth con Google y Discord
- Autenticación de dos factores TOTP + backup codes
- Sesiones múltiples por usuario con gestión y cierre remoto
- OTP por email para verificaciones sensibles
- Rate limiting, CSRF, cookies HttpOnly
- Panel de usuario con UI completa

### Úsalo cuando necesites

| Caso de uso | ¿Aplica? |
|---|---|
| SaaS con usuarios propios | ✅ |
| Dashboard o herramienta interna | ✅ |
| MVP que necesita auth completo rápido | ✅ |
| App B2C con login social + 2FA | ✅ |
| Reemplazar Auth0 / Clerk con solución self-hosted | ✅ |
| App con login básico sin 2FA | ✅ (ignora lo que no necesitas) |
| Backend API consumido por app móvil propia | ✅ (solo el backend) |
| Múltiples frontends con un auth central | ✅ (solo el backend + CORS por cliente) |
| Alta concurrencia sin escala horizontal | ⚠️ (necesita ajustes de infraestructura) |
| Multi-tenant con DB aislada por organización | ⚠️ (requiere modificación del schema) |
| Autenticación empresarial SAML / LDAP / AD | ❌ (no incluido) |

### Cómo extender el proyecto para tu producto

El sistema está diseñado para ser el núcleo de una app mayor. La estructura favorece agregar módulos sin tocar el código de auth.

**Backend — agrega tus módulos NestJS:**

```
src/
├── features/
│   ├── auth/          ← no modificar
│   └── tu-feature/    ← tus endpoints, services, controllers
└── modules/
    └── user/          ← extiende User en prisma/schema.prisma si necesitas campos extra
```

El guard `HybridAuthGuard` ya protege rutas con sesión. Solo aplícalo a tus endpoints:

```typescript
@UseGuards(HybridAuthGuard)
@Get('mi-recurso')
getMiRecurso(@CurrentUser() user: { id: string }) { ... }
```

**Frontend — agrega tus páginas:**

```
src/
├── app/
│   └── (app)/
│       ├── dashboard/     ← ya existe
│       └── tu-seccion/    ← tus páginas, ya protegidas por el layout
└── features/
    └── tu-feature/        ← componentes, hooks, server actions
```

El hook `useMe()` ya provee el usuario autenticado en cualquier componente cliente. Las rutas dentro de `(app)/` ya están protegidas por el middleware de sesión.

### Lo que ya no necesitas implementar

- Login, registro y recuperación de cuenta
- Gestión de tokens JWT y refresh
- OAuth con proveedores sociales
- 2FA y backup codes
- Gestión de sesiones activas
- Rate limiting y protección CSRF
- UI completa del panel de usuario

---

## 1. Requisitos del servidor

| Componente | Mínimo recomendado |
|---|---|
| OS | Ubuntu 22.04 LTS / Debian 12 |
| RAM | 2 GB |
| CPU | 2 vCPUs |
| Disco | 20 GB SSD |
| Node.js | 20 LTS |
| PostgreSQL | 15+ |
| Redis | 7+ |

---

## 2. Preparar el servidor

### Actualizar sistema
```bash
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban unzip build-essential
```

### Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # debe mostrar v20.x.x
```

### Instalar pnpm (o npm)
```bash
npm install -g pnpm pm2
```

### Instalar PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Crear usuario y base de datos
sudo -u postgres psql <<EOF
CREATE USER vaultauth WITH PASSWORD 'TU_PASSWORD_FUERTE';
CREATE DATABASE vaultauth OWNER vaultauth;
\q
EOF
```

### Instalar Redis
```bash
apt install -y redis-server
systemctl enable redis-server

# Configurar contraseña para Redis
sed -i 's/# requirepass foobared/requirepass TU_REDIS_PASSWORD/' /etc/redis/redis.conf

# Deshabilitar acceso externo (solo localhost)
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
systemctl restart redis-server
```

---

## 3. Variables de entorno

### Backend — `nest-auth-hybrid/.env.production`

```env
NODE_ENV=production

# Base de datos
DATABASE_URL="postgresql://vaultauth:TU_PASSWORD_FUERTE@localhost:5432/vaultauth"

# Redis
REDIS_URL="redis://:TU_REDIS_PASSWORD@localhost:6379"

# JWT — genera con: openssl rand -base64 64
JWT_ACCESS_SECRET=<64_chars_random>
JWT_REFRESH_SECRET=<64_chars_random>

# TOTP — clave AES-256 para cifrar secrets (exactamente 32 chars)
TOTP_ENC_KEY=<32_chars_random>

# Bcrypt
BCRYPT_ROUNDS=12

# Sesión
SESSION_SECRET=<64_chars_random>
CORS_ORIGINS=https://auth.tudominio.com

# Email (SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx
SMTP_FROM=no-reply@tudominio.com

# OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# URLs de callback
OAUTH_CALLBACK_BASE=https://api.tudominio.com
FRONTEND_URL=https://auth.tudominio.com

# Puerto
PORT=3000
```

### Frontend — `next-auth-hybrid/.env.production`

```env
# URL del backend (server-side)
BACKEND_URL=http://localhost:3000

# URL pública del backend (client-side, si usas rutas absolutas)
NEXT_PUBLIC_API_URL=https://api.tudominio.com

NODE_ENV=production
```

> **Nunca subas `.env.production` a git.** Agrégalo a `.gitignore`.

---

## 4. Construir y ejecutar las apps

### Backend (NestJS)

```bash
cd nest-auth-hybrid

# Instalar dependencias
pnpm install --frozen-lockfile

# Ejecutar migraciones de Prisma
pnpm prisma migrate deploy

# Generar cliente de Prisma
pnpm prisma generate

# Build
pnpm build

# Iniciar con PM2
pm2 start dist/main.js --name "vaultauth-api" --env production
pm2 save
pm2 startup  # sigue las instrucciones que imprime
```

### Frontend (Next.js)

```bash
cd next-auth-hybrid

pnpm install --frozen-lockfile
pnpm build

# Iniciar con PM2
pm2 start "pnpm start" --name "vaultauth-web" --cwd /ruta/al/next-auth-hybrid
pm2 save
```

### Ver logs en tiempo real

```bash
pm2 logs vaultauth-api
pm2 logs vaultauth-web
pm2 monit  # dashboard
```

---

## 5. Reverse proxy con Nginx

### Instalar Nginx

```bash
apt install -y nginx
systemctl enable nginx
```

### Configuración para subdominio API

```nginx
# /etc/nginx/sites-available/api.tudominio.com
server {
    listen 80;
    server_name api.tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS ya lo maneja NestJS — no duplicar aquí

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }
}
```

### Configuración para subdominio Frontend

```nginx
# /etc/nginx/sites-available/auth.tudominio.com
server {
    listen 80;
    server_name auth.tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/auth.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.tudominio.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Activar sitios y recargar

```bash
ln -s /etc/nginx/sites-available/api.tudominio.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/auth.tudominio.com /etc/nginx/sites-enabled/

nginx -t           # verificar sintaxis
systemctl reload nginx
```

---

## 6. Alternativa: Caddy (HTTPS automático)

Caddy obtiene y renueva certificados Let's Encrypt automáticamente, sin configuración adicional.

### Instalar Caddy

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

### Caddyfile

```caddyfile
# /etc/caddy/Caddyfile

api.tudominio.com {
    reverse_proxy localhost:3000

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
    }
}

auth.tudominio.com {
    reverse_proxy localhost:3001

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
    }
}
```

```bash
systemctl enable caddy
systemctl start caddy

# Verificar logs
journalctl -u caddy -f
```

---

## 7. SSL con Let's Encrypt (solo para Nginx)

```bash
apt install -y certbot python3-certbot-nginx

# Asegúrate de que los subdominios ya apuntan al servidor (DNS)
certbot --nginx -d api.tudominio.com -d auth.tudominio.com

# Renovación automática (ya viene preconfigurada como timer de systemd)
systemctl status certbot.timer

# Probar renovación
certbot renew --dry-run
```

---

## 8. DNS — dominios y subdominios

En tu proveedor de DNS (Cloudflare, Namecheap, etc.) crea los siguientes registros **A**:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | `api` | `IP_DE_TU_SERVIDOR` | Auto |
| A | `auth` | `IP_DE_TU_SERVIDOR` | Auto |

> Si usas Cloudflare, activa el **proxy naranja** (CDN) solo después de verificar que el SSL funciona directamente. Para pruebas iniciales, usa solo DNS (nube gris).

---

## 9. Firewall — UFW

```bash
# Reglas básicas
ufw default deny incoming
ufw default allow outgoing

# SSH (cambia el puerto si lo modificaste)
ufw allow 22/tcp

# HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# BLOQUEAR acceso externo a servicios internos
# (PostgreSQL y Redis NO deben ser accesibles desde fuera)
# ufw deny 5432  ← ya bloqueado por "default deny"
# ufw deny 6379  ← ya bloqueado por "default deny"

ufw enable
ufw status verbose
```

---

## 10. Seguridad del servidor

### SSH — desactivar acceso por contraseña

```bash
# Primero asegúrate de tener tu clave SSH configurada y funcionando
# Editar /etc/ssh/sshd_config:
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config

systemctl restart sshd
```

### Fail2ban — proteger SSH y Nginx

```bash
# /etc/fail2ban/jail.local
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled  = true
port     = ssh
maxretry = 5
bantime  = 1h
findtime = 10m

[nginx-http-auth]
enabled = true
EOF

systemctl enable fail2ban
systemctl restart fail2ban
fail2ban-client status
```

### Actualización automática de seguridad

```bash
apt install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

### Rotación de logs

Nginx, PM2 y el sistema ya rotan logs por defecto. Verifica el estado:

```bash
# PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

# Nginx (ya configurado, verificar)
logrotate -d /etc/logrotate.d/nginx
```

---

## 11. Monitoreo básico

```bash
# Estado de los procesos
pm2 status

# Uso de recursos
htop

# Espacio en disco
df -h

# Conexiones activas
ss -tlnp

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 12. Checklist antes de ir a producción

- [ ] Variables de entorno configuradas y **no en git**
- [ ] `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOTP_ENC_KEY`, `SESSION_SECRET` son aleatorios y largos
- [ ] `BCRYPT_ROUNDS` ≥ 12
- [ ] `CORS_ORIGINS` apunta solo al dominio del frontend
- [ ] Migraciones de Prisma ejecutadas (`prisma migrate deploy`)
- [ ] Redis protegido con contraseña y solo en localhost
- [ ] PostgreSQL accesible solo en localhost
- [ ] UFW habilitado con solo 22, 80, 443 abiertos
- [ ] SSH solo por clave pública (contraseñas desactivadas)
- [ ] Fail2ban activo
- [ ] SSL/TLS válido y renovación automática configurada
- [ ] DNS propagado y apuntando al servidor correcto
- [ ] `NODE_ENV=production` en ambas apps
- [ ] PM2 configurado para reiniciarse con el sistema (`pm2 startup`)
- [ ] Backups de la base de datos configurados

---

## 13. Backups de PostgreSQL

```bash
# Script de backup diario
cat > /usr/local/bin/backup-db.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DEST=/var/backups/postgres
mkdir -p $DEST
sudo -u postgres pg_dump vaultauth | gzip > "$DEST/vaultauth_$DATE.sql.gz"
# Borrar backups con más de 30 días
find $DEST -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Programar via cron (cada día a las 3am)
echo "0 3 * * * root /usr/local/bin/backup-db.sh" > /etc/cron.d/postgres-backup
```
