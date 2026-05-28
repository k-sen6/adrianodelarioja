// js/helpers.js
// Funciones de utilidad compartidas

/**
 * Escapa caracteres HTML para prevenir XSS
 * Úsalo siempre que insertes datos dinámicos en innerHTML
 */
export function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      default: return m;
    }
  });
}
