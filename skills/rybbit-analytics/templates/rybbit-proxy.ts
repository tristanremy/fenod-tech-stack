const DEFAULT_RYBBIT_HOST = 'https://a.fno.ovh';

export function getRybbitHost(envHost?: string): string {
  return (envHost || DEFAULT_RYBBIT_HOST).replace(/\/$/, '');
}

export function toRybbitApiUrl(pathname: string, search: string, host: string): string {
  const apiPath = pathname.replace(/^\/analytics\//, '/api/').replace(/^\/analytics$/, '/api');
  return `${host}${apiPath}${search}`;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

export async function proxyToRybbit(
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
