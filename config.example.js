// ============================================
// config.example.js - Plantilla para desarrollo local
// ============================================
// Copia este archivo como config.js y completa tus claves
// IMPORTANTE: config.js está en .gitignore y NO se sube al repo
// En producción, GitHub Actions inyecta los secrets automáticamente
// ============================================

window.__APP_CONFIG__ = {
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'tu-anon-key-aqui',
  buildRun: 'local',
  buildDate: new Date().toISOString()
};
