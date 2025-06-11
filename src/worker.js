import { handleXunfeiTtsRequest } from './worker-handlers/xunfei-tts';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/xunfei/tts-ws-url' && request.method === 'GET') {
      return handleXunfeiTtsRequest(request, env);
    }

    // For all other requests, we assume they are for static assets.
    // Wrangler, when [site] is configured in wrangler.toml, will automatically
    // try to serve files from the specified static asset directory.
    // If a file is found, it's served. If not, Wrangler typically returns a 404.
    // We don't need to explicitly call env.ASSETS.fetch(request) here unless we
    // have more complex routing or fallback logic before serving static assets.

    // If the request is not for our API and not found by Wrangler's static asset handling,
    // it will result in a 404 from Wrangler. If you wanted to customize the 404 or
    // other non-API, non-static asset responses, you could add logic here, but for
    // a typical SPA setup with API, this is often sufficient.

    // Let Wrangler handle static asset serving or return its default 404.
    // To be explicit, if you wanted to ensure only assets are served or a custom 404:
    // try {
    //   return await env.ASSETS.fetch(request);
    // } catch (e) {
    //   // Handle cases where the asset is not found, or customize error
    //   let pathname = new URL(request.url).pathname;
    //   if (pathname.startsWith('/api/')) { // Should have been caught above
    //     return new Response('API endpoint not found', { status: 404 });
    //   }
    //   // For non-API routes that are not assets (e.g. deep links in SPA that need index.html)
    //   // Wrangler's [site] configuration often handles SPA routing by serving index.html
    //   // for paths that don't match a file. If not, you might need to serve index.html here.
    //   return new Response(`Asset not found: ${pathname}`, { status: 404 });
    // }
    // However, for most cases with [site] configured, simply not returning a Response
    // from the worker for non-API routes lets Wrangler do its job for static assets.
    // If Wrangler doesn't find an asset, it will serve a 404.
    // If it's an SPA and a route like /some/page is requested, Wrangler (with proper config)
    // can be set to serve index.html.

    // By default, if no route matches above, and [site] is configured,
    // Wrangler will attempt to serve from the static assets. If nothing matches,
    // Wrangler itself will produce the 404. So, no explicit return is needed here
    // for the static asset serving path when relying on [site] bucket.
  },
};
