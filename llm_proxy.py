#!/usr/bin/env python3
"""llm_proxy.py — Proxy rotatorio de API keys gratuitas (OpenAI-compatible)

Uso:  python3 llm_proxy.py
Luego apunta cualquier tool a http://localhost:8787/v1

Datos móviles: ~50KB solo cuando todas las keys fallan.
"""

import json, os, re, threading, time, urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
import concurrent.futures

CACHE = os.path.expanduser("~/.llm_proxy_cache.json")
README_URL = "https://raw.githubusercontent.com/alistaitsacle/free-llm-api-keys/main/README_ES.md"
UPSTREAM = "https://aiapiv2.pekpik.com/v1"
HOST, PORT = "localhost", 8787

keys = []
key_idx = 0
key_lock = threading.Lock()

def log(m):
    print(m, flush=True)

def fetch_readme():
    req = urllib.request.Request(README_URL, headers={"User-Agent": "llm-proxy/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode()

def parse_keys(text):
    found, model = [], None
    for line in text.split("\n"):
        m = re.match(r'^###\s+(.+?)\s+`', line)
        if m:
            model = m.group(1).strip()
        if "sk-" in line and "|" in line and model:
            parts = [p.strip().strip("`") for p in line.split("|")]
            if len(parts) >= 3 and parts[1].startswith("sk-"):
                raw = parts[2] or model
                clean = re.sub(r'[^\w\-\.]', '', raw.split("—")[0].split(",")[0].strip())
                found.append({"api_key": parts[1], "model": clean or model,
                    "budget": parts[4].strip() if len(parts) > 4 else "",
                    "rpm": parts[5].strip() if len(parts) > 5 else "",
                    "expires": parts[6].strip() if len(parts) > 6 else ""})
    return found

def test_key(k):
    import requests
    try:
        r = requests.post(f"{UPSTREAM}/chat/completions",
            json={"model": k["model"], "messages": [{"role": "user", "content": "hi"}],
                  "max_tokens": 3, "stream": False},
            headers={"Authorization": f"Bearer {k['api_key']}"},
            timeout=6)
        return r.status_code == 200 and "choices" in r.text
    except:
        return False

def refresh():
    global keys
    log("⟳ Buscando keys en GitHub...")
    try:
        text = fetch_readme()
        candidates = parse_keys(text)
        log(f"  → {len(candidates)} keys. Probando...")
        working = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as ex:
            fut = {ex.submit(test_key, k): k for k in candidates}
            for f in concurrent.futures.as_completed(fut, timeout=35):
                k = fut[f]
                if f.result():
                    working.append(k)
        keys = working
        json.dump({"keys": keys, "ts": time.time()}, open(CACHE, "w"))
        log(f"  ✓ {len(working)} keys activas")
        return len(keys) > 0
    except Exception as e:
        log(f"  ✗ Error: {e}")
        return False

def load_cache():
    global keys
    try:
        d = json.load(open(CACHE))
        ts = d.get("ts") or d.get("timestamp") or 0
        if time.time() - ts < 7200:
            keys = d.get("keys", [])
            if keys:
                log(f"✅ {len(keys)} keys cacheadas (válidas 2h)")
                return True
        else:
            log("⚠️  Cache expirada (>2h), refrescando...")
    except Exception as e:
        log(f"⚠️  Sin cache: {e}")
    return False

def pick_key():
    global key_idx, keys
    with key_lock:
        if not keys:
            return None
        k = keys[key_idx % len(keys)]
        key_idx = (key_idx + 1) % len(keys)
        return k

class Handler(BaseHTTPRequestHandler):
    def _handle(self, body=None):
        path = self.path[4:] if self.path.startswith("/v1/") else self.path.lstrip("/")
        target = f"{UPSTREAM}/{path}"
        key = pick_key()
        if not key:
            self.send_error(503, "No hay keys disponibles")
            return
        hdrs = {k: v for k, v in self.headers.items()
                if k.lower() not in ("host", "content-length", "authorization")}
        hdrs["Authorization"] = f"Bearer {key['api_key']}"
        if body is not None:
            hdrs["Content-Type"] = "application/json"
        try:
            import requests
            r = requests.request(self.command, target, data=body, headers=hdrs, timeout=60)
            self.send_response(r.status_code)
            for k, v in r.headers.items():
                if k.lower() not in ("transfer-encoding", "content-encoding"):
                    self.send_header(k, v)
            self.send_header("Content-Length", str(len(r.content)))
            self.end_headers()
            self.wfile.write(r.content)
        except Exception as e:
            self.send_error(502, str(e))
    def do_GET(self): self._handle()
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        self._handle(self.rfile.read(n) if n else None)
    def do_DELETE(self): self._handle()
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    log("╔═════════════════════════════════╗")
    log("║  LLM Proxy Rotatorio (gratis)  ║")
    log("╚═════════════════════════════════╝")
    if not load_cache():
        refresh()
    if not keys:
        log("❌ No hay keys. Saliendo.")
        exit(1)
    srv = HTTPServer((HOST, PORT), Handler)
    th = threading.Thread(target=srv.serve_forever, daemon=True)
    th.start()
    log(f"\n🚀 http://{HOST}:{PORT}/v1  ← apunta aquí tus agents / chat")
    log(f"   {len(keys)} keys rotando. 0 gasto hasta que se acaben.")
    try:
        while True:
            time.sleep(5)
            if not keys:
                log("\n⟳ Keys agotadas, refrescando...")
                refresh()
    except KeyboardInterrupt:
        log("\n👋 Adiós.")
        srv.shutdown()
