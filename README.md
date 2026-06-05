# Adriano de la Rioja · Atelier de Alta Costura

[![Deploy](https://github.com/k-sen6/adrianodelarioja/actions/workflows/deploy.yml/badge.svg)](https://github.com/k-sen6/adrianodelarioja/actions/workflows/deploy.yml)

Sitio web oficial del atelier de alta costura **Adriano de la Rioja**, ubicado en Obispo #508, La Habana Vieja. Moda de autor escultórica con acabados artesanales.

## ✨ Stack Tecnológico

| Capa         | Tecnología                                                           |
|-------------|----------------------------------------------------------------------|
| Frontend    | TypeScript 5 + Vite 6                                                |
| BaaS        | Supabase (Auth, PostgreSQL, RLS)                                     |
| CSS         | Arquitectura modular (variables, base, layout, componentes, admin)   |
| Testing     | Vitest + jsdom                                                       |
| Despliegue  | GitHub Pages + GitHub Actions                                        |
| Proxy CDN   | Cloudflare Worker (para headers de seguridad faltantes)              |
| Contenedor  | Docker + Nginx (para VPS, opcional)                                  |

## 🏛️ Arquitectura

```
public/                          ← Raíz de Vite
├── index.html                   ← Sitio público (CSP inline-safe)
├── admin.html                   ← Panel admin (CSP inline-safe)
└── config.js                    ← Generado por CI (nunca en repo)

src/
├── client/                      ← Código fuente TypeScript
│   ├── main.ts                  ← Entry point público
│   ├── admin.ts                 ← Entry point admin
│   ├── global.d.ts              ← Tipos globales (Supabase, ventana)
│   ├── types.ts                 ← Tipos compartidos
│   ├── components/              ← Componentes UI
│   │   ├── header.ts            ← Navbar + scroll
│   │   ├── hero.ts              ← Hero + typing effect
│   │   ├── product-grid.ts      ← Grid + filtros + paginación
│   │   ├── cart-sidebar.ts      ← Carrito lateral
│   │   ├── auth.ts              ← Login modal + UI
│   │   ├── lightbox.ts          ← Galería lightbox
│   │   ├── stats.ts             ← Contadores animados
│   │   ├── scroll-effects.ts    ← Scroll reveal, progress bar, loader
│   │   └── custom-cursor.ts     ← Cursor personalizado
│   ├── lib/                     ← Servicios
│   │   ├── supabase.ts          ← Cliente Supabase singleton
│   │   ├── auth.ts              ← Auth usuarios (session_token)
│   │   ├── products.ts          ← CRUD productos
│   │   ├── cart.ts              ← Carrito + Supabase
│   │   ├── wishlist.ts          ← Favoritos + Supabase
│   │   └── notifications.ts     ← Toast notifications
│   └── utils/                   ← Utilidades
│       ├── dom.ts               ← Manipulación DOM segura
│       └── sanitize.ts          ← Sanitización de entrada

src/styles/                      ← CSS modular (todo externo)
├── variables.css                ← Tokens de diseño
├── base.css                     ← Reset + tipografía
├── layout.css                   ← Grid, header, hero, footer
├── components.css               ← Cards, carrito, lightbox, etc.
└── admin.css                    ← Estilos del panel admin

tests/                           ← Tests Vitest
├── sanitize.test.ts             ← escapeHtml + validatePrice
└── dom.test.ts                  ← createElement, clearElement, setText

supabase/
└── migration.sql                ← Esquema DB + políticas RLS
```

### Patrón: Zero-Trust DOM

Ninguna cadena de texto ingresada por el usuario se inserta como HTML. Toda la manipulación del DOM usa:

- `document.createElement()` en lugar de `innerHTML`
- `element.textContent` en lugar de `innerHTML`
- `setAttribute()` en lugar de cadenas de atributos
- `addEventListener()` en lugar de `onclick="..."`

## 🔒 Seguridad

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' https://unpkg.com https://*.supabase.co;
style-src 'self' https://fonts.googleapis.com;
img-src 'self' https://i.postimg.cc https://placehold.co data:;
font-src https://fonts.gstatic.com;
connect-src https://*.supabase.co wss://*.supabase.co;
frame-src 'none';
base-uri 'self';
form-action 'self'
```

- **Sin** `'unsafe-inline'` (ni en scripts ni en styles inline)
- **Sin** `'unsafe-eval'` — no se usa `eval()` ni `new Function()`
- **Sin** `onclick` — todos los eventos via `addEventListener`

### Zero Trust Architecture (RLS)

Las políticas de Supabase Row Level Security verifican `session_token` en cada operación. El cliente envía su token vía `supabase.rpc('set_session_token', { token })` al iniciar sesión. Las políticas RLS usan una función SECURITY DEFINER que valida el token contra la DB:

```sql
-- Función helper que traduce session_token → user_id
CREATE OR REPLACE FUNCTION public.get_session_user_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.users
  WHERE session_token = current_setting('app.session_token', true)
  LIMIT 1;
$$;

-- Ejemplo: carrito solo accesible por el dueño del session_token
CREATE POLICY "cart_select" ON public.cart FOR SELECT USING (
  auth.role() = 'authenticated'           -- admins ven todo
  OR user_id = public.get_session_user_id() -- clientes ven solo lo suyo
);
```

### Protecciones adicionales

- **SRI hashes** para scripts externos (Supabase SDK)
- **Rate limiting** en login admin (5 intentos, bloqueo 30s)
- **Sanitización** de entrada: `sanitizeText()`, `validatePrice()`
- **Console statements eliminadas en build producción** (via esbuild.drop)
- **Headers HTTP** via Cloudflare Worker (X-Frame-Options, Permissions-Policy)
- **Sin secrets en repo** — configuración inyectada por GitHub Actions

## 🚀 Desarrollo Local

```bash
# 1. Clonar
git clone https://github.com/k-sen6/adrianodelarioja.git
cd adrianodelarioja

# 2. Instalar dependencias
npm install

# 3. Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Iniciar servidor de desarrollo
npm run dev
# Abre en http://localhost:3000

# 5. TypeScript check
npm run typecheck

# 6. Tests
npm test

# 7. Build de producción
npm run build
```

## 🚢 Despliegue

### GitHub Pages (automático)

Cada push a `main` ejecuta el workflow `.github/workflows/deploy.yml`:

1. Checkout del código
2. Inyección de configuración (secrets → `public/config.js`)
3. `npm ci` + `npm run build`
4. Subida a GitHub Pages

**Secrets requeridos** (Settings → Secrets and variables → Actions):
| Secret | Descripción |
|--------|------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Anon key pública de Supabase |
| `WHATSAPP_NUMBER` | Número WhatsApp para pedidos |

### Docker / VPS (opcional)

```bash
docker compose up -d
# Sirve en http://localhost:8080 con headers de seguridad
```

### Cloudflare Worker (recomendado)

Desplegar `cloudflare/headers-worker.js` en Cloudflare Workers para añadir headers de seguridad que GitHub Pages no permite configurar.

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | TypeScript check + build Vite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` |

## 📁 Estructura de Base de Datos (Supabase)

Ver `supabase/migration.sql` para esquema completo. Tablas:

- **products** — Catálogo (id, name, price, image_url, category)
- **users** — Clientes (id, name, phone, session_token, last_login)
- **cart** — Carritos (id, user_id, product_id, created_at)
- **wishlist** — Favoritos (id, user_id, product_id)
- **profiles** — Admins (vinculado a Supabase Auth)

## ⚠️ Limitaciones Conocidas

Sin un servidor backend propio, hay 3 headers HTTP que GitHub Pages no permite enviar:

| Header | Mitigación |
|--------|-----------|
| `X-Frame-Options` | Cloudflare Worker |
| `Permissions-Policy` | Cloudflare Worker |
| CSRF tokens | SameSite cookies + CSP |

## 📄 Licencia

Todos los derechos reservados © Adriano de la Rioja.
