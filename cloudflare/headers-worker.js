# Cloudflare Workers script to add security headers
# Deploy via: wrangler deploy
# Or add as Page Rule in Cloudflare Dashboard

export default {
  async fetch(request, env) {
    const response = await fetch(request);

    const newHeaders = new Headers(response.headers);

    // Security headers
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
