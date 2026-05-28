// js/config.js
// Las credenciales se cargan desde window.__APP_CONFIG__
// que es inyectado por GitHub Actions en config.js (raíz)
// En desarrollo local, copia config.example.js como config.js

export const CONFIG = {
  SUPABASE_URL: window.__APP_CONFIG__?.supabaseUrl || '__SUPABASE_URL__',
  SUPABASE_ANON_KEY: window.__APP_CONFIG__?.supabaseKey || '__SUPABASE_ANON_KEY__',
  WHATSAPP_NUMBER: '5350979465',
  STORE_ADDRESS: 'Obispo #508, La Habana Vieja',
  STORE_HOURS: '9:00 AM — 6:00 PM',
  SITE_NAME: 'Adriano de la Rioja',
  SITE_DESCRIPTION: 'Atelier de Alta Costura · La Habana'
};
