# Tests de Seguridad

## Unit Tests (ejecutar en local)
```bash
npm test
```
- `escapeHtml.test.js` — 29 tests: verifica escapado de `<>&"'` y 10 XSS vectors conocidos
- `csp.test.js` — 13 tests: verifica directivas CSP (base-uri, form-action, sin unsafe-eval)

## RLS Tests (ejecutar en Supabase SQL Editor)
```bash
npm run test:rls   # muestra el SQL a ejecutar
```
O manualmente: pega el contenido de `rls.test.js`(SQL) en Supabase Dashboard > SQL Editor.
