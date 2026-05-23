// js/supabase-client.js
import { CONFIG } from './config.js';

// Verificar que las variables existen
if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === '__SUPABASE_URL__') {
  console.warn('⚠️ Supabase URL no configurada.');
}

if (!CONFIG.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY === '__SUPABASE_ANON_KEY__') {
  console.warn('⚠️ Supabase Anon Key no configurada.');
}

// Crear cliente Supabase
export const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
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
