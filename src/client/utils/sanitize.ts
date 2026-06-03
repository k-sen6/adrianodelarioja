export function sanitizeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeUrl(url: string): string {
  if (!url) return '';
  // Only allow http, https, and data URIs
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) {
    return url;
  }
  return '';
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePrice(price: number): boolean {
  return !Number.isNaN(price) && price > 0 && Number.isFinite(price);
}
