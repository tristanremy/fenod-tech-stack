/**
 * Standalone Cloudflare Worker — deploy + zone route: yourdomain.com/analytics/*
 * Env: RYBBIT_HOST (e.g. https://a.fno.ovh)
 */

const DEFAULT_RYBBIT_HOST = 'https://a.fno.ovh';

function getRybbitHost(envHost?: string): string {
  return (envHost || DEFAULT_RYBBIT_HOST).replace(/\/$/, '');
}

function toRybbitApiUrl(pathname: string, search: string, host: string): string {
  const apiPath = pathname.replace(/^\/analytics\//, '/api/').replace(/^\/analytics$/, '/api');
  return `${host}${apiPath}${search}`;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

async function proxyToRybbit(
  request: Request,
  pathname: string,
  search: string,
  host?: string,
): Promise<Response> {
  const rybbitHost = getRybbitHost(host);
  const rybbitUrl = toRybbitApiUrl(pathname, search, rybbitHost);
  const clientIp = getClientIp(request);

  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set('X-Real-IP', clientIp);
  proxyHeaders.set('X-Forwarded-For', clientIp);
  proxyHeaders.delete('host');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  const response = await fetch(rybbitUrl, {
    method: request.method,
    headers: proxyHeaders,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

interface Env {
  RYBBIT_HOST?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/analytics')) {
      return new Response('Not found', { status: 404 });
    }

    try {
      if (request.method === 'GET' && url.pathname.endsWith('.js')) {
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;

        const response = await proxyToRybbit(request, url.pathname, url.search, env.RYBBIT_HOST);
        if (response.ok) {
          const toCache = response.clone();
          toCache.headers.set('Cache-Control', 'public, max-age=3600');
          ctx.waitUntil(cache.put(cacheKey, toCache));
        }
        return response;
      }

      return await proxyToRybbit(request, url.pathname, url.search, env.RYBBIT_HOST);
    } catch (error) {
      console.error('Rybbit proxy error:', error);
      return new Response('Analytics proxy error', { status: 500 });
    }
  },
};
