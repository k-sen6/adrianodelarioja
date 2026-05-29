import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function suite(name, fn) {
  console.log(`\n# ${name}`);
  fn();
}

function extractCSP(html) {
  const match = html.match(
    /<meta[^>]+Content-Security-Policy[^>]+content="([^"]+)"/
  );
  if (!match) {
    throw new Error('CSP meta tag not found');
  }
  return match[1];
}

function parseCSP(policy) {
  const directives = {};
  for (const part of policy.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...rest] = trimmed.split(/\s+/);
    directives[name] = rest;
  }
  return directives;
}

suite('CSP - index.html', () => {
  const html = readFileSync(
    resolve(__dirname, '..', 'index.html'),
    'utf8'
  );
  const policy = extractCSP(html);
  const directives = parseCSP(policy);

  test('default-src es self', () => {
    assertInclude(directives['default-src'], ["'self'"]);
  });

  test('script-src permite unsafe-inline (necesario para onclick)', () => {
    assert.ok(
      directives['script-src']?.includes("'unsafe-inline'"),
      'script-src debe tener unsafe-inline mientras existan onclick en HTML'
    );
  });

  test('script-src permite self', () => {
    assertInclude(directives['script-src'], ["'self'"]);
  });

  test('script-src permite supabase', () => {
    assertInclude(directives['script-src'], ['https://*.supabase.co']);
  });

  test('script-src permite unpkg', () => {
    assertInclude(directives['script-src'], ['https://unpkg.com']);
  });

  test('existe base-uri', () => {
    assert.ok(
      'base-uri' in directives,
      'base-uri debe estar definida'
    );
    assertInclude(directives['base-uri'], ["'self'"]);
  });

  test('existe form-action', () => {
    assert.ok('form-action' in directives, 'form-action debe estar definida');
    assertInclude(directives['form-action'], ["'self'"]);
  });

  test('frame-src es none', () => {
    assertInclude(directives['frame-src'], ["'none'"]);
  });

  test('connect-src permite supabase', () => {
    assertInclude(directives['connect-src'], ['https://*.supabase.co']);
  });
});

suite('CSP - admin.html', () => {
  const html = readFileSync(
    resolve(__dirname, '..', 'admin.html'),
    'utf8'
  );
  const policy = extractCSP(html);
  const directives = parseCSP(policy);

  test('script-src permite unsafe-inline (necesario para onclick)', () => {
    assert.ok(
      directives['script-src']?.includes("'unsafe-inline'"),
      'script-src debe tener unsafe-inline mientras existan onclick en HTML'
    );
  });

  test('base-uri es self', () => {
    assertInclude(directives['base-uri'], ["'self'"]);
  });

  test('form-action es self', () => {
    assertInclude(directives['form-action'], ["'self'"]);
  });
});

suite('CSP - sin unsafe-eval', () => {
  const html = readFileSync(
    resolve(__dirname, '..', 'index.html'),
    'utf8'
  );
  const policy = extractCSP(html);

  test('no permite unsafe-eval en script-src', () => {
    assert.ok(
      !policy.includes("'unsafe-eval'"),
      'CSP no debe permitir unsafe-eval'
    );
  });
});

function assertInclude(arr, expected) {
  if (!arr) {
    throw new Error(`Expected ${JSON.stringify(expected)} but directive was undefined`);
  }
  for (const val of expected) {
    if (!arr.includes(val)) {
      throw new Error(`Expected ${JSON.stringify(val)} to be in [${arr.join(', ')}]`);
    }
  }
}

console.log(`\n📊 Total: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
