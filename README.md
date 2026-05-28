# Adriano de la Rioja · Atelier de Alta Costura

Sitio web del atelier de moda **Adriano de la Rioja**, ubicado en La Habana Vieja. Catálogo de prendas y calzado hechos a mano, con carrito de compras, panel de administración y pedidos vía WhatsApp.

## Stack

- **Frontend:** HTML + CSS (vanilla) con diseño oscuro/lujo
- **Backend:** Supabase (base de datos, autenticación)
- **CI/CD:** GitHub Actions (inyección segura de claves via Secrets)
- **Despliegue:** GitHub Pages

## Estructura

```
├── index.html          # Página principal
├── admin.html          # Panel de administración
├── config.example.js   # Plantilla de configuración local
├── js/
│   ├── supabase-client.js  # Cliente Supabase
│   ├── products.js         # Productos + paginación + búsqueda
│   ├── cart.js             # Carrito de compras
│   ├── auth.js             # Autenticación de usuarios
│   ├── ui.js               # Notificaciones con textContent (XSS-safe)
│   ├── main.js             # Orquestador principal
│   ├── helpers.js          # Utilidades compartidas (escapeHtml)
│   └── config.js           # Constantes públicas
├── Note                # Historial de correcciones de seguridad
└── .github/workflows/
    └── deploy.yml      # Inyecta secrets via GitHub Actions
```

## Desarrollo local

1. Clona el repo
2. Copia `config.example.js` como `config.js`
3. Completa tus claves de Supabase en `config.js`
4. Sirve con cualquier servidor estático:

```bash
npx serve .
# o
python3 -m http.server 8000
```

## Seguridad

### Credenciales

Las claves de Supabase y el número de WhatsApp se inyectan mediante **GitHub Actions Secrets** en cada `push` a `main`. El archivo `config.js` está en `.gitignore` y nunca se sube al repositorio.

Para configurar los secrets en tu repositorio:
1. Ve a **Settings → Secrets and variables → Actions**
2. Agrega los siguientes secrets:
   - `SUPABASE_URL` — URL de tu proyecto Supabase
   - `SUPABASE_ANON_KEY` — Anon key de Supabase
   - `WHATSAPP_NUMBER` — Número de WhatsApp (opcional)

### Medidas implementadas

| Medida | Descripción |
|---|---|
| **CSP** | Content Security Policy en index.html y admin.html |
| **SRI** | Integrity hashes en scripts CDN de Supabase |
| **XSS** | escapeHtml() compartido en helpers.js; textContent en lugar de innerHTML |
| **Auth** | Verificación server-side de session_token contra Supabase |
| **Rate limiting** | Control de intentos de login en admin.html |
| **Secrets** | API keys y WhatsApp number inyectados via GitHub Actions Secrets |
| **Git history** | Historial limpiado con git filter-branch (eliminadas keys de commits antiguos) |

## Panel Admin

Accede a `/admin.html` e inicia sesión con el email y contraseña configurados en Supabase Auth.

## Funcionalidades

- Catálogo de productos con filtros y búsqueda
- Paginación (6 productos por página)
- Carrito de compras persistente
- Wishlist (favoritos)
- Pedidos vía WhatsApp
- Panel admin con CRUD de productos
- Modo oscuro/claro automático
- Diseño responsive
- Animaciones y transiciones

## Licencia

Uso interno del taller.
