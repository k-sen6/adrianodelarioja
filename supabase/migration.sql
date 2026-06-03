-- ============================================
-- MIGRACIÓN: Adriano de la Rioja
-- Schema + Row Level Security (v2 - secure)
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

-- Helper: check if current user is admin (uses Supabase Auth)
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

-- Helper: verify a user_id matches the provided session_token
-- This allows row-level verification without Supabase Auth
CREATE OR REPLACE FUNCTION public.owns_session(uid TEXT, token TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = uid
          AND session_token = token
          AND session_token != ''
    );
$$;

-- PRODUCTS — public read, admin write
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (public.is_admin());

-- USERS — any authenticated user can insert/update their own record
-- Users can only SELECT their own record (by session_token)
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (
    public.is_admin()
    OR (
        session_token IS NOT NULL
        AND session_token != ''
        AND session_token = current_setting('request.headers')::json->>'x-session-token'
    )
);

-- CART — users can only manage their own cart items
-- Verification is done via the custom session_token header
CREATE POLICY "cart_insert_own" ON public.cart FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
          AND session_token = current_setting('request.headers')::json->>'x-session-token'
          AND session_token != ''
    )
);
CREATE POLICY "cart_select_own" ON public.cart FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
          AND session_token = current_setting('request.headers')::json->>'x-session-token'
          AND session_token != ''
    )
);
CREATE POLICY "cart_delete_own" ON public.cart FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
          AND session_token = current_setting('request.headers')::json->>'x-session-token'
          AND session_token != ''
    )
);

-- WISHLIST — same criteria as cart
CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
          AND session_token = current_setting('request.headers')::json->>'x-session-token'
          AND session_token != ''
    )
);
CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
          AND session_token = current_setting('request.headers')::json->>'x-session-token'
          AND session_token != ''
    )
);
CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
          AND session_token = current_setting('request.headers')::json->>'x-session-token'
          AND session_token != ''
    )
);

-- ADMINS — only admins can read the admin table
CREATE POLICY "admins_select" ON public.admins FOR SELECT USING (public.is_admin());

-- ORDERS — admin only
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (public.is_admin());

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON public.users(session_token);

-- ============================================
-- CREAR PRIMER ADMIN (ejecutar después de crear el usuario en Supabase Auth)
-- ============================================
-- INSERT INTO public.admins (user_id, email, name)
-- VALUES ('<UUID_DEL_USUARIO_EN_AUTH>', 'admin@ejemplo.com', 'Admin');
