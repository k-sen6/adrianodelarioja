// js/supabase-client.js
// SOLUCIÓN TEMPORAL - Hardcodeamos las URLs para que funcione

// Configuración directa (temporal)
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__.VYNLGCZSbPFgC7ED28w_ppNKNYcEaYVLy9GSMB1KMvs';

// Verificar que las variables existen
if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL no configurada');
}
if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY no configurada');
}

// Crear cliente Supabase
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Helper para verificar conexión
export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (e) {
    console.error('❌ Excepción:', e);
    return false;
  }
}
