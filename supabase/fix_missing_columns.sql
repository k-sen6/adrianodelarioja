-- ============================================
-- FIX: Add missing columns to users table
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Add session_token column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS session_token TEXT DEFAULT '';

-- Add last_login column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();

-- Add index on session_token if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_session_token ON public.users(session_token);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
