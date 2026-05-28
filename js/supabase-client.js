// js/supabase-client.js
// Las keys se inyectan desde config.js (generado por GitHub Actions)
// En desarrollo, usa placeholders que se reemplazan en build

const SUPABASE_URL = window.__APP_CONFIG__?.supabaseUrl || '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = window.__APP_CONFIG__?.supabaseKey || '__SUPABASE_ANON_KEY__';

if (!SUPABASE_URL || SUPABASE_URL.startsWith('__')) {
  console.error('❌ SUPABASE_URL no configurada — esperando inyección de GitHub Actions');
}
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('__')) {
  console.error('❌ SUPABASE_ANON_KEY no configurada — esperando inyección de GitHub Actions');
}

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
