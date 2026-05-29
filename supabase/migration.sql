-- ============================================
-- MIGRACIÓN: Adriano de la Rioja
-- Schema + Row Level Security
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ========== TABLAS ==========

CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    session_token TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlist (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== ROW LEVEL SECURITY ==========

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    );
$$;

-- PRODUCTS
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (public.is_admin());

-- USERS
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select" ON public.users FOR SELECT USING (public.is_admin() OR session_token IS NOT NULL AND session_token != '');

-- ========== FUNCIÓN DE VERIFICACIÓN ==========
-- Verifica que un user_id tenga una sesión activa (session_token no vacío)
CREATE OR REPLACE FUNCTION public.user_has_session(uid TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = uid
          AND session_token IS NOT NULL
          AND session_token != ''
    );
$$;

-- CART — usuarios solo pueden ver/insertar/eliminar su propio carrito
CREATE POLICY "cart_insert_own" ON public.cart FOR INSERT WITH CHECK (true);
CREATE POLICY "cart_select_own" ON public.cart FOR SELECT USING (user_has_session(user_id));
CREATE POLICY "cart_delete_own" ON public.cart FOR DELETE USING (user_has_session(user_id));

-- WISHLIST — mismos criterios que carrito
CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT WITH CHECK (true);
CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT USING (user_has_session(user_id));
CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE USING (user_has_session(user_id));

-- ADMINS
CREATE POLICY "admins_select" ON public.admins FOR SELECT USING (public.is_admin());

-- ORDERS
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (public.is_admin());

-- ============================================
-- CREAR PRIMER ADMIN (ejecutar después de crear el usuario en Supabase Auth)
-- ============================================
-- INSERT INTO public.admins (user_id, email, name)
-- VALUES ('<UUID_DEL_USUARIO_EN_AUTH>', 'admin@ejemplo.com', 'Admin');
