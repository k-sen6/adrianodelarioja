/**
 * RLS Policy Validation Tests
 *
 * Verifica que las políticas de seguridad en Supabase sean correctas.
 * EJECUTAR EN SUPABASE SQL EDITOR, no en local.
 *
 * Para ejecutar:
 *   1. Ve a https://supabase.com/dashboard/project/_/sql/new
 *   2. Copia y pega el contenido de este archivo
 *   3. Ejecuta
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function suite(name, fn) {
  console.log(`\n# ${name}`);
  fn();
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('═══════════════════════════════════════════');
console.log('  RLS Policy Validation');
console.log('  Código SQL para ejecutar en Supabase:');
console.log('───────────────────────────────────────────\n');

const rlsSQL = `
-- ========== TEST: RLS está habilitado ==========
SELECT 'PRODUCTS RLS activo?' AS test,
  relrowsecurity AS enabled FROM pg_class WHERE relname = 'products'
UNION ALL
SELECT 'USERS RLS activo?', relrowsecurity FROM pg_class WHERE relname = 'users'
UNION ALL
SELECT 'CART RLS activo?', relrowsecurity FROM pg_class WHERE relname = 'cart'
UNION ALL
SELECT 'WISHLIST RLS activo?', relrowsecurity FROM pg_class WHERE relname = 'wishlist'
UNION ALL
SELECT 'ADMINS RLS activo?', relrowsecurity FROM pg_class WHERE relname = 'admins'
UNION ALL
SELECT 'ORDERS RLS activo?', relrowsecurity FROM pg_class WHERE relname = 'orders';

-- ========== TEST: Políticas existentes ==========
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========== TEST: user_has_session existe ==========
SELECT 'user_has_session existe?' AS test,
  COUNT(*) > 0 AS result
FROM pg_proc
WHERE proname = 'user_has_session';

-- ========== TEST: is_admin existe ==========
SELECT 'is_admin existe?' AS test,
  COUNT(*) > 0 AS result
FROM pg_proc
WHERE proname = 'is_admin';

-- ========== TEST: Simular anonimo intenta leer carrito ajeno ==========
-- Debe retornar 0 filas si RLS funciona
-- (ejecutar como anon role en Supabase Dashboard)
-- SELECT * FROM public.cart;
`;

console.log(rlsSQL);

console.log('\n───────────────────────────────────────────');
console.log('  Instrucciones:');
console.log('  1. Ve a Supabase Dashboard > SQL Editor');
console.log('  2. Pega y ejecuta el script de arriba');
console.log('  3. Verifica:');
console.log('     - Todas las tablas tienen RLS = true');
console.log('     - Existen políticas para cart y wishlist');
console.log('     - user_has_session() existe');
console.log('     - is_admin() existe');
console.log(`\n  No hay tests automatizados para RLS`);
console.log('  porque requiere conexión a Supabase.');
console.log('═══════════════════════════════════════════\n');
