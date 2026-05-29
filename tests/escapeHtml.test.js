import assert from 'node:assert/strict';
import { escapeHtml } from '../js/helpers.js';

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

suite('escapeHtml', () => {
  test('escapa &', () => {
    assert.equal(escapeHtml('&'), '&amp;');
  });

  test('escapa <', () => {
    assert.equal(escapeHtml('<'), '&lt;');
  });

  test('escapa >', () => {
    assert.equal(escapeHtml('>'), '&gt;');
  });

  test('escapa "', () => {
    assert.equal(escapeHtml('"'), '&quot;');
  });

  test("escapa '", () => {
    assert.equal(escapeHtml("'"), '&#x27;');
  });

  test('maneja null', () => {
    assert.equal(escapeHtml(null), '');
  });

  test('maneja undefined', () => {
    assert.equal(escapeHtml(undefined), '');
  });

  test('maneja número 0', () => {
    assert.equal(escapeHtml(0), '0');
  });

  test('escapa string mixto', () => {
    const input = '<script>alert("xss")</script>';
    const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
    assert.equal(escapeHtml(input), expected);
  });

  test('XSS: onclick injection - escapa caracteres especiales', () => {
    const input = '"><img src=x onerror=alert(1)>';
    const result = escapeHtml(input);
    assert.equal(result, '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    assert.ok(result.includes('&lt;'), 'debe escapar <');
    assert.ok(result.includes('&gt;'), 'debe escapar >');
    assert.ok(result.includes('&quot;'), 'debe escapar "');
    assert.ok(!result.includes('<img'), 'no debe tener < sin escapar');
  });

  test('XSS: javascript: URI - texto plano seguro', () => {
    const input = 'javascript:alert(1)';
    const result = escapeHtml(input);
    assert.equal(result, 'javascript:alert(1)');
  });

  test('XSS: cookie steal - escapa comillas', () => {
    const input = "'; document.cookie='xss='+document.cookie";
    const result = escapeHtml(input);
    assert.ok(!result.includes("'"), 'no debe tener comillas sin escapar');
    assert.match(result, /&#x27;/);
  });

  test('string normal no se altera', () => {
    assert.equal(escapeHtml('Hola mundo 123'), 'Hola mundo 123');
  });

  test('string vacío', () => {
    assert.equal(escapeHtml(''), '');
  });
});

suite('Regresión: XSS vectors conocidos', () => {
  const vectors = [
    ['<script>alert(1)</script>', true],
    ['"><script>alert(1)</script>', true],
    ['<img src=x onerror=alert(1)>', true],
    ['<svg onload=alert(1)>', true],
    ['<body onload=alert(1)>', true],
    ['javascript:alert(1)//', false],
    ['"-prompt(1)-"', true],
    ["';-alert(1)-'", true],
    ['<scr<script>ipt>alert(1)</scr</script>ipt>', true],
    ['<a href="javascript:alert(1)">click</a>', true],
  ];

  for (const [vec, shouldEscape] of vectors) {
    test(`neutraliza vector: ${vec.slice(0, 40)}`, () => {
      const result = escapeHtml(vec);
      const hasRawScript = result.includes('<script>');
      if (shouldEscape) {
        assert.ok(!hasRawScript, `contiene <script> sin escapar: ${result}`);
      } else {
        // 'javascript:' no se "escapa" per se, queda como texto plano
        assert.ok(result === vec, `javascript: no debe alterarse`);
      }
    });
  }
});

suite('Integridad: no altera strings seguros', () => {
  const safes = [
    'producto normal',
    'Camisa Azul 2024',
    '$19.99',
    '100% algodón',
    'Calle 123 #45-67',
  ];
  for (const s of safes) {
    test(`safe: "${s}"`, () => {
      assert.equal(escapeHtml(s), s);
    });
  }
});

console.log(`\n📊 Total: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
