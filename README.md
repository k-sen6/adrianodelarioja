# Adriano de la Rioja · Atelier de Alta Costura

Sitio web del atelier de moda **Adriano de la Rioja**, ubicado en La Habana Vieja. Catálogo de prendas y calzado hechos a mano, con carrito de compras, panel de administración y pedidos vía WhatsApp.

## Stack

- **Frontend:** HTML + CSS (vanilla) con diseño oscuro/lujo
- **Backend:** Supabase (base de datos, autenticación)
- **CI/CD:** GitHub Actions (inyección segura de claves)
- **Despliegue:** GitHub Pages

## Estructura

```
├── index.html          # Página principal
├── admin.html          # Panel de administración
├── config.example.js   # Plantilla de configuración local
├── js/
│   ├── supabase-client.js  # Cliente Supabase (usa config.js)
│   ├── products.js         # Productos + paginación + búsqueda
│   ├── cart.js             # Carrito de compras
│   ├── auth.js             # Autenticación de usuarios
│   ├── ui.js               # Notificaciones
│   ├── main.js             # Orquestador principal
│   └── config.js           # Constantes públicas
├── css/                # (para futuros estilos externos)
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

Las claves de Supabase se inyectan mediante **GitHub Actions Secrets** en cada `push` a `main`. El archivo `config.js` está en `.gitignore` y nunca se sube al repositorio.

Para configurar los secrets:
1. Ve a Settings → Secrets and variables → Actions
2. Agrega `SUPABASE_URL` y `SUPABASE_ANON_KEY`

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
