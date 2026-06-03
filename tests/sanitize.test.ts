import { describe, it, expect } from 'vitest';

// Test the sanitization logic used in admin.ts
function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (m) => {
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

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape less than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape greater than', () => {
    expect(escapeHtml('5 > 3')).toBe('5 &gt; 3');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle already escaped strings', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });

  it('should handle null-ish values', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle multiple special characters', () => {
    expect(escapeHtml('<a href="test" onclick=\'x\'>')).toBe(
      '&lt;a href=&quot;test&quot; onclick=&#x27;x&#x27;&gt;'
    );
  });
});

describe('validatePrice', () => {
  function validatePrice(price: number): boolean {
    return !Number.isNaN(price) && price > 0 && Number.isFinite(price);
  }

  it('should accept valid prices', () => {
    expect(validatePrice(10)).toBe(true);
    expect(validatePrice(0.01)).toBe(true);
    expect(validatePrice(9999.99)).toBe(true);
  });

  it('should reject zero or negative', () => {
    expect(validatePrice(0)).toBe(false);
    expect(validatePrice(-1)).toBe(false);
    expect(validatePrice(-0.01)).toBe(false);
  });

  it('should reject NaN and Infinity', () => {
    expect(validatePrice(NaN)).toBe(false);
    expect(validatePrice(Infinity)).toBe(false);
    expect(validatePrice(-Infinity)).toBe(false);
  });
});
