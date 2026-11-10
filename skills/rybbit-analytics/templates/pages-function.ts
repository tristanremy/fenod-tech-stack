import { proxyToRybbit } from '../../lib/rybbit-proxy';

interface Env {
  RYBBIT_HOST?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  if (!url.pathname.startsWith('/analytics')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    return await proxyToRybbit(
      context.request,
      url.pathname,
      url.search,
      context.env.RYBBIT_HOST,
    );
  } catch (error) {
    console.error('Rybbit proxy error:', error);
    return new Response('Analytics proxy error', { status: 500 });
  }
};
